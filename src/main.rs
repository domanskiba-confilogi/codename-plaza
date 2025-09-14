use crate::uow::{UnitOfWork, UserEntity};
use axum::routing::{get, post};
use axum_cookie::CookieLayer;
use clap::Parser;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use tokio::net::TcpListener;
use crate::intranet::IntranetApi;
use tokio::time::Duration;
use tokio_util::sync::CancellationToken;
use std::collections::HashSet;
use tokio::sync::broadcast;
use std::sync::Arc;
use crate::intranet::IntranetUserDto;
use std::collections::HashMap;

mod middlewares;
mod uow;
mod handlers;
mod validation;
mod intranet;

#[derive(clap::Parser)]
struct Args {
    #[arg(long)]
    db_host: String,

    #[arg(long)]
    db_port: u16,

    #[arg(long)]
    db_username: String,

    #[arg(long)]
    db_password: String,

    #[arg(long)]
    db_database: String,

    #[arg(long)]
    intranet_api_key: String,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let db_pool = PgPoolOptions::new()
        .connect(&format!(
            "postgresql://{}:{}@{}:{}/{}",
            args.db_username, args.db_password, args.db_host, args.db_port, args.db_database
        ))
        .await
        .expect("failed to connect to database");

    sqlx::migrate!()
        .run(&db_pool)
        .await
        .expect("failed to migrate database");

    println!("Database seeded successfully.");

    let auth_router = axum::Router::new()
        .route("/user", get(handlers::get_logged_in_user))
        .layer(axum::middleware::from_fn_with_state(db_pool.clone(), middlewares::must_be_logged_in))
        .route("/login", post(handlers::login));

    let job_titles_router = axum::Router::new()
        .route("/", get(handlers::get_job_titles))
        .route("/license-mappings", get(handlers::get_license_to_job_title_mappings))
        .route("/system-permission-mappings", get(handlers::get_system_permission_to_job_title_mappings))
        .layer(axum::middleware::from_fn_with_state(db_pool.clone(), middlewares::must_be_logged_in));

    let company_departments_router = axum::Router::new()
        .route("/", get(handlers::get_company_departments))
        .layer(axum::middleware::from_fn_with_state(db_pool.clone(), middlewares::must_be_logged_in));

    let mailing_groups_router = axum::Router::new()
        .route("/", get(handlers::get_mailing_groups))
        .layer(axum::middleware::from_fn_with_state(db_pool.clone(), middlewares::must_be_logged_in));

    let system_permissions_router = axum::Router::new()
        .route("/", get(handlers::get_system_permissions).post(handlers::create_system_permission))
        .layer(axum::middleware::from_fn_with_state(db_pool.clone(), middlewares::must_be_logged_in));

    let licenses_router = axum::Router::new()
        .route("/", get(handlers::get_licenses))
        .layer(axum::middleware::from_fn_with_state(db_pool.clone(), middlewares::must_be_logged_in));

    let router = axum::Router::new()
        .nest("/auth", auth_router)
        .nest("/company-departments", company_departments_router)
        .nest("/job-titles", job_titles_router)
        .nest("/mailing-groups", mailing_groups_router)
        .nest("/system-permissions", system_permissions_router)
        .nest("/licenses", licenses_router)
        .with_state(db_pool.clone());

    let intranet_api = IntranetApi::new(args.intranet_api_key);

    let cancellation_token = CancellationToken::new();

    tokio::spawn(intranet_synchronization_background_worker(cancellation_token.clone(), db_pool, intranet_api));

    let tcp_listener = TcpListener::bind("0.0.0.0:8081").await.unwrap();

    axum::serve(tcp_listener, router).await.unwrap();
}

mod intranet_sync {
    enum Status {
        DownloadingIntranetUsers,

        CreatingMissingJobTitle {
            job_title_name: String,
            current_index: i32,
            total: i32,
        },

        CreatingMissingUser {
            full_name: String,
            email: String,
            current_index: i32,
            total: i32,
        },
    }

    struct BackgroundWorker {
        db_pool: Pool<Postgres>
    }

    impl IntranetBackgroundWorker {
        pub fn new(db_pool: Pool<Postgres>) -> Self {
            Self { db_pool }
        }

        // Creates missing job titles synchronized from intranet.
        // Returns hash map representing all needed job title ids only for intranet users from current
        // synchronization.
        async fn create_missing_job_titles(
            cancellation_token: CancellationToken,
            intranet_users: Vec<IntranetUserDto>,
            progress_sender: broadcast::Sender<>
        ) -> Result<HashMap<String, i32>, JobTitleCreationError> {
            type E = JobTitleCreationError;
            let mut job_titles: HashMap<String, i32> = HashMap::new();

            for user in &intranet_users {
                if job_titles.contains_key(&user.job_title) {
                    continue;
                }

                let mut uow = UnitOfWork::new(&db_pool).await.map_err(|error| E::FailedToStartTransaction(error))?;

                let job_title = uow.get_job_title_by_intranet_name(&user.job_title)
                    .await
                    .map_error(|error| E::FailedToCheckJobTitleByIntranetName { error, job_title: user.job_title.clone() })?;

                let job_title_id = match job_title {
                    Some(job_title) => job_title.id,
                    None => {
                        println!("Job title {} does not exist, creating...", user.job_title);

                        let created_job_title_id = uow.create_job_title(None, &user.job_title, None, None)
                        .await
                        .map_err(|error| 
                                E::FailedToCreateJobTitle { error, intranet_job_title_name: user.job_title.clone() }
                        )?;

                        created_job_title_id
                    }
                };

                job_titles.insert(user.job_title.clone(), job_title_id);

                uow.commit().await.map_err(|error| 
                    E::FailedToCommitToDatabase { error, intranet_job_title_name: user.job_title.clone() }
                )?;
            }

            Ok(job_titles)
        }

        async fn create_missing_users(
            cancellation_token: CancellationToken, 
            intranet_users: IntranetUserDto
        ) -> Result<(), UserCreationError> {
            let hashed_password = bcrypt::hash("Confilogi89", 12)
                .map_err(|error| UserCreationError::FailedToHashPassword(error))?;

            for user in &intranet_users {
                let mut uow = UnitOfWork::new(&db_pool)
                    .await
                    .map_err(|error| UserCreationError::FailedToStartTransaction(error))?;

                let user_exists = uow.does_user_exist_by_ad_id(user.id).await
                    .map_err(|error| UserCreationError::FailedToCheckIfUserExistsByAdId { error, ad_id: user.id })?;

                if !user_exists {
                    let job_title_id = *job_titles.get(&user.job_title)
                        .ok_or_else(|| UserCreationError::NeededJobTitleHasNotBeenSynchronized { error, ad_id: user.id })?;

                    let create_user_result = uow.create_user(
                        Some(user.id), 
                        &user.full_name, 
                        &user.email, 
                        hashed_password.clone(), 
                        job_title_id
                    ).await;

                    if let Err(error) = create_user_result {
                        eprintln!("ERROR | FAILED TO CREATE New User: {} ({})", user.full_name, user.email);
                    } else {
                        println!("New user: {} ({})", user.full_name, user.email);
                    }
                }

                uow.commit().await.unwrap();
            }
        }

        async fn run(
            cancellation_token: CancellationToken,
            db_pool: Pool<Postgres>,
            intranet_api: IntranetApi,
        ) {
            loop {
                let intranet_users = intranet_api.download_users().await.unwrap();

                println!("Users synchronization worker received {} users.", users.len());

                tokio::select! {
                    _ = cancellation_token.cancelled() => break,
                        _ = tokio::time::sleep(Duration::from_secs(60)) => {}
                }
            }
        }
    }

    #[derive(Debug)]
    enum IntranetSynchronizationError {
        FailedToCreateJobTitle(JobTitleCreationError),
        FailedToCreateUser(UserCreationError),
        FailedToRemoveUser(UserRemovalError),
    }

    #[derive(Debug)]
    enum JobTitleCreationError {
        FailedToStartTransaction(sqlx::Error),
        FailedToExecuteDBStatement(sqlx::Error),
        FailedToEndTransaction(sqlx::Error),
        FailedToCheckJobTitleByIntranetName { 
            error: sqlx::Error,
            job_title: String
        },
        FailedToCreateJobTitle {
            error: sqlx::Error,
            intranet_job_title_name: String
        }
        FailedToCommitToDatabase {
            error: sqlx::Error,
            intranet_job_title_name: String 
        }
    }

    #[derive(Debug)]
    enum UserCreationError {
        FailedToStartTransaction(sqlx::Error),
        FailedToExecuteDBStatement(sqlx::Error),
        FailedToEndTransaction(sqlx::Error),
        FailedToCheckIfUserExistsByAdId {
            error: sqlx::Error,
            ad_id: i32
        }
    }

    #[derive(Debug)]
    enum UserRemovalError {
        FailedToHashPassword(bcrypt::Error),
        FailedToStartTransaction(sqlx::Error),
        FailedToExecuteDBStatement(sqlx::Error),
        FailedToEndTransaction(sqlx::Error),
    }
}

