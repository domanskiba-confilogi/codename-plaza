use std::sync::Arc;

use axum::response::Html;
use axum::routing::get;
use axum_cookie::CookieLayer;
use clap::Parser;
use rshtml::RsHtml;
use rshtml::traits::RsHtml;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres, Transaction};
use tokio::net::TcpListener;

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

    let html_router = axum::Router::new()
        .route("/", get(handlers::login_page))
        .route(
            "/showcase/login",
            get(handlers::showcase_login_page).post(handlers::showcase_login),
        )
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

mod handlers {
    use std::borrow::Cow;

    use axum::{
        Extension, Form, Json,
        body::Bytes,
        extract::{Path, Request, State},
        http::{self, HeaderMap, StatusCode},
        middleware::Next,
        response::{Html, IntoResponse, Response},
    };
    use axum_cookie::{
        CookieManager,
        cookie::{Cookie, CookieJar},
    };
    use rshtml::traits::RsHtml;
    use sqlx::{Pool, Postgres};

    use crate::{Assets, LoginPage, SessionEntity, ShowcaseLoginPage, UnitOfWork};

    pub async fn login_page() -> Response {
        (
            StatusCode::OK,
            Html(
                LoginPage {
                    username: String::from("hello world"),
                }
                .render()
                .unwrap(),
            ),
        )
            .into_response()
    }

    pub async fn showcase_login_page(Extension(session): Extension<SessionEntity>) -> Response {
        (StatusCode::OK, Html(ShowcaseLoginPage {}.render().unwrap())).into_response()
    }

    #[derive(serde::Serialize, serde::Deserialize)]
    pub enum ShowcaseUser {
        #[serde(rename = "team_agent")]
        Agent,
        #[serde(rename = "team_management")]
        Management,
        #[serde(rename = "team_other")]
        Other,
    }

    #[derive(serde::Serialize, serde::Deserialize)]
    pub struct ShowcaseLoginForm {
        user_type: ShowcaseUser,
    }

    pub async fn showcase_login(
        Extension(session_entity): Extension<SessionEntity>,
        Form(form): Form<ShowcaseLoginForm>,
    ) -> Result<Response, Response> {
        if session_entity.is_logged_in() {
            return Ok((StatusCode::FORBIDDEN, "403 Forbidden").into_response());
        }

        Ok((StatusCode::OK, Json(form)).into_response())
    }

    pub async fn render_assets(Path(fileabspath): Path<String>) -> Response {
        let mut headers = HeaderMap::new();

        fn cow_to_bytes(cow: Cow<'static, [u8]>) -> Bytes {
            match cow {
                Cow::Borrowed(x) => Bytes::from(x),
                Cow::Owned(x) => Bytes::from(x),
            }
        }

        match Assets::get(&fileabspath) {
            Some(content) => {
                if fileabspath.ends_with(".png") {
                    headers.insert(
                        http::header::CONTENT_TYPE,
                        "application/javascript".parse().unwrap(),
                    );
                } else {
                    headers.insert(http::header::CONTENT_TYPE, "text/plain".parse().unwrap());
                };

                (StatusCode::OK, Bytes::from_iter(cow_to_bytes(content.data))).into_response()
            }
            None => (StatusCode::NOT_FOUND, "404 Not found").into_response(),
        }
    }

    pub async fn session_middleware(
        State(state): State<Pool<Postgres>>,
        cookies: CookieManager,
        mut req: Request,
        next: Next,
    ) -> Result<Response, Response> {
        let session = cookies
            .get("session")
            .map(|session| session.to_string())
            .unwrap_or_default()
            .trim_start_matches("session=")
            .to_string();

        let mut should_create_session = false;

        if session.len() != 32 {
            should_create_session = true;
        }

        let mut uow = UnitOfWork::new(state).await.unwrap();

        let mut session_entity = match uow.find_session_by_id(&session).await.unwrap() {
            Some(session_entity) => session_entity,
            None => {
                println!("Should create session");
                should_create_session = true;
                SessionEntity::default()
            }
        };

        if should_create_session {
            let created_id = uow.create_session().await.unwrap();
            session_entity = uow.find_session_by_id(&created_id).await.unwrap().unwrap();

            cookies.add(Cookie::new("session", created_id).with_path("/"));
        }

        req.extensions_mut().insert(session_entity);

        uow.commit().await.unwrap();

        Ok(next.run(req).await)
    }
}

struct TemplateState {
    is_logged_in: bool,
    permissions: Vec<String>,
}

struct TemplateRenderer {
    state: TemplateState,
}

#[derive(RsHtml)]
struct LoginPage {
    username: String,
}

#[derive(RsHtml)]
struct ShowcaseLoginPage {}

struct UnitOfWork<'a> {
    transaction: Transaction<'a, sqlx::Postgres>,
}

impl<'a> UnitOfWork<'a> {
    pub async fn new(pool: Pool<Postgres>) -> Result<Self, sqlx::Error> {
        Ok(Self {
            transaction: pool.begin().await?,
        })
    }

    pub async fn commit(self) -> Result<(), sqlx::Error> {
        self.transaction.commit().await
    }

    pub async fn create_session(&mut self) -> Result<String, sqlx::Error> {
        let mut token = String::new();
        const alphabet: &str = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";

        for _ in 0..32 {
            token.push(
                alphabet
                    .chars()
                    .nth(rand::random::<u32>() as usize % alphabet.len())
                    .unwrap(),
            );
        }

        sqlx::query("INSERT INTO sessions (id) VALUES ($1);")
            .bind(&token)
            .execute(&mut *self.transaction)
            .await?;

        Ok(token)
    }

    pub async fn find_session_by_id(
        &mut self,
        session_id: &str,
    ) -> Result<Option<SessionEntity>, sqlx::Error> {
        sqlx::query_as("SELECT * FROM sessions WHERE id = $1")
            .bind(session_id)
            .fetch_optional(&mut *self.transaction)
            .await
    }

    pub async fn change_logged_in_user_id_inside_session(
        &mut self,
        session_id: &str,
        new_user_id: Option<i32>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE sessions SET logged_in_user_id = $1 WHERE id = $2")
            .bind(new_user_id)
            .bind(session_id)
            .execute(&mut *self.transaction)
            .await?;

        Ok(())
    }

    pub async fn delete_session_by_id(&mut self, session_id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM sessions WHERE id = $1")
            .bind(session_id)
            .execute(&mut *self.transaction)
            .await?;

        Ok(())
    }
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
struct SessionEntity {
    id: String,
    logged_in_user_id: Option<i32>,
}

impl SessionEntity {
    pub fn is_logged_in(&self) -> bool {
        self.logged_in_user_id.is_some()
    }
}
