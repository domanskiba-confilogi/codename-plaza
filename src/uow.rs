use sqlx::{Pool, Postgres, Transaction};
use std::borrow::Cow;

pub struct UnitOfWork<'a> {
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
        let count: Option<i64> = sqlx::query_scalar!("SELECT COUNT(*) FROM users WHERE email = $1", email.into())
            .fetch_one(&mut *self.transaction)
            .await?;

        return Ok(count == Some(1));
    }

    pub async fn does_user_with_given_id_exists(
        &mut self,
        user_id: i32,
    ) -> Result<bool, sqlx::Error> {
        let count: Option<i64> = sqlx::query_scalar!("SELECT COUNT(*) FROM users WHERE id = $1", user_id)
            .fetch_one(&mut *self.transaction)
            .await?;

        return Ok(count == Some(1));
    }

    pub async fn create_user(
        &mut self,
        email: impl Into<String>,
        full_name: impl Into<String>,
        hashed_password: impl Into<String>,
        role_id: i32,
    ) -> Result<i32, sqlx::Error> {
        sqlx::query_scalar!(
            "INSERT INTO users (email, full_name, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id;",
            email.into(),
            full_name.into(),
            hashed_password.into(),
            role_id
        )
        .fetch_one(&mut *self.transaction)
        .await
    }

    pub async fn delete_user_by_id(&mut self, id: i32) -> Result<(), sqlx::Error> {
        sqlx::query!("DELETE FROM users WHERE id = $1", id)
            .execute(&mut *self.transaction)
            .await?;

        Ok(())
    }

    pub async fn create_authorization_token(&mut self, user_id: i32) -> Result<String, sqlx::Error> {
        let mut token = String::new();
        const ALPHABET: &str = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";

        for _ in 0..64 {
            token.push(
                ALPHABET
                    .chars()
                    .nth(rand::random::<u32>() as usize % ALPHABET.len())
                    .unwrap(),
            );
        }

        sqlx::query!("INSERT INTO authorization_tokens (token, user_id) VALUES ($1, $2);", &token, user_id)
            .execute(&mut *self.transaction)
            .await?;

        Ok(token)
    }

    pub async fn find_user_by_authorization_token(
        &mut self,
        authentication_token: &str
    ) -> Result<Option<UserEntity>, sqlx::Error> {
        sqlx::query_as!(
            UserEntity, 
            "SELECT * FROM users WHERE id = (SELECT user_id FROM authorization_tokens WHERE token = $1)",
            authentication_token
        ).fetch_optional(&mut *self.transaction).await
    }

    pub async fn find_user_by_id(
        &mut self,
        user_id: i32,
    ) -> Result<Option<UserEntity>, sqlx::Error> {
        sqlx::query_as!(UserEntity, "SELECT * FROM users WHERE id = $1;", user_id)
            .fetch_optional(&mut *self.transaction)
            .await
    }

    pub async fn find_user_by_email(
        &mut self,
        email: impl Into<String>,
    ) -> Result<Option<UserEntity>, sqlx::Error> {
        sqlx::query_as!(UserEntity, "SELECT * FROM users WHERE email = $1;", email.into())
            .fetch_optional(&mut *self.transaction)
            .await
    }

    pub async fn find_user_by_role_id(
        &mut self,
        role_id: i32,
    ) -> Result<Vec<UserEntity>, sqlx::Error> {
        sqlx::query_as!(UserEntity, "SELECT * FROM users WHERE role_id = $1;", role_id)
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn get_users(&mut self) -> Result<Vec<UserEntity>, sqlx::Error> {
        sqlx::query_as!(UserEntity, "SELECT * FROM users")
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn get_company_departments(
        &mut self,
    ) -> Result<Vec<CompanyDepartmentEntity>, sqlx::Error> {
        sqlx::query_as!(CompanyDepartmentEntity, "SELECT * FROM company_departments")
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn get_job_titles_for_company_department_id(
        &mut self,
        company_department_id: i32,
    ) -> Result<Vec<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as!(JobTitleEntity, "SELECT * FROM job_titles WHERE company_department_id = $1", company_department_id)
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn get_job_titles(&mut self) -> Result<Vec<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as!(JobTitleEntity, "SELECT * FROM job_titles")
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn get_authorization_token_ids_by_user_id(&mut self, user_id: i32) -> Result<Vec<i32>, sqlx::Error> {
        sqlx::query_scalar!("SELECT id FROM authorization_tokens WHERE user_id = $1 ORDER BY id", user_id)
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn delete_authorization_tokens_by_ids<'b>(&mut self, authorization_tokens: &[i32]) -> Result<(), sqlx::Error> {
        sqlx::query!("DELETE FROM authorization_tokens WHERE id = ANY($1)", authorization_tokens)
            .execute(&mut *self.transaction)
            .await?;

        Ok(())
    }
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct JobTitleEntity {
    pub id: i32,
    pub name: String,
    pub company_department_id: i32,
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct CompanyDepartmentEntity {
    pub id: i32,
    pub name: String,
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct UserEntity {
    pub id: i32,
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub role_id: i32,
}
