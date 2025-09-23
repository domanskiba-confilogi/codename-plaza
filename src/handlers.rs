use axum::{
    Json,
    Extension,
    http::StatusCode,
    extract::{State, Query},
    response::{Response, IntoResponse, Redirect}
};
use axum_macros::debug_handler;
use crate::{UnitOfWork, UserEntity, uow};
use tokio::time::{Duration, Instant};
use connector::{*, i18n::*};
use crate::validation::{LoginValidator, CreateSystemPermissionValidator, GetPaginatedDataWithIntegerCursorValidator};
use serde_json::json;
use std::sync::Arc;
use crate::AppState;
use url::Url;
use anyhow::Context;
use crate::uow::JobTitleWithDependencies;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct GetPaginatedDataWithIntegerCursorQuery {
    cursor: Option<i32>,
    per_page: u32,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct GetPaginatedResponse<T> {
    items: Vec<T>,
    total: u32,
    next_cursor: i32
}

pub async fn get_paginated_users(State(state): State<Arc<AppState>>, Query(query): Query<GetPaginatedDataWithIntegerCursorQuery>) -> Result<Response, InternalServerError> {
    if let Err(error) = (GetPaginatedDataWithIntegerCursorValidator {
        cursor: query.cursor,
        per_page: query.per_page
    }.validate()) {
        return Ok(error.into_with_translation(Language::Polish).into_response());
    }

    let mut uow = UnitOfWork::new(state.get_db_pool()).await?;

    let paginated_users = uow.get_paginated_users(query.per_page, query.cursor).await?;

    uow.commit().await?;

    let next_cursor = paginated_users
        .items
        .iter()
        .max_by_key(|(user, _, _)| user.id)
        .map(|(user, _, _)| user.id).unwrap_or(0) + 1;

    return Ok((StatusCode::OK, Json(GetPaginatedResponse {
        items: paginated_users.items.into_iter().map(|(user, job_title, company_department)| {
            UserDto {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                is_active: user.is_active,
                job_title: JobTitleDto {
                    id: job_title.id,
                    intranet_name: job_title.intranet_name,
                    name: job_title.name,
                    parent_job_title_id: job_title.parent_job_title_id,
                    company_department_id: job_title.company_department_id,
                },
                company_department: company_department.map(|company_department| {
                    CompanyDepartmentDto {
                        id: company_department.id,
                        name: company_department.name,
                    }
                })
            }
        }).collect::<Vec<_>>(),

        total: paginated_users.total,
        next_cursor: next_cursor
    })).into_response());
}

#[debug_handler]
pub async fn login(State(state): State<Arc<AppState>>, Json(json): Json<LoginRequestBody>) -> Result<Response, InternalServerError> {
    if let Err(error) = (LoginValidator {
        email: &json.email,
        password: &json.password,
    }.validate()) {
        return Ok(error.into_with_translation(Language::Polish).into_response());
    }

    let mut uow = UnitOfWork::new(state.get_db_pool()).await?;

    let start_timestamp = Instant::now();

    if let Some(user) = uow.find_user_by_email(&json.email).await? {
        let request_minimum_time = rand::random::<u32>() % 300;

        let password_matches = match user.password {
            Some(password) => {
                bcrypt::verify(json.password, &password)?
            }
            None => false
        };

        if !password_matches {
            return Ok(ValidationError {
                property_name: FieldTranslationKey::Email,
                translation: TranslationKey::Validation(ValidationTranslationKey::InvalidCredentials)
            }.into_with_translation(Language::Polish).into_response());
        }

        let authorization_token = uow.create_authorization_token(user.id).await?;

        let authorization_token_ids = uow.get_authorization_token_ids_by_user_id(user.id).await?;

        // User can have max 5 tokens
        if authorization_token_ids.len() > 5 {
            let authorization_token_ids = authorization_token_ids[..(authorization_token_ids.len() - 5)].into_iter().cloned().collect::<Vec<i32>>();

            uow.delete_authorization_tokens_by_ids(&authorization_token_ids).await?;
        }

        let job_title = uow.find_job_title_by_id(user.job_title_id).await?
            .context("Job title should be present, because there is a foreign key.")?;

        let company_department = match job_title.company_department_id {
            Some(company_department_id) => uow.find_company_department_by_id(company_department_id).await?
                .map(|company_department| CompanyDepartmentDto {
                    id: company_department.id,
                    name: company_department.name
                }),
            None => None
        };

        uow.commit().await?;

        let wait_for_ms = (start_timestamp.elapsed().as_millis() as i64 + 300i64) - request_minimum_time as i64;

        if wait_for_ms > 0 {
            tokio::time::sleep(Duration::from_millis(wait_for_ms as u64)).await;
        }

        return Ok((StatusCode::OK, Json(UserDto {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            is_active: user.is_active,
            job_title: JobTitleDto {
                id: job_title.id,
                name: job_title.name,
                intranet_name: job_title.intranet_name,
                parent_job_title_id: job_title.parent_job_title_id,
                company_department_id: job_title.company_department_id,
            },
            company_department,
        })).into_response());
    }

    uow.commit().await.unwrap();

    return Ok(ValidationError {
        property_name: FieldTranslationKey::Email,
        translation: TranslationKey::Validation(ValidationTranslationKey::InvalidCredentials)
    }.into_with_translation(Language::Polish).into_response());
}

#[debug_handler]
pub async fn get_all_permissions(State(state): State<Arc<AppState>>) -> Result<Response, InternalServerError> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await?;

    let permissions = uow.get_all_permissions().await?;

    Ok((StatusCode::OK, Json(permissions.into_iter().map(|permission| PermissionDto {
        id: permission.id,
        human_id: permission.human_id,
        description: permission.description,
    }).collect::<Vec<_>>())).into_response())
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct MicrosoftSignInCallbackQuery {
    code: String,
}

#[debug_handler]
pub async fn microsoft_sign_in_callback(State(state): State<Arc<AppState>>, Query(query): Query<MicrosoftSignInCallbackQuery>) -> Result<Response, InternalServerError> {
    let unauthenticated_client = state.get_unauthenticated_ms_graph_client();

    let access_token_response = unauthenticated_client.request_access_token(&query.code).await?;

    let authenticated_client = unauthenticated_client.into_authenticated_client(access_token_response.access_token, access_token_response.refresh_token);

    let employee_id = match authenticated_client.get_user_employee_id().await? {
        Some(result) => result,
        None => {
            return Ok((StatusCode::BAD_REQUEST, "Your microsoft account does not seem to be inside our Active Directory system. Please contact support at support@confilogi.com to resolve the issue. ERROR: employee_id from microsoft graph is empty.").into_response());
        }
    };

    let mut uow = UnitOfWork::new(state.get_db_pool()).await?;

    let maybe_user = uow.find_user_by_ad_id(employee_id).await?;

    match maybe_user {
        Some(user) => {
            let access_token = uow.create_authorization_token(user.id).await?;

            uow.commit().await?;

            let mut url = Url::parse(&state.frontend_base_url)?.join("/microsoft/callback-success.html")?;

            url.query_pairs_mut()
                .append_pair("access_token", &access_token);

            Ok(Redirect::to(url.as_str()).into_response())
        },
        None => {
            uow.commit().await?;

            Ok((StatusCode::BAD_REQUEST, "User does not exist in our records. Please wait 5 minutes and try again, it might be a synchronization error.").into_response())
        }
    }
}

#[debug_handler]
pub async fn get_microsoft_redirection_uri(State(state): State<Arc<AppState>>) -> Result<Response, InternalServerError> {
    let unauthenticated_client = state.get_unauthenticated_ms_graph_client();

    let login_callback_uri = unauthenticated_client.get_sign_in_redirection_uri()?;

    Ok((StatusCode::OK, Json(json!({
        "redirection_uri": login_callback_uri
    }))).into_response())
}

#[debug_handler]
pub async fn get_logged_in_user(State(state): State<Arc<AppState>>, Extension(user): Extension<UserEntity>) -> Result<Response, InternalServerError> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await?;

    let job_title = uow.find_job_title_by_id(user.job_title_id).await?
        .context("Job title should be present, because there is a foreign key.")?;

    let company_department = match job_title.company_department_id {
        Some(company_department_id) => uow.find_company_department_by_id(company_department_id).await?
            .map(|company_department| CompanyDepartmentDto {
                id: company_department.id,
                name: company_department.name
            }),
        None => None
    };

    Ok((StatusCode::OK, Json(UserDto {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_active: user.is_active,
        job_title: JobTitleDto {
            id: job_title.id,
            name: job_title.name,
            intranet_name: job_title.intranet_name,
            parent_job_title_id: job_title.parent_job_title_id,
            company_department_id: job_title.company_department_id,
        },
        company_department
    })).into_response())
}

pub async fn get_company_departments(State(state): State<Arc<AppState>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await.unwrap();

    let company_departments = uow.get_company_departments().await.unwrap();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(company_departments.into_iter().map(|department| {
        CompanyDepartmentDto {
            id: department.id,
            name: department.name,
        }
    }).collect::<Vec<CompanyDepartmentDto>>())).into_response())
}

pub async fn get_job_titles(State(state): State<Arc<AppState>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await.unwrap();

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

pub async fn get_mailing_groups(State(state): State<Arc<AppState>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await.unwrap();

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

pub async fn get_licenses(State(state): State<Arc<AppState>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await.unwrap();

    let licenses = uow.get_licenses().await.unwrap().into_iter().map(|license| {
        LicenseDto {
            id: license.id,
            name: license.name,
        }
    }).collect::<Vec<LicenseDto>>();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(licenses)).into_response())
}

pub async fn get_license_to_job_title_mappings(State(state): State<Arc<AppState>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await.unwrap();

    let license_mappings = uow.get_license_to_job_title_mappings().await.unwrap().into_iter().map(|mapping| {
        LicenseToJobTitleMappingDto {
            license_id: mapping.license_id,
            job_title_id: mapping.job_title_id
        }
    }).collect::<Vec<LicenseToJobTitleMappingDto>>();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(license_mappings)).into_response())
}

pub async fn get_system_permission_to_job_title_mappings(State(state): State<Arc<AppState>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await.unwrap();

    let license_mappings = uow.get_system_permissions_to_job_title_mappings().await.unwrap().into_iter().map(|mapping| {
        SystemPermissionToJobTitleMappingDto {
            system_permission_id: mapping.system_permission_id,
            job_title_id: mapping.job_title_id
        }
    }).collect::<Vec<SystemPermissionToJobTitleMappingDto>>();

    uow.commit().await.unwrap();

    Ok((StatusCode::OK, Json(license_mappings)).into_response())
}

pub async fn get_system_permissions(State(state): State<Arc<AppState>>) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await.unwrap();

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
    State(state): State<Arc<AppState>>, 
    Json(json): Json<CreateSystemPermissionRequest>
) -> Result<Response, Response> {
    if let Err(error) = (CreateSystemPermissionValidator {
        name: &json.name,
        subpermission_of_id: json.subpermission_of_id.clone(),
    }.validate()) {
        return Err(error.into_with_translation(Language::Polish).into_response());
    }

    let mut uow = UnitOfWork::new(state.get_db_pool()).await.unwrap();

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

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct GetPaginatedJobTitlesResponse {
    items: Vec<(JobTitleDto, CompanyDepartmentDto)>,
    total: u32,
    next_cursor: i32
}

#[debug_handler]
pub async fn get_job_titles_with_dependencies(State(state): State<Arc<AppState>>) -> Result<Response, InternalServerError> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await?;

    let result = uow.get_job_titles_with_dependencies().await?;

    uow.commit().await?;

    return Ok((StatusCode::OK, Json(result.into_iter().map(|JobTitleWithDependencies { job_title, company_department, permission_ids }| {
        JobTitleWithDependenciesDto {
            job_title: JobTitleDto {
                id: job_title.id,
                intranet_name: job_title.intranet_name,
                name: job_title.name,
                parent_job_title_id: job_title.parent_job_title_id,
                company_department_id: job_title.company_department_id,
            },
            company_department: company_department.map(|company_department| {
                CompanyDepartmentDto {
                    id: company_department.id,
                    name: company_department.name,
                }
            }),
            permission_ids
        }
    }).collect::<Vec<_>>())).into_response());
}

#[debug_handler]
pub async fn get_paginated_job_titles(State(state): State<Arc<AppState>>, Query(query): Query<GetPaginatedDataWithIntegerCursorQuery>) -> Result<Response, InternalServerError> {
    if let Err(error) = (GetPaginatedDataWithIntegerCursorValidator {
        cursor: query.cursor,
        per_page: query.per_page
    }.validate()) {
        return Ok(error.into_with_translation(Language::Polish).into_response());
    }

    let mut uow = UnitOfWork::new(state.get_db_pool()).await?;

    let paginated_result = uow.get_paginated_job_titles(query.per_page, query.cursor).await?;

    uow.commit().await?;

    let next_cursor = paginated_result
        .items
        .iter()
        .max_by_key(|item| item.job_title.id)
        .map(|item| item.job_title.id).unwrap_or(0) + 1;

    return Ok((StatusCode::OK, Json(GetPaginatedResponse {
        items: paginated_result.items.into_iter().map(|JobTitleWithDependencies { job_title, company_department, permission_ids }| {
            JobTitleWithDependenciesDto {
                job_title: JobTitleDto {
                    id: job_title.id,
                    intranet_name: job_title.intranet_name,
                    name: job_title.name,
                    parent_job_title_id: job_title.parent_job_title_id,
                    company_department_id: job_title.company_department_id,
                },
                company_department: company_department.map(|company_department| {
                    CompanyDepartmentDto {
                        id: company_department.id,
                        name: company_department.name,
                    }
                }),
                permission_ids
            }
        }).collect::<Vec<_>>(),
        total: paginated_result.total as u32,
        next_cursor: next_cursor
    })).into_response());
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct UpdateJobTitleBody {
    id: i32,
    name: String,
    parent_job_title_id: Option<i32>,
    company_department_id: Option<i32>,
    permission_ids: Vec<i32>,
}

#[debug_handler]
pub async fn update_job_title(State(state): State<Arc<AppState>>, Json(json): Json<UpdateJobTitleBody>) -> Result<Response, InternalServerError> {
    let mut uow = UnitOfWork::new(state.get_db_pool()).await?;

    if !uow.check_if_all_permission_ids_exist(json.permission_ids.clone()).await? {
        return Ok(ValidationError {
            property_name: FieldTranslationKey::PermissionIds,
            translation: TranslationKey::Validation(ValidationTranslationKey::PermissionIdIsInvalid {
                property_name: FieldTranslationKey::PermissionIds,
            })
        }.into_with_translation(Language::Polish).into_response());
    }

    let children_job_titles = uow.get_children_of_job_title_by_id(json.id).await?;

    if let Some(parent_job_title_id) = json.parent_job_title_id {
        if let Some(potential_parent_job_title) = uow.find_job_title_by_id(parent_job_title_id).await? {
            if potential_parent_job_title.parent_job_title_id.is_some() {
                return Ok(BadRequestError::Message { 
                    message: ValidationTranslationKey::ParentJobTitleCantHaveParent.translate(Language::Polish)
                }.into_response());
            }

            if children_job_titles.len() > 0 {
                return Ok(BadRequestError::Message { 
                    message: ValidationTranslationKey::JobTitleCantHaveParentAndChildren.translate(Language::Polish)
                }.into_response());
            }

            let potential_parent_job_title_children_id = uow.get_children_of_job_title_by_id(parent_job_title_id)
                .await?
                .iter()
                .map(|job_title| job_title.id).collect::<Vec<i32>>();

            uow.set_company_department_for_multiple_job_title_ids(potential_parent_job_title_children_id, json.company_department_id).await?;
        } else {
            return Ok(ValidationError {
                property_name: FieldTranslationKey::ParentJobTitleId,
                translation: TranslationKey::Validation(ValidationTranslationKey::ParentJobTitleIdIsInvalid {
                    property_name: FieldTranslationKey::ParentJobTitleId,
                })
            }.into_with_translation(Language::Polish).into_response());
        }
    }


    if children_job_titles.len() > 0 {
        let children_job_title_ids = children_job_titles.iter().map(|job_title| job_title.id).collect::<Vec<i32>>();

        let children_that_are_parents = uow.get_job_titles_from_predefined_list_that_have_children(children_job_title_ids.clone()).await?;

        if children_that_are_parents.len() > 0 {
            return Ok(BadRequestError::Message { 
                message: ValidationTranslationKey::ChildJobTitleCantHaveParentAndChildren.translate(Language::Polish)
            }.into_response());
        }

        uow.set_company_department_for_multiple_job_title_ids(children_job_title_ids, json.company_department_id).await?;
    }

    uow.update_job_title(&uow::UpdateJobTitleArgs {
        id: json.id,
        name: json.name,
        parent_job_title_id: json.parent_job_title_id,
        company_department_id: json.company_department_id,
    }).await?;

    uow.change_job_title_permissions(json.id, json.permission_ids).await?;

    uow.commit().await?;

    Ok((StatusCode::NO_CONTENT, "").into_response())
}

#[derive(Debug)]
pub struct InternalServerError(anyhow::Error);

impl<E> From<E> for InternalServerError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

impl IntoResponse for InternalServerError {
    fn into_response(self) -> Response {
        eprintln!("Internal server error: {self:?}");

        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "500 Internal Server Error",
        )
            .into_response()
    }
}
