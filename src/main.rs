use crate::uow::{UnitOfWork, UserEntity};
use axum::routing::{get, post};
use clap::Parser;
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use crate::intranet::IntranetApi;
use tokio_util::sync::CancellationToken;

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

    let worker = intranet_sync::BackgroundWorker::new(db_pool, intranet_api);
    tokio::spawn(worker.run(cancellation_token.clone()));


    let tcp_listener = TcpListener::bind("0.0.0.0:8081").await.unwrap();

    axum::serve(tcp_listener, router).await.unwrap();
}

mod intranet_sync {
    use sqlx::Pool;
    use sqlx::Postgres;
    use crate::intranet::IntranetApi;
    use crate::intranet::IntranetUserDto;
    use tokio::time::Duration;
    use tokio_util::sync::CancellationToken;
    use tokio::sync::broadcast;
    use std::collections::HashMap;
    use crate::UnitOfWork;
    use std::sync::Arc;

    #[derive(Debug)]
    enum Status {
        DownloadingIntranetUsers,

        CreatingJobTitlesChunk {
            job_titles: Vec<String>,
            current_index: u32,
            total_items: u32,
        },

        SynchronizingUsers {
            users: Vec<String>,
            current_index: u32,
            total_items: u32
        },

        FailedToSynchronizeUser {
            error: UserSynchronizationError,
            user_id: Option<i32>,
            ad_id: Option<i32>,
        }
    }

    pub struct BackgroundWorker {
        db_pool: Pool<Postgres>,
        intranet_api: IntranetApi,
    }

    impl BackgroundWorker {
        pub fn new(db_pool: Pool<Postgres>, intranet_api: IntranetApi) -> Self {
            Self { db_pool, intranet_api }
        }

        // Creates missing job titles synchronized from intranet.
        // Returns hash map representing all needed job title ids only for intranet users from current
        // synchronization.
        async fn create_missing_job_titles(
            cancellation_token: CancellationToken,
            db_pool: &Pool<Postgres>,
            intranet_users: &[IntranetUserDto],
            progress_sender: broadcast::Sender<Arc<Status>>
        ) -> Result<HashMap<String, i32>, JobTitleCreationError> {
            let mut job_titles: HashMap<String, i32> = HashMap::new();

            let process_chunk = async |
            cancellation_token: CancellationToken,
            db_pool: &Pool<Postgres>, 
            job_titles_chunk: &[String], 
            job_titles_cache: &mut HashMap<String, i32>
            | -> Result<(), JobTitleCreationError> {
                type E = JobTitleCreationError;

                let mut uow = UnitOfWork::new(&db_pool).await.map_err(|error| E::FailedToStartTransaction(error))?;

                for job_title_to_process in job_titles_chunk {
                    let job_title_entity = uow.get_job_title_by_intranet_name(job_title_to_process)
                        .await
                        .map_err(|error| E::FailedToCheckJobTitleByIntranetName { 
                            error, 
                            job_title: job_title_to_process.clone() 
                        })?;

                    let job_title_id = match job_title_entity {
                        Some(job_title) => job_title.id,
                        None => {
                            println!("Job title {} does not exist, creating...", job_title_to_process);

                            let created_job_title_id = uow.create_job_title(None, job_title_to_process, None, None)
                                .await
                                .map_err(|error| E::FailedToCreateJobTitle { 
                                    error, 
                                    intranet_job_title_name: job_title_to_process.clone() 
                                })?;

                            created_job_title_id
                        }
                    };

                    job_titles_cache.insert(job_title_to_process.clone(), job_title_id);
                }

                uow.commit().await.map_err(|error| E::FailedToCommitToDatabase { 
                    error, 
                    intranet_job_titles_chunk: job_titles_chunk.into_iter().cloned().collect::<Vec<String>>(), 
                })?;

                Ok(())
            };

            // extract unique job titles
            let mut intranet_job_titles = intranet_users.iter()
                .map(|user| user.job_title.clone())
                .collect::<Vec<String>>();

            intranet_job_titles.dedup();

            // prepare data for processing
            let total_to_synchronize = intranet_job_titles.len() as u32;

            let (
                intranet_job_titles_chunks, 
                intranet_job_titles_chunk_remainder
            ) = intranet_job_titles.as_chunks::<10>();

            let mut total_synchronized: u32 = 0;

            // process chunks
            for intranet_job_titles_chunk in intranet_job_titles_chunks {
                let _ = progress_sender.send(Arc::new(Status::CreatingJobTitlesChunk {
                    job_titles: intranet_job_titles_chunk.iter().cloned().collect::<Vec<String>>(),
                    current_index: total_synchronized,
                    total_items: total_to_synchronize
                })).unwrap();

                process_chunk(
                    cancellation_token.clone(),
                    &db_pool,
                    intranet_job_titles_chunk, 
                    &mut job_titles
                ).await?;

                total_synchronized += intranet_job_titles_chunk.len() as u32;
            }

            // process remainder
            let _ = progress_sender.send(Arc::new(Status::CreatingJobTitlesChunk {
                job_titles: intranet_job_titles_chunk_remainder.iter().cloned().collect::<Vec<String>>(),
                current_index: total_synchronized,
                total_items: total_to_synchronize
            })).unwrap();

            process_chunk(
                cancellation_token,
                &db_pool, 
                intranet_job_titles_chunk_remainder,
                &mut job_titles
            ).await?;

            Ok(job_titles)
        }

        async fn synchronize_users_from_intranet(
            &self,
            cancellation_token: CancellationToken, 
            intranet_users: &[IntranetUserDto],
            job_title_cache: &HashMap<String, i32>,
            progress_sender: broadcast::Sender<Arc<Status>>
        ) -> Result<(), UserSynchronizationError> {

            let process_chunk = async |
            cancellation_token: CancellationToken,
            db_pool: &Pool<Postgres>,
            hashed_password: &str,
            users_chunk: &[IntranetUserDto],
            job_title_cache: &HashMap<String, i32>
            | -> Result<(), UserSynchronizationError> {
                type E = UserSynchronizationError;

                // Update already existing users if their data has changed

                for already_existing_user in already_existing_users {
                }

                Ok(())
            };


            todo!()
        }

        pub async fn run(
            self,
            cancellation_token: CancellationToken,
        ) {
            loop {
                let intranet_users = self.intranet_api.download_users().await.unwrap();

                println!("Users synchronization worker received {} users.", intranet_users.len());

                let (progress_sender, progress_reader) = broadcast::channel(2148);

                let job_title_cache = Self::create_missing_job_titles(cancellation_token.clone(), &self.db_pool, &intranet_users, progress_sender.clone()).await.unwrap();

                self.synchronize_users_from_intranet(cancellation_token.clone(), &intranet_users, &job_title_cache, progress_sender).await.unwrap();

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
        FailedToCreateUser(UserSynchronizationError),
        FailedToRemoveUser(UserRemovalError)
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
        },
        FailedToCommitToDatabase {
            error: sqlx::Error,
            intranet_job_titles_chunk: Vec<String>,
        }
    }

    #[derive(Debug)]
    enum UserSynchronizationError {
        FailedToStartTransaction(sqlx::Error),
        FailedToExecuteDBStatement(sqlx::Error),
        FailedToEndTransaction(sqlx::Error),
        FailedToHashPassword(bcrypt::BcryptError),
        FailedToGetJobTitleIdFromCache(String),
        FailedToGetJobTitleNameFromCache(i32),
        ExistingUserDoesNotHaveAdId { user_id: i32, user_email: String, user_full_name: String },
        FailedToFindCorrespondingIntranetUserByAdIdForUserEntity {
            user_id: i32,
            user_ad_id: i32,
            user_email: String,
            user_full_name: String,
        },
        FailedToGetUsersByMultipleAdIds {
            error: sqlx::Error,
            ad_ids: Vec<i32>,
        },
        FailedToCheckIfUserExistsByAdId {
            error: sqlx::Error,
            ad_id: i32
        },
        FailedToCreateUser {
            error: sqlx::Error,
            intranet_user: IntranetUserDto,
        },
        FailedToUpdateUser {
            error: sqlx::Error,
            intranet_user: IntranetUserDto,
        },
        FailedToGetIntranetUserByAdIdFromCache(i32),
        FailedToCommitTransaction(sqlx::Error),
    }

    #[derive(Debug)]
    enum UserRemovalError {
        FailedToHashPassword(bcrypt::BcryptError),
        FailedToStartTransaction(sqlx::Error),
        FailedToExecuteDBStatement(sqlx::Error),
        FailedToEndTransaction(sqlx::Error)
    }

    struct UserSynchronizationBackgroundWorker<'a> {
        cancellation_token: CancellationToken,
        db_pool: &'a Pool<Postgres>,
        // Job title cache (Intranet name to our database's internal ID mapping)
        job_title_cache: &'a HashMap<String, i32>,
        progress_sender: broadcast::Sender<Arc<Status>>,
    }

    impl<'a> UserSynchronizationBackgroundWorker<'a> {
        pub fn new() -> Self {
            Self {
                cancellation_token: CancellationToken,
                db_pool: &Pool<Postgres>,
                job_title_cache: &HashMap<String, i32>,
                progress_sender: broadcast::Sender<Arc<Status>>,
            }
        }

        pub fn run(users: &[IntranetUserDto]) {
            // Hash password
            let hashed_password = bcrypt::hash("Confilogi89", 12)
                .map_err(|error| UserSynchronizationError::FailedToHashPassword(error))?;

            // prepare data for processing
            let total_to_synchronize = intranet_users.len() as u32;

            let (
                intranet_users_chunks, 
                intranet_users_chunk_remainder
            ) = intranet_users.as_chunks::<10>();

            let mut total_synchronized: u32 = 0;

            // process chunks
            for intranet_users_chunk in intranet_users_chunks {
                self.process_chunk(total_synchronized, total_to_synchronize, intranet_users_chunk).await?;

                total_synchronized += intranet_users_chunk.len() as u32;
            }

            // process remainder
            self.process_chunk(intranet_users_chunk_remainder, total_synchronized, total_to_synchronize).await?;
        }

        pub async fn process_chunk(&self, chunk: &[IntranetUserDto], total_synchronized: u32, total_to_synchronize: u32) {
            if let Err(error) = self.progress_sender.send(Arc::new(Status::SynchronizingUsers {
                users: chunk.iter().map(|user| format!("User: {} | Email: {}", user.full_name, user.email)).collect::<Vec<String>>(),
                current_index: total_synchronized,
                total_items: total_to_synchronize
            })) {
                eprintln!("Failed to send synchronization status via progress sender (receiver may not read messages?): {error:?}");
            }

            let ad_ids = chunk.iter().map(|user| user.id).collect::<Vec<i32>>();

            let mut uow = UnitOfWork::new(&db_pool)
                .await
                .map_err(|error| E::FailedToStartTransaction(error))?;

            let already_existing_users = uow.get_users_by_multiple_ad_ids(&ad_ids)
                .await
                .map_err(|error| E::FailedToGetUsersByMultipleAdIds { error, ad_ids })?;

            // 
            // WARN: .any() method on std::iter::Map modifies the value. Please do not search inside this
            // iterator. It probably won't have an item that you expect. 
            // (In case somebody reuses already_existing_ad_ids variable)
            //
            let mut already_existing_ad_ids = already_existing_users
                .iter()
                .map(|user| user.ad_id);

            let non_existent_intranet_users = users_chunk
                .iter()
                .filter(|user| !already_existing_ad_ids.any(|already_existing_ad_id| already_existing_ad_id.expect("Select should have selected users with ad_id already set.") == user.id));

            for user in non_existent_intranet_users {
                if let Err(error) = create_non_existent_user(uow, user) {
                    if let Err(error) = progress_sender.send(Arc::new(Status::FailedToSynchronizeUser {
                        error,
                        ad_id: Some(user.id),
                        user_id: None,
                    })) {
                        eprintln!("Failed to send synchronization status via progress sender (receiver may not read messages?): {error:?}");
                    }
                }
            }

            for user in already_existing_users {
                let intranet_user = match chunk.iter().find(|intranet_user| intranet_user.id == user.ad_id) {
                    Some(result) => result,
                    None => {
                        if let Err(error) = progress_sender.send(Arc::new(Status::FailedToSynchronizeUser {
                            error: UserSynchronizationError::FailedToFindCorrespondingIntranetUserByAdIdForUserEntity {
                                user_id: user.id,
                                user_ad_id: user.ad_id,
                                user_email: user.email.clone(),
                                user_full_name: user.full_name.clone()
                            },
                            user_id: Some(user.id),
                            ad_id: None,
                        })) {
                            eprintln!("Failed to send synchronization status via progress sender (receiver may not read messages?): {error:?}");
                        }
                    }
                };

                if let Err(error) = synchronize_existing_user(uow, user, )
            }

            if let Err(error) = uow.commit().await {
                if let Err(error) = progress_sender.send(Arc::new(Status::FailedToSynchronizeUser {
                    error: E::FailedToCommitTransaction(error), user_id: None, ad_id: None,
                }) {
                    eprintln!("Failed to send synchronization status via progress sender (receiver may not read messages?): {error:?}");
                }
            }

            Ok(())
        }

        pub async fn synchronize_existing_user(&self, uow: &mut UnitOfWork, user: UserEntity, intranet_user: &IntranetUserDto) 
            -> Result<(), UserSynchronizationError>
        {
            type E = UserSynchronizationError;

            // If error from this line occurs, then something weird is happening, because the only
            // invocation of this function should only be done from a place where users are
            // selected BY AD_ID INSIDE DB
            let current_user_ad_id = user.ad_id
                .ok_or_else(|| UserSynchronizationError::ExistingUserDoesNotHaveAdId {
                    user_id: user.id,
                    user_email: user.email.to_string(),
                    user_full_name: user.full_name.to_string(),
                })?;

            // Get intranet's job title name of currently set job title for user in our db
            let currently_set_job_title_as_intranet_name = self.job_title_cache.clone().into_iter()
                .find(|(cached_job_title_name, cached_job_title_id)| *cached_job_title_id == user.job_title_id)
                .map(|(cached_job_title_name, _)| cached_job_title_name)
                .ok_or_else(|| {
                    E::FailedToGetJobTitleNameFromCache(already_existing_user.job_title_id)
                })?;

            // Get corresponding user from current intranet fetch matching user from our db

            let intranet_user = users_chunk.iter()
                .find(|user| user.id == current_user_ad_id)
                .ok_or_else(|| {
                    E::FailedToGetIntranetUserByAdIdFromCache(
                        already_existing_user.ad_id.expect("Select should have selected users with ad_id already set.")
                    )
                })?;

            // if not equal, then update
            let is_eq = intranet_user.email == already_existing_user.email && 
                intranet_user.full_name == already_existing_user.full_name && 
                *currently_set_job_title_as_intranet_name == intranet_user.job_title;

            if !is_eq {
                let new_job_title_id = job_title_cache.get(&intranet_user.job_title)
                    .ok_or_else(|| {
                        E::FailedToGetJobTitleIdFromCache(intranet_user.job_title.clone())
                    })?;

                let _ = uow.update_user(
                    already_existing_user.id, 
                    Some(intranet_user.id), // ad_id
                    &intranet_user.full_name, 
                    &intranet_user.email, 
                    hashed_password,
                    *new_job_title_id
                ).await
                    .map_err(|error| E::FailedToUpdateUser { error, intranet_user: intranet_user.clone() })?;
            }
        }

        pub async fn create_non_existent_user(&self, uow: &mut UnitOfWork, user: &IntranetUserDto) -> Result<(), UserSynchronizationError> {
            type E = UserSynchronizationError;

            let job_title_id = self.job_title_cache.get(&user.job_title)
                .ok_or_else(|| {
                    E::FailedToGetJobTitleIdFromCache(user.job_title.clone())
                })?;

            let _ = uow.create_user(
                Some(user.id),
                &user.full_name,
                &user.email,
                None,
                *job_title_id
            )
                .await
                .map_err(|error| E::FailedToCreateUser { error, intranet_user: non_existent_intranet_user.clone() })?;
        }
    }
}

