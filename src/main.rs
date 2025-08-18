use crate::uow::{UnitOfWork, UserEntity};
use axum::routing::get;
use axum_cookie::CookieLayer;
use clap::Parser;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use tokio::net::TcpListener;

mod middlewares;
mod templating;
mod uow;
mod handlers;

#[cfg(debug_assertions)]
const IS_BUILD_DEBUG: bool = true;
#[cfg(not(debug_assertions))]
const IS_BUILD_DEBUG: bool = false;

#[derive(rust_embed::RustEmbed)]
#[folder = "assets/"]
struct Assets;

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
            full_name: "Bartłomiej Domański".into(),
            ms_token: "ms_token_1".into(),
            role_id: 2,
        },
        UserEntity {
            id: 0,
            email: "oleksa.jacek@confilogi.com".into(),
            full_name: "Jacek Oleksa".into(),
            ms_token: "ms_token_2".into(),
            role_id: 1,
        },
        UserEntity {
            id: 0,
            email: "problem.tomasz@confilogi.com".into(),
            full_name: "Tomasz Problem".into(),
            ms_token: "ms_token_3".into(),
            role_id: 5,
        },
        UserEntity {
            id: 0,
            email: "problem.mateusz@confilogi.com".into(),
            full_name: "Mateusz Problem".into(),
            ms_token: "ms_token_4".into(),
            role_id: 4,
        },
        UserEntity {
            id: 0,
            email: "problem.edward@confilogi.com".into(),
            full_name: "Edward Problem".into(),
            ms_token: "ms_token_5".into(),
            role_id: 3,
        },
    ];

    for user in users_to_seed.iter() {
        if !uow
            .does_user_with_given_email_exists(&user.email)
            .await
            .unwrap()
        {
            uow.create_user(&user.email, &user.full_name, &user.ms_token, user.role_id)
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

    let html_router = axum::Router::new()
        .route("/", get(handlers::login_page))
        .route(
            "/showcase/login",
            get(handlers::showcase_login_page).post(handlers::showcase_login),
        )
        .route("/report", get(handlers::report_problem_page))
        .route("/report/onboarding", get(handlers::report_onboarding_page))
        .layer(axum::middleware::from_fn_with_state(
            db_pool.clone(),
            handlers::session_middleware,
        ))
        .layer(CookieLayer::strict())
        .with_state(db_pool);

    let router = axum::Router::new().merge(html_router).nest(
        "/assets",
        axum::Router::new().route("/{*fileabspath}", get(handlers::render_assets)),
    );

    let tcp_listener = TcpListener::bind("127.0.0.1:8080").await.unwrap();

    axum::serve(tcp_listener, router).await.unwrap();
}
