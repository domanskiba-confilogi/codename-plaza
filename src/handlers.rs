use std::{borrow::Cow, collections::HashMap};

use axum::{
    Extension, Form, Json,
    body::Bytes,
    extract::{Path, Request, State},
    http::{self, HeaderMap, StatusCode},
    middleware::Next,
    response::{Html, IntoResponse, Response, Redirect},
};
use axum_cookie::{CookieManager, cookie::Cookie};
use rand::distr::slice::Choose;
use rshtml::traits::RsHtml;
use sqlx::{Pool, Postgres};

use crate::{
    Assets, UnitOfWork, UserEntity,
    templating::{
        ChooseTextFieldItem, LoginPage, ReportOnboardingPage, ReportProblemPage,
        ShowcaseLoginPage, TemplateState,
    },
    uow::SessionEntity,
};

pub async fn login_page(
    State(state): State<Pool<Postgres>>,
    Extension(session): Extension<SessionEntity>,
) -> Response {
    if session.is_logged_in() {
        return (StatusCode::FORBIDDEN, "403 Forbidden").into_response();
    }

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

    Ok(Redirect::to("/").into_response())
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
    if !session.is_logged_in() {
        return Ok((StatusCode::FORBIDDEN, "403 Forbidden").into_response());
    }

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

pub async fn report_onboarding_page(
    State(state): State<Pool<Postgres>>,
    Extension(session): Extension<SessionEntity>,
) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&state).await.unwrap();

    let company_departments = uow.get_company_departments().await.unwrap();
    let job_titles_with_company_departments = uow.get_job_titles().await.unwrap();

    let possible_company_departments = company_departments
        .into_iter()
        .map(|company_department| ChooseTextFieldItem {
            value: company_department.id,
            display_text: company_department.name,
        })
        .collect();

    let mut possible_job_titles_for_company_departments: HashMap<
    i32,
    Vec<ChooseTextFieldItem<i32>>,
    > = HashMap::new();

    job_titles_with_company_departments
        .into_iter()
        .for_each(|job_title| {
            let mut job_titles = possible_job_titles_for_company_departments
                .remove(&job_title.company_department_id)
                .unwrap_or_default();

            job_titles.push(ChooseTextFieldItem {
                display_text: job_title.name,
                value: job_title.id,
            });

            possible_job_titles_for_company_departments
                .insert(job_title.company_department_id, job_titles);
        });

    uow.commit().await.unwrap();

    Ok((
        StatusCode::OK,
        Html(
            ReportOnboardingPage {
                state: TemplateState::fetch(&state, session).await,
                possible_company_departments,
                possible_job_titles_for_company_departments,
            }
                .render()
                .unwrap(),
        ),
    )
        .into_response())
}
