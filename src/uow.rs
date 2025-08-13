use sqlx::{Pool, Postgres, Transaction};

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

    pub async fn get_company_departments(
        &mut self,
    ) -> Result<Vec<CompanyDepartmentEntity>, sqlx::Error> {
        sqlx::query_as("SELECT * FROM company_departments")
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn get_job_titles_for_company_department_id(
        &mut self,
        company_department_id: i32,
    ) -> Result<Vec<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as("SELECT * FROM job_titles WHERE company_department_id = $1")
            .bind(company_department_id)
            .fetch_all(&mut *self.transaction)
            .await
    }

    pub async fn get_job_titles(&mut self) -> Result<Vec<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as("SELECT * FROM job_titles")
            .fetch_all(&mut *self.transaction)
            .await
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
pub struct SessionEntity {
    pub id: String,
    pub logged_in_user_id: Option<i32>,
}

impl SessionEntity {
    pub fn is_logged_in(&self) -> bool {
        self.logged_in_user_id.is_some()
    }
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct UserEntity {
    pub id: i32,
    pub email: String,
    pub full_name: String,
    pub ms_token: String,
    pub role_id: i32,
}
