use sqlx::{Pool, Postgres, Transaction, Row, postgres::PgRow};
use std::fmt;

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

    pub async fn create_user<'b>(
        &mut self,
        args: &'b CreateUserArgs
    ) -> Result<i32, sqlx::Error> {
        sqlx::query_scalar!(
            "INSERT INTO users (ad_id, email, full_name, password, job_title_id, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;",
            args.ad_id,
            args.email,
            args.full_name,
            args.hashed_password,
            args.job_title_id,
            args.is_active
        )
            .fetch_one(&mut *self.transaction)
        .await
    }

    pub async fn update_user(
        &mut self,
        args: &UpdateUserArgs
    ) -> Result<(), sqlx::Error> {
        let _ = sqlx::query!(
            "UPDATE users SET ad_id = $1, email = $2, full_name = $3, password = $4, job_title_id = $5, is_active = $6 WHERE id = $7;",
            args.ad_id,
            args.email,
            args.full_name,
            args.hashed_password,
            args.job_title_id,
            args.is_active,
            args.id
        )
            .execute(&mut *self.transaction)
        .await?;

        Ok(())
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

    pub async fn find_user_by_ad_id(
        &mut self,
        ad_id: i32
    ) -> Result<Option<UserEntity>, sqlx::Error> {
        sqlx::query_as!(UserEntity, "SELECT * FROM users WHERE ad_id = $1;", ad_id)
            .fetch_optional(&mut *self.transaction)
        .await
    }

    pub async fn get_paginated_users(&mut self, per_page: u32, cursor: Option<i32>) -> Result<PaginationResult<(UserEntity, JobTitleEntity, Option<CompanyDepartmentEntity>)>, sqlx::Error> {
        let cursor = cursor.unwrap_or(0);

        let rows: Vec<PgRow> = sqlx::query("
SELECT 
    users.id as user_id, 
    users.ad_id as user_ad_id, 
    users.full_name as user_full_name, 
    users.email as user_email, 
    users.password as user_password, 
    users.is_active as user_is_active,
    users.job_title_id as user_job_title_id, 

    job_titles.intranet_name as job_title_intranet_name, 
    job_titles.name as job_title_name, 
    job_titles.parent_job_title_id as job_title_parent_job_title_id, 
    job_titles.company_department_id as job_title_company_department_id, 

    company_departments.name as company_department_name
FROM 
    users 
INNER JOIN job_titles ON job_titles.id = users.job_title_id 
LEFT JOIN company_departments ON company_departments.id = job_titles.company_department_id 
WHERE users.id >= $1 
LIMIT $2
            ")
            .bind(cursor)
            .bind(per_page as i64)
            .fetch_all(&mut *self.transaction)
            .await?;

        let mut result = Vec::with_capacity(rows.len());

        for row in rows.into_iter() {
            let maybe_company_department_id: Option<i32> = row.try_get(10)?;

            let company_department_entity = match maybe_company_department_id {
                Some(id) => Some(CompanyDepartmentEntity {
                    id,
                    name: row.try_get(11)?,
                }),
                None => None,
            };

            result.push((
                UserEntity {
                    id: row.try_get(0)?,
                    ad_id: row.try_get(1)?,
                    full_name: row.try_get(2)?,
                    email: row.try_get(3)?,
                    password: row.try_get(4)?,
                    is_active: row.try_get(5)?,
                    job_title_id: row.try_get(6)?,
                },
                JobTitleEntity {
                    id: row.try_get(6)?,
                    intranet_name: row.try_get(7)?,
                    name: row.try_get(8)?,
                    parent_job_title_id: row.try_get(9)?,
                    company_department_id: maybe_company_department_id,
                },
                company_department_entity
            ))
        }

        let total: i64 = sqlx::query_scalar!("SELECT COUNT(*) FROM users;")
            .fetch_one(&mut *self.transaction)
            .await?
            .unwrap_or(0);

        Ok(
            PaginationResult {
                items: result,
                total: total as u32,
            }
        )
    }

    pub async fn get_users_by_multiple_ad_ids(
        &mut self,
        ad_ids: &[i32]
    ) -> Result<Vec<UserEntity>, sqlx::Error> {
        sqlx::query_as!(UserEntity, "SELECT * FROM users WHERE ad_id = ANY($1)", ad_ids)
            .fetch_all(&mut *self.transaction)
        .await
    }

    pub async fn find_user_by_job_title_id(
        &mut self,
        job_title_id: i32,
    ) -> Result<Vec<UserEntity>, sqlx::Error> {
        sqlx::query_as!(UserEntity, "SELECT * FROM users WHERE job_title_id = $1;", job_title_id)
            .fetch_all(&mut *self.transaction)
        .await
    }

    pub async fn get_users(&mut self) -> Result<Vec<UserEntity>, sqlx::Error> {
        sqlx::query_as!(UserEntity, "SELECT * FROM users")
            .fetch_all(&mut *self.transaction)
        .await
    }

    pub async fn does_user_exist_by_ad_id(
        &mut self,
        ad_id: i32,
    ) -> Result<bool, sqlx::Error> {
        let count: Option<i64> = sqlx::query_scalar!("SELECT COUNT(*) FROM users WHERE ad_id = $1", ad_id)
            .fetch_one(&mut *self.transaction)
        .await?;

        Ok(count == Some(1))
    }

    pub async fn get_company_departments(
        &mut self,
    ) -> Result<Vec<CompanyDepartmentEntity>, sqlx::Error> {
        sqlx::query_as!(CompanyDepartmentEntity, "SELECT * FROM company_departments")
            .fetch_all(&mut *self.transaction)
        .await
    }

    pub async fn find_company_department_by_id(&mut self, id: i32) -> Result<Option<CompanyDepartmentEntity>, sqlx::Error> {
        sqlx::query_as!(CompanyDepartmentEntity, "SELECT * FROM company_departments WHERE id = $1", id)
            .fetch_optional(&mut *self.transaction)
        .await
    }

    pub async fn get_paginated_job_titles(&mut self, per_page: u32, cursor: Option<i32>) -> Result<PaginationResult<JobTitleWithDependencies>, sqlx::Error> {
        let cursor = cursor.unwrap_or(0);

        let rows: Vec<PgRow> = sqlx::query("
SELECT
	jt.id,
	jt.intranet_name,
	jt.name,
	jt.parent_job_title_id,
	jt.company_department_id,
        cd.name as company_department_name,
	ARRAY(
		SELECT p.id 
		FROM job_titles_have_permissions jtp 
		JOIN permissions p ON p.id = jtp.permission_id 
		WHERE jtp.job_title_id = jt.id 
		ORDER BY p.id
	) AS permission_ids,
	ARRAY(
		SELECT p.name
		FROM job_titles_have_permissions jtp 
		JOIN permissions p ON p.id = jtp.permission_id 
		WHERE jtp.job_title_id = jt.id 
		ORDER BY p.id
	) AS permission_names
FROM job_titles jt 
LEFT JOIN company_departments cd ON cd.id = jt.company_department_id 
WHERE jt.id >= $1 
ORDER BY jt.id ASC 
LIMIT $2;
            ")
            .bind(cursor)
            .bind(per_page as i64)
            .fetch_all(&mut *self.transaction)
            .await?;

        let mut result = Vec::with_capacity(rows.len());

        for row in rows.into_iter() {
            let maybe_company_department_id: Option<i32> = row.try_get(4)?;

            let company_department_entity = match maybe_company_department_id {
                Some(id) => Some(CompanyDepartmentEntity {
                    id,
                    name: row.try_get(5)?,
                }),
                None => None,
            };

            let permission_ids: Vec<i32> = row.try_get(6)?;
            let permission_names: Vec<String> = row.try_get(7)?;

            let mut permissions = Vec::with_capacity(permission_ids.len());

            for (index, permission_name) in permission_names.into_iter().enumerate() {
                permissions.push(PermissionEntity {
                    id: *permission_ids.get(index).expect("permission_names to be the same length as permission_ids"),
                    name: permission_name
                });
            }

            result.push(
                JobTitleWithDependencies {
                    job_title: JobTitleEntity {
                        id: row.try_get(0)?,
                        intranet_name: row.try_get(1)?,
                        name: row.try_get(2)?,
                        parent_job_title_id: row.try_get(3)?,
                        company_department_id: maybe_company_department_id,
                    },
                    company_department: company_department_entity,
                    permissions,
                }
            );
        }

        let total: i64 = sqlx::query_scalar!("SELECT COUNT(*) FROM job_titles;")
            .fetch_one(&mut *self.transaction)
            .await?
            .unwrap_or(0);

        Ok(PaginationResult {
            items: result,
            total: total as u32,
        })
    }

    pub async fn get_job_titles_for_company_department_id(
        &mut self,
        company_department_id: i32,
    ) -> Result<Vec<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as!(JobTitleEntity, "SELECT * FROM job_titles WHERE company_department_id = $1", company_department_id)
            .fetch_all(&mut *self.transaction)
        .await
    }
    // Argument intranet_names must be a &[String]. Other type will not go through the macros of
    // sqlx.
    // ------------------------------------------------------------------------------- HERE
    pub async fn get_job_titles_by_multiple_intranet_names(&mut self, intranet_names: &[String]) -> Result<Option<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as!(JobTitleEntity, "SELECT * FROM job_titles WHERE intranet_name = ANY($1);", intranet_names)
            .fetch_optional(&mut *self.transaction)
        .await
    }

    pub async fn get_job_titles(&mut self) -> Result<Vec<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as!(JobTitleEntity, "SELECT * FROM job_titles")
            .fetch_all(&mut *self.transaction)
        .await
    }

    pub async fn get_job_title_by_intranet_name<'b>(&mut self, intranet_name: &'b str)-> Result<Option<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as!(JobTitleEntity, "SELECT * FROM job_titles WHERE intranet_name = $1;", intranet_name)
            .fetch_optional(&mut *self.transaction)
        .await
    }

    pub async fn find_job_title_by_id(&mut self, id: i32) -> Result<Option<JobTitleEntity>, sqlx::Error> {
        sqlx::query_as!(JobTitleEntity, "SELECT * FROM job_titles WHERE id = $1;", id)
            .fetch_optional(&mut *self.transaction)
        .await
    }

    pub async fn does_job_with_given_intranet_name_exists(&mut self, intranet_name: String) -> Result<bool, sqlx::Error> {
        let count: Option<i64> = sqlx::query_scalar!("SELECT COUNT(*) FROM job_titles WHERE intranet_name = $1", intranet_name)
            .fetch_one(&mut *self.transaction)
        .await?;

        Ok(count == Some(1))
    }

    pub async fn create_job_title<'b>(&mut self, args: CreateJobTitleArgs<'b>) -> Result<i32, sqlx::Error> {
        sqlx::query_scalar!(
            "INSERT INTO job_titles (name, intranet_name, company_department_id, parent_job_title_id) VALUES ($1, $2, $3, $4) RETURNING id;",
            args.name,
            args.intranet_name,
            args.company_department_id,
            args.parent_job_title_id
        )
            .fetch_one(&mut *self.transaction)
        .await
    }

    pub async fn get_authorization_token_ids_by_user_id(&mut self, user_id: i32) -> Result<Vec<i32>, sqlx::Error> {
        sqlx::query_scalar!("SELECT id FROM authorization_tokens WHERE user_id = $1 ORDER BY id", user_id)
            .fetch_all(&mut *self.transaction)
        .await
    }

    pub async fn delete_authorization_tokens_by_ids(&mut self, authorization_tokens: &[i32]) -> Result<(), sqlx::Error> {
        sqlx::query!("DELETE FROM authorization_tokens WHERE id = ANY($1)", authorization_tokens)
            .execute(&mut *self.transaction)
        .await?;

        Ok(())
    }

    pub async fn get_system_permissions(&mut self) -> Result<Vec<SystemPermissionEntity>, sqlx::Error> {
        sqlx::query_as!(SystemPermissionEntity, "SELECT * FROM system_permissions").fetch_all(&mut *self.transaction).await
    }

    pub async fn find_system_permission_by_id(&mut self, id: i32) -> Result<Option<SystemPermissionEntity>, sqlx::Error> {
        sqlx::query_as!(SystemPermissionEntity, "SELECT * FROM system_permissions WHERE id = $1", id).fetch_optional(&mut *self.transaction).await
    }

    pub async fn get_mailing_groups(&mut self) -> Result<Vec<MailingGroupEntity>, sqlx::Error> {
        sqlx::query_as!(MailingGroupEntity, "SELECT * FROM mailing_groups").fetch_all(&mut *self.transaction).await
    }

    pub async fn get_licenses(&mut self) -> Result<Vec<LicenseEntity>, sqlx::Error> {
        sqlx::query_as!(LicenseEntity, "SELECT * FROM licenses").fetch_all(&mut *self.transaction).await
    }

    pub async fn get_license_to_job_title_mappings(&mut self) -> Result<Vec<LicenseToJobTitleMappingEntity>, sqlx::Error> {
        sqlx::query_as!(LicenseToJobTitleMappingEntity, "SELECT * FROM job_titles_have_strict_onboarding_license_mappings").fetch_all(&mut *self.transaction).await
    }

    pub async fn get_system_permissions_to_job_title_mappings(&mut self) -> Result<Vec<SystemPermissionToJobTitleMappingEntity>, sqlx::Error> {
        sqlx::query_as!(SystemPermissionToJobTitleMappingEntity, "SELECT * FROM job_titles_have_strict_onboarding_system_permissions_mappings").fetch_all(&mut *self.transaction).await
    }

    pub async fn create_system_permission(&mut self, name: &str, subpermission_of_id: Option<i32>) -> Result<i32, sqlx::Error> {
        sqlx::query_scalar!(
            "INSERT INTO system_permissions (name, subpermission_of_id) VALUES ($1, $2) RETURNING id;", 
            name,
            subpermission_of_id
        )
            .fetch_one(&mut *self.transaction)
        .await
    }
}

pub struct PaginationResult<T> {
    pub items: Vec<T>,
    pub total: u32,
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct LicenseEntity {
    pub id: i32,
    pub name: String,
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct SystemPermissionEntity {
    pub id: i32,
    pub name: String,
    pub subpermission_of_id: Option<i32>
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct JobTitleEntity {
    pub id: i32,
    pub name: Option<String>,
    pub intranet_name: String,
    pub company_department_id: Option<i32>,
    pub parent_job_title_id: Option<i32>,
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct LicenseToJobTitleMappingEntity {
    pub license_id: i32,
    pub job_title_id: i32,
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct SystemPermissionToJobTitleMappingEntity {
    pub system_permission_id: i32,
    pub job_title_id: i32,
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct MailingGroupEntity {
    pub id: i32,
    pub name: String,
    pub email: String,
}

#[derive(sqlx::FromRow, Clone, Debug, Default)]
pub struct CompanyDepartmentEntity {
    pub id: i32,
    pub name: String,
}

#[derive(sqlx::FromRow, Clone, Default)]
pub struct UserEntity {
    pub id: i32,
    pub ad_id: Option<i32>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub full_name: String,
    pub job_title_id: i32,
    pub is_active: bool,
}

impl fmt::Debug for UserEntity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("UserEntity")
            .field("id", &self.id)
            .field("ad_id", &self.ad_id)
            .field("email", &self.full_name)
            .field("password", &"REDACTED")
            .field("full_name", &self.full_name)
            .field("job_title_id", &self.job_title_id)
            .field("is_active", &self.is_active)
            .finish()
    }
}

pub struct CreateUserArgs {
    pub ad_id: Option<i32>,
    pub email: Option<String>,
    pub hashed_password: Option<String>,
    pub full_name: String,
    pub job_title_id: i32,
    pub is_active: bool,
}

impl fmt::Debug for CreateUserArgs {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("CreateUserArgs")
            .field("ad_id", &self.ad_id)
            .field("email", &self.full_name)
            .field("hashed_password", &"REDACTED")
            .field("full_name", &self.full_name)
            .field("job_title_id", &self.job_title_id)
            .field("is_active", &self.is_active)
            .finish()
    }
}

#[derive(sqlx::FromRow, Clone, Default)]
pub struct UpdateUserArgs {
    pub id: i32,
    pub ad_id: Option<i32>,
    pub email: Option<String>,
    pub hashed_password: Option<String>,
    pub full_name: String,
    pub job_title_id: i32,
    pub is_active: bool,
}

impl fmt::Debug for UpdateUserArgs {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("UpdateUserArgs")
            .field("id", &self.id)
            .field("ad_id", &self.ad_id)
            .field("email", &self.full_name)
            .field("hashed_password", &"REDACTED")
            .field("full_name", &self.full_name)
            .field("job_title_id", &self.job_title_id)
            .field("is_active", &self.is_active)
            .finish()
    }
}

pub struct CreateJobTitleArgs<'a> {
    pub name: Option<&'a str>,
    pub intranet_name: &'a str,
    pub company_department_id: Option<i32>,
    pub parent_job_title_id: Option<i32>,
}

#[derive(sqlx::FromRow, Clone, Default)]
pub struct PermissionEntity {
    pub id: i32,
    pub name: String,
}

pub struct JobTitleWithDependencies {
    pub job_title: JobTitleEntity,
    pub company_department: Option<CompanyDepartmentEntity>,
    pub permissions: Vec<PermissionEntity>,
}
