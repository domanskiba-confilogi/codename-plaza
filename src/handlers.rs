use axum::{
    Json,
    Extension,
    http::StatusCode,
    extract::State,
    response::{Response, IntoResponse}
};
use axum_macros::debug_handler;
use sqlx::{Pool, Postgres};
use crate::{UnitOfWork, UserEntity};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct LoginRequestBody {
    email: String,
    password: String,
}

#[debug_handler]
pub async fn login(State(pool): State<Pool<Postgres>>, Json(json): Json<LoginRequestBody>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&pool).await.unwrap();

    if let Some(user) = uow.find_user_by_email(&json.email).await.unwrap() {
        let password_matches = bcrypt::verify(json.password, &user.password).unwrap();

        if !password_matches {
            return Err((StatusCode::UNAUTHORIZED, "401 Unauthorized").into_response())
        }

        return Ok((StatusCode::OK, Json(UserDto::from(user))).into_response());
    }

    Err((StatusCode::UNAUTHORIZED, "401 Unauthorized").into_response())
}

#[debug_handler]
pub async fn get_logged_in_user(Extension(user): Extension<UserEntity>) -> Response {
    (StatusCode::OK, Json(UserDto::from(user))).into_response()
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct UserDto {
    id: i32,
    email: String,
    password: String,
    full_name: String,
}

impl From<UserEntity> for UserDto {
    fn from(value: UserEntity) -> Self {
        Self {
            id: value.id,
            email: value.email,
            password: value.password,
            full_name: value.full_name
        }
    }
}
