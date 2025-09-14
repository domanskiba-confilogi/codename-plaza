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
use crate::validation::{LoginValidator, CreateSystemPermissionValidator};

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


    uow.commit().await.unwrap();

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
            intranet_name: job_title.intranet_name,
            company_department_id: job_title.company_department_id,
            parent_job_title_id: job_title.parent_job_title_id,
        }
    }).collect::<Vec<JobTitleDto>>())).into_response())
}

pub async fn get_mailing_groups(State(db_pool): State<Pool<Postgres>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let mailing_groups = uow.get_mailing_groups().await.unwrap().into_iter().map(|mailing_group| {
        MailingGroupDto {
            id: mailing_group.id,
            name: mailing_group.name,
            email: mailing_group.email,
        }
    }).collect::<Vec<MailingGroupDto>>();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(mailing_groups)).into_response())
}

pub async fn get_licenses(State(db_pool): State<Pool<Postgres>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let licenses = uow.get_licenses().await.unwrap().into_iter().map(|license| {
        LicenseDto {
            id: license.id,
            name: license.name,
        }
    }).collect::<Vec<LicenseDto>>();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(licenses)).into_response())
}

pub async fn get_license_to_job_title_mappings(State(db_pool): State<Pool<Postgres>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let license_mappings = uow.get_license_to_job_title_mappings().await.unwrap().into_iter().map(|mapping| {
        LicenseToJobTitleMappingDto {
            license_id: mapping.license_id,
            job_title_id: mapping.job_title_id
        }
    }).collect::<Vec<LicenseToJobTitleMappingDto>>();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(license_mappings)).into_response())
}

pub async fn get_system_permission_to_job_title_mappings(State(db_pool): State<Pool<Postgres>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let license_mappings = uow.get_system_permissions_to_job_title_mappings().await.unwrap().into_iter().map(|mapping| {
        SystemPermissionToJobTitleMappingDto {
            system_permission_id: mapping.system_permission_id,
            job_title_id: mapping.job_title_id
        }
    }).collect::<Vec<SystemPermissionToJobTitleMappingDto>>();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(license_mappings)).into_response())
}

pub async fn get_system_permissions(State(db_pool): State<Pool<Postgres>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let system_permission = uow.get_system_permissions().await.unwrap().into_iter().map(|system_permission| {
        SystemPermissionDto {
            id: system_permission.id,
            name: system_permission.name,
            subpermission_of_id: system_permission.subpermission_of_id,
        }
    }).collect::<Vec<SystemPermissionDto>>();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(system_permission)).into_response())
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct CreateSystemPermissionRequest {
    name: String,
    subpermission_of_id: Option<i32>,
}

pub async fn create_system_permission(
    State(db_pool): State<Pool<Postgres>>, 
    Json(json): Json<CreateSystemPermissionRequest>
) -> Result<Response, Response> {
    if let Err(error) = (CreateSystemPermissionValidator {
        name: &json.name,
        subpermission_of_id: json.subpermission_of_id.clone(),
    }.validate()) {
        return Err(error.into_with_translation(Language::Polish).into_response());
    }
    
    let mut uow = UnitOfWork::new(&db_pool).await.unwrap();

    let system_permission_id = uow.create_system_permission(&json.name, json.subpermission_of_id).await.unwrap();

    let system_permission = uow.find_system_permission_by_id(system_permission_id).await.unwrap().map(|system_permission| {
        SystemPermissionDto {
            id: system_permission.id,
            name: system_permission.name,
            subpermission_of_id: system_permission.subpermission_of_id,
        }
    }).expect("newly created system permission to exist");

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(system_permission)).into_response())
}

