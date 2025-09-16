use crate::uow::{UnitOfWork, UserEntity};
use axum::routing::{get, post};
use clap::Parser;
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use crate::intranet::IntranetApi;
use tokio_util::sync::CancellationToken;
use tokio::sync::broadcast;

mod middlewares;
mod uow;
mod handlers;
mod validation;
mod intranet;
mod intranet_sync;

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

    let (progress_sender, progress_receiver) = broadcast::channel(128);

    let log_processor_worker = IntranetBackgroundWorkerLogProcessor::new(progress_receiver);

    tokio::spawn(log_processor_worker.run(cancellation_token.clone()));

    let worker = intranet_sync::BackgroundWorker::new(db_pool, intranet_api, progress_sender);
    tokio::spawn(worker.run(cancellation_token.clone()));

    let tcp_listener = TcpListener::bind("0.0.0.0:8081").await.unwrap();

    axum::serve(tcp_listener, router).await.unwrap();
}

use crate::intranet_sync::Status;
use std::sync::Arc;

struct IntranetBackgroundWorkerLogProcessor {
    receiver: broadcast::Receiver<Arc<intranet_sync::Status>>,
}

impl IntranetBackgroundWorkerLogProcessor {
    pub fn new(
        receiver: broadcast::Receiver<Arc<intranet_sync::Status>>,
    ) -> Self {
        Self {
            receiver
        }
    }

    pub async fn run(mut self, cancellation_token: CancellationToken) {
        loop {
            let status = tokio::select! {
                _ = cancellation_token.cancelled() => break,
                Ok(status) = self.receiver.recv() => status,
            };

            match &*status {
                Status::DownloadingIntranetUsers => println!("downloading intranet users"),
                Status::DownloadingIntranetUsersFinished => println!("finished downloading intranet users"),
                Status::JobTitleSynchronizationFinished { .. } => println!("finished job title sync"),
                Status::UserSynchronizationFinished { .. } => println!("finished users sync"),
                Status::UserSynchronizationError { current_item, total, error } => eprintln!("Error occured on user synchronization ({}/{}): {:?}", current_item, total, error),
                Status::JobTitleSynchronizationError { current_item, total, error } => eprintln!("Error occured on job titlesynchronization ({}/{}): {:?}", current_item, total, error),
                _ => {}
            };
        }
    }
}
