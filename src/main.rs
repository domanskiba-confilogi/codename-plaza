use axum::routing::get;
use axum_cookie::CookieLayer;
use clap::Parser;
use rshtml::RsHtml;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres, Transaction};
use tokio::net::TcpListener;

mod middlewares;

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

    if !uow
        .does_user_with_given_email_exists("domanski.bartlomiej@confilogi.com")
        .await
        .unwrap()
    {
        uow.create_user(
            "domanski.bartlomiej@confilogi.com",
            "Bartłomiej Domański",
            "somemstoken1",
            2,
        )
        .await
        .unwrap();
    }
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

    println!("Database seeded successfully.");

    let html_router = axum::Router::new()
        .route("/", get(handlers::login_page))
        .route(
            "/showcase/login",
            get(handlers::showcase_login_page).post(handlers::showcase_login),
        )
        .route("/report", get(handlers::report_problem_page))
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
    use axum_cookie::{CookieManager, cookie::Cookie};
    use rshtml::traits::RsHtml;
    use sqlx::{Pool, Postgres};

    use crate::{
        Assets, LoginPage, ReportProblemPage, SessionEntity, ShowcaseLoginPage, TemplateState,
        UnitOfWork, UserEntity,
    };

    pub async fn login_page(
        State(state): State<Pool<Postgres>>,
        Extension(session): Extension<SessionEntity>,
    ) -> Response {
        (
            StatusCode::OK,
            Html(
                LoginPage {
                    state: TemplateState::fetch(&state, session).await,
                    username: String::from("hello world"),
                }
                .render()
                .unwrap(),
            ),
        )
            .into_response()
    }

    pub async fn showcase_login_page(
        State(state): State<Pool<Postgres>>,
        Extension(session): Extension<SessionEntity>,
    ) -> Result<Response, Response> {
        if session.is_logged_in() {
            return Ok((StatusCode::FORBIDDEN, "403 Forbidden").into_response());
        }

        let mut uow = UnitOfWork::new(&state).await.unwrap();

        let users = uow.get_users().await.unwrap();

        uow.commit().await.unwrap();

        Ok((
            StatusCode::OK,
            Html(
                ShowcaseLoginPage {
                    state: TemplateState::fetch(&state, session).await,
                    users,
                }
                .render()
                .unwrap(),
            ),
        )
            .into_response())
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
        user_id: i32,
    }

    pub async fn showcase_login(
        State(state): State<Pool<Postgres>>,
        Extension(session_entity): Extension<SessionEntity>,
        Form(form): Form<ShowcaseLoginForm>,
    ) -> Result<Response, Response> {
        if session_entity.is_logged_in() {
            return Ok((StatusCode::FORBIDDEN, "403 Forbidden").into_response());
        }

        let mut uow = UnitOfWork::new(&state).await.unwrap();

        uow.change_logged_in_user_id_inside_session(&session_entity.id, Some(form.user_id))
            .await
            .unwrap();

        uow.commit().await.unwrap();

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

        let mut uow = UnitOfWork::new(&state).await.unwrap();

        let mut session_entity = match uow.find_session_by_id(&session).await.unwrap() {
            Some(session_entity) => session_entity,
            None => {
                println!("Should create session");
                should_create_session = true;
                SessionEntity::default()
            }
        };

        if let Some(user_id) = session_entity.logged_in_user_id {
            match uow.find_user_by_id(user_id).await.unwrap() {
                Some(user) => {
                    req.extensions_mut().insert(Some(user));
                }
                None => {
                    req.extensions_mut().insert(None::<UserEntity>);
                    should_create_session = true;
                }
            };
        }

        if should_create_session {
            let created_id = uow.create_session().await.unwrap();
            session_entity = uow.find_session_by_id(&created_id).await.unwrap().unwrap();

            cookies.add(Cookie::new("session", created_id).with_path("/"));
        }

        req.extensions_mut().insert(session_entity);

        uow.commit().await.unwrap();

        Ok(next.run(req).await)
    }

    pub async fn report_problem_page(
        State(state): State<Pool<Postgres>>,
        Extension(session): Extension<SessionEntity>,
    ) -> Result<Response, Response> {
        Ok((
            StatusCode::OK,
            Html(
                ReportProblemPage {
                    state: TemplateState::fetch(&state, session).await,
                }
                .render()
                .unwrap(),
            ),
        )
            .into_response())
    }
}

struct TemplateState {
    logged_in_user: Option<UserEntity>,
}

impl TemplateState {
    pub async fn fetch(db_pool: &Pool<Postgres>, session_entity: SessionEntity) -> Self {
        let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

        let logged_in_user = match session_entity.logged_in_user_id {
            Some(user_id) => Some(
                uow.find_user_by_id(user_id)
                    .await
                    .unwrap()
                    .expect("user inside session to exist"),
            ),
            None => None,
        };

        Self { logged_in_user }
    }

    pub fn is_logged_in(&self) -> bool {
        self.logged_in_user.is_some()
    }
}

struct TemplateRenderer {
    state: TemplateState,
}

#[derive(RsHtml)]
struct LoginPage {
    state: TemplateState,
    username: String,
}

#[derive(RsHtml)]
struct ShowcaseLoginPage {
    state: TemplateState,
    users: Vec<UserEntity>,
}

#[derive(RsHtml)]
struct ReportProblemPage {
    state: TemplateState,
}

struct UnitOfWork<'a> {
    transaction: Transaction<'a, sqlx::Postgres>,
}

impl<'a> UnitOfWork<'a> {
    pub async fn new(pool: &Pool<Postgres>) -> Result<Self, sqlx::Error> {
        Ok(Self {
            transaction: pool.begin().await?,
        })
    }

    pub async fn commit(self) -> Result<(), sqlx::Error> {
        self.transaction.commit().await
    }

    pub async fn does_user_with_given_email_exists(
        &mut self,
        email: impl Into<String>,
    ) -> Result<bool, sqlx::Error> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE email = $1")
            .bind(email.into())
            .fetch_one(&mut *self.transaction)
            .await?;

        return Ok(count == 1);
    }

    pub async fn does_user_with_given_id_exists(
        &mut self,
        user_id: i64,
    ) -> Result<bool, sqlx::Error> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(&mut *self.transaction)
            .await?;

        return Ok(count == 1);
    }

    pub async fn create_user(
        &mut self,
        email: impl Into<String>,
        full_name: impl Into<String>,
        ms_token: impl Into<String>,
        role_id: i32,
    ) -> Result<i32, sqlx::Error> {
        sqlx::query_scalar(
            "INSERT INTO users (email, full_name, ms_token, role_id) VALUES ($1, $2, $3, $4) RETURNING id;",
        )
        .bind(email.into())
        .bind(full_name.into())
        .bind(ms_token.into())
        .bind(role_id)
        .fetch_one(&mut *self.transaction)
        .await
    }

    pub async fn delete_user_by_id(&mut self, id: i32) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&mut *self.transaction)
            .await?;

        Ok(())
    }

    pub async fn create_session(&mut self) -> Result<String, sqlx::Error> {
        let mut token = String::new();
        const ALPHABET: &str = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";

        for _ in 0..32 {
            token.push(
                ALPHABET
                    .chars()
                    .nth(rand::random::<u32>() as usize % ALPHABET.len())
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

    pub async fn find_user_by_id(
        &mut self,
        user_id: i32,
    ) -> Result<Option<UserEntity>, sqlx::Error> {
        sqlx::query_as("SELECT * FROM users WHERE id = $1;")
            .bind(user_id)
            .fetch_optional(&mut *self.transaction)
            .await
    }

    pub async fn find_user_by_role_id(
        &mut self,
        role_id: i32,
    ) -> Result<Vec<UserEntity>, sqlx::Error> {
        sqlx::query_as("SELECT * FROM users WHERE role_id = $1;")
            .bind(role_id)
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn get_users(&mut self) -> Result<Vec<UserEntity>, sqlx::Error> {
        sqlx::query_as("SELECT * FROM users")
            .fetch_all(&mut *self.transaction)
            .await
    }
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
struct SessionEntity {
    id: String,
    pub logged_in_user_id: Option<i32>,
}

impl SessionEntity {
    pub fn is_logged_in(&self) -> bool {
        self.logged_in_user_id.is_some()
    }
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
struct UserEntity {
    id: i32,
    email: String,
    full_name: String,
    ms_token: String,
    role_id: i32,
}
