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
use std::borrow::Cow;
use connector::*;
use serde_json::json;
use tokio::time::{Duration, Instant};
use connector::{*, i18n::*};
use crate::validation::LoginValidator;

#[debug_handler]
pub async fn login(State(pool): State<Pool<Postgres>>, Json(json): Json<LoginRequestBody>) -> Result<Response, Response> {
    if let Err(error) = (LoginValidator {
        email: &json.email,
        password: &json.password,
    }.validate()) {
        return Err(error.into_with_translation(Language::Polish).into_response());
    }

    let mut uow = UnitOfWork::new(&pool).await.unwrap();

    let start_timestamp = Instant::now();

    if let Some(user) = uow.find_user_by_email(&json.email).await.unwrap() {
        let request_minimum_time = rand::random::<u32>() % 300;

        let password_matches = bcrypt::verify(json.password, &user.password).unwrap();

        if !password_matches {
            return Err(ValidationError {
                property_name: FieldTranslationKey::Email,
                translation: TranslationKey::Validation(ValidationTranslationKey::InvalidCredentials)
            }.into_with_translation(Language::Polish).into_response());
        }

        let authorization_token = uow.create_authorization_token(user.id).await.unwrap();

        let authorization_token_ids = uow.get_authorization_token_ids_by_user_id(user.id).await.unwrap();

        // User can have max 5 tokens
        if authorization_token_ids.len() > 5 {
            let authorization_token_ids = authorization_token_ids[..(authorization_token_ids.len() - 5)].into_iter().cloned().collect::<Vec<i32>>();

            uow.delete_authorization_tokens_by_ids(&authorization_token_ids).await.unwrap();
        }

        uow.commit().await.unwrap();

        let mut wait_for_ms = (start_timestamp.elapsed().as_millis() as i64 + 300i64) - request_minimum_time as i64;

        if wait_for_ms > 0 {
            tokio::time::sleep(Duration::from_millis(wait_for_ms as u64)).await;
        }

        return Ok((StatusCode::OK, Json(LoginResponse {
            user: UserDto {
                id: user.id,
                email: user.email,
                full_name: user.full_name
            },
            authorization_token,
        })).into_response());
    }

    return Err(ValidationError {
        property_name: FieldTranslationKey::Email,
        translation: TranslationKey::Validation(ValidationTranslationKey::InvalidCredentials)
    }.into_with_translation(Language::Polish).into_response());
}

#[debug_handler]
pub async fn get_logged_in_user(Extension(user): Extension<UserEntity>) -> Response {
    (StatusCode::OK, Json(UserDto {
        id: user.id,
        email: user.email,
        full_name: user.full_name
    })).into_response()
}

pub async fn get_company_departments(State(db_pool): State<Pool<Postgres>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let company_departments = uow.get_company_departments().await.unwrap();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(company_departments.into_iter().map(|department| {
        CompanyDepartmentDto {
            id: department.id,
            name: department.name,
        }
    }).collect::<Vec<CompanyDepartmentDto>>())).into_response())
}

pub async fn get_job_titles(State(db_pool): State<Pool<Postgres>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let job_titles = uow.get_job_titles().await.unwrap();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(job_titles.into_iter().map(|job_title| {
        JobTitleDto {
            id: job_title.id,
            name: job_title.name,
            company_department_id: job_title.company_department_id,
        }
    }).collect::<Vec<JobTitleDto>>())).into_response())
}

pub async fn get_external_permissions(State(db_pool): State<Pool<Postgres>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let permissions = uow.get_external_permissions().await.unwrap().into_iter().map(|external_permission| {
        ExternalPermissionDto {
            id: external_permission.id,
            name: external_permission.name,
        }
    }).collect::<Vec<ExternalPermissionDto>>();

    Ok((StatusCode::OK, Json(permissions)).into_response())
}

pub struct UnauthorizedError {}

impl UnauthorizedError {
    pub fn new() -> Self {
        Self {}
    }
}

impl IntoResponse for UnauthorizedError {
    fn into_response(self) -> Response {
        (StatusCode::UNAUTHORIZED, Json(json!({
            "title": "Unauthorized",
            "message": "You are unauthorized to view this resource."
        }))).into_response()
    }
}
