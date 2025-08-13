use std::{collections::HashMap, fmt::Display};

use rshtml::RsHtml;
use sqlx::{Pool, Postgres};

use crate::uow::{SessionEntity, UnitOfWork, UserEntity};

pub struct TemplateState {
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

pub struct TemplateRenderer {
    pub state: TemplateState,
}

#[derive(RsHtml)]
pub struct ReportOnboardingPage {
    pub state: TemplateState,
    pub possible_company_departments: Vec<ChooseTextFieldItem<i32>>,
    pub possible_job_titles_for_company_departments: HashMap<i32, Vec<ChooseTextFieldItem<i32>>>,
}

#[derive(RsHtml)]
pub struct LoginPage {
    pub state: TemplateState,
    pub username: String,
}

#[derive(RsHtml)]
pub struct ShowcaseLoginPage {
    pub state: TemplateState,
    pub users: Vec<UserEntity>,
}

#[derive(RsHtml)]
pub struct ReportProblemPage {
    pub state: TemplateState,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ChooseTextFieldItem<T: Display> {
    pub display_text: String,
    pub value: T,
}
