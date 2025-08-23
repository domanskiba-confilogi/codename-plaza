use crate::uow::{UnitOfWork, UserEntity};
use axum::routing::{get, post};
use axum_cookie::CookieLayer;
use clap::Parser;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use tokio::net::TcpListener;

mod middlewares;
mod uow;
mod handlers;

#[cfg(debug_assertions)]
const IS_BUILD_DEBUG: bool = true;
#[cfg(not(debug_assertions))]
const IS_BUILD_DEBUG: bool = false;

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
}

async fn seed(db_pool: &Pool<Postgres>) {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let users_to_seed = vec![
        UserEntity {
            id: 0,
            email: "domanski.bartlomiej@confilogi.com".into(),
            password: "$2y$10$r/Q98wo137XzK6TQ.dTv0ewSgHLCq7a10P9EukVMj3eb9kY2ZQgyW".into(),
            full_name: "Bartłomiej Domański".into(),
            role_id: 2,
        },
        UserEntity {
            id: 0,
            email: "oleksa.jacek@confilogi.com".into(),
            password: "$2y$10$r/Q98wo137XzK6TQ.dTv0ewSgHLCq7a10P9EukVMj3eb9kY2ZQgyW".into(),
            full_name: "Jacek Oleksa".into(),
            role_id: 1,
        },
        UserEntity {
            id: 0,
            email: "problem.tomasz@confilogi.com".into(),
            password: "$2y$10$r/Q98wo137XzK6TQ.dTv0ewSgHLCq7a10P9EukVMj3eb9kY2ZQgyW".into(),
            full_name: "Tomasz Problem".into(),
            role_id: 5,
        },
        UserEntity {
            id: 0,
            email: "problem.mateusz@confilogi.com".into(),
            password: "$2y$10$r/Q98wo137XzK6TQ.dTv0ewSgHLCq7a10P9EukVMj3eb9kY2ZQgyW".into(),
            full_name: "Mateusz Problem".into(),
            role_id: 4,
        },
        UserEntity {
            id: 0,
            email: "problem.edward@confilogi.com".into(),
            password: "$2y$10$r/Q98wo137XzK6TQ.dTv0ewSgHLCq7a10P9EukVMj3eb9kY2ZQgyW".into(),
            full_name: "Edward Problem".into(),
            role_id: 3,
        },
    ];

    for user in users_to_seed.iter() {
        if !uow
            .does_user_with_given_email_exists(&user.email)
            .await
            .unwrap()
        {
            uow.create_user(&user.email, &user.full_name, &user.password, user.role_id)
                .await
                .unwrap();
        }
    }

    uow.commit().await.unwrap();
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

    if IS_BUILD_DEBUG {
        seed(&db_pool).await;
    }

    println!("Database seeded successfully.");

    let api_router = axum::Router::new()
        .route("/login", post(handlers::login))
        .route("/user", post(handlers::get_logged_in_user));

    let router = axum::Router::new()
        .nest("/api", api_router)
        .with_state(db_pool);

    let tcp_listener = TcpListener::bind("127.0.0.1:8081").await.unwrap();

    axum::serve(tcp_listener, router).await.unwrap();
}
