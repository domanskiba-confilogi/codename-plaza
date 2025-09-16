use crate::intranet::IntranetError;
use sqlx::Pool;
use sqlx::Postgres;
use crate::intranet::IntranetApi;
use crate::intranet::IntranetUserDto;
use tokio::time::Duration;
use tokio_util::sync::CancellationToken;
use tokio::sync::broadcast;
use std::collections::HashMap;
use crate::uow::UnitOfWork;
use std::sync::Arc;
use crate::uow::UserEntity;
use crate::uow::UpdateUserArgs;
use crate::uow::CreateUserArgs;
use crate::uow::CreateJobTitleArgs;

#[derive(Debug)]
pub enum Status {
    DownloadingIntranetUsers,

    DownloadingIntranetUsersFinished,

    DownloadIntranetUsersError {
        error: IntranetError,
    },

    SynchronizingJobTitle {
        intranet_name: String,
        current_item: u32,
        total: u32,
    },

    JobTitleSynchronizationFinished {
        total: u32,
    },

    JobTitleSynchronizationError {
        current_item: u32,
        total: u32,
        error: JobTitleSynchronizationErrorWrapper,
    },

    SynchronizingUser {
        user_full_name: String,
        user_email: String,
        current_item: u32,
        total: u32
    },

    UserSynchronizationError {
        current_item: u32,
        total: u32,
        error: UserSynchronizationErrorWrapper,
    },

    UserSynchronizationFinished {
        total: u32
    },

    FailedToSynchronizeUser {
        current_item: u32,
        total: u32,
        error: UserSynchronizationError,
    }
}

pub struct BackgroundWorker {
    db_pool: Pool<Postgres>,
    intranet_api: IntranetApi,
    progress_sender: broadcast::Sender<Arc<Status>>,
}

impl BackgroundWorker {
    pub fn new(
        db_pool: Pool<Postgres>,
        intranet_api: IntranetApi,
        progress_sender: broadcast::Sender<Arc<Status>>,
    ) -> Self {
        Self { db_pool, intranet_api, progress_sender}
    }

    pub fn send_status(&self, status: Status) {
        if let Err(error) = self.progress_sender.send(Arc::new(status)) {
            eprintln!("Failed to send synchronization status via progress sender (receiver may not read messages?): {error:?}");
        }
    }

    pub async fn run(
        self,
        cancellation_token: CancellationToken,
    ) {
        loop {
            self.send_status(Status::DownloadingIntranetUsers);

            let intranet_users = match self.intranet_api.download_users().await {
                Ok(result) => result,
                Err(error) => {
                    self.send_status(Status::DownloadIntranetUsersError { error });

                    return;
                }
            };

            self.send_status(Status::DownloadingIntranetUsersFinished);

            let mut job_titles = intranet_users.iter().map(|intranet_user| intranet_user.job_title.as_str()).collect::<Vec<&str>>(); 
            job_titles.dedup();

            let job_title_cache = JobTitleSynchronizationBackgroundWorker::new(cancellation_token.clone(), &self.db_pool, self.progress_sender.clone()).run(&job_titles).await;

            UserSynchronizationBackgroundWorker::new(cancellation_token.clone(), &self.db_pool, &job_title_cache, self.progress_sender.clone()).run(intranet_users).await;

            tokio::select! {
                _ = cancellation_token.cancelled() => break,
                    _ = tokio::time::sleep(Duration::from_secs(60)) => {}
            }
        }
    }
}

#[derive(Debug)]
pub struct UserSynchronizationErrorWrapper {
    user_entity: Option<UserEntity>,
    intranet_user: Option<IntranetUserDto>,
    error: UserSynchronizationError,
}

#[derive(Debug)]
pub enum UserSynchronizationError {
    FailedToStartTransaction(sqlx::Error),
    FailedToGetJobTitleIdFromCache(String),
    FailedToCreateUser { error: sqlx::Error, args: CreateUserArgs },
    FailedToUpdateExistingUser { args: UpdateUserArgs, error: sqlx::Error },
    FailedToGetUserByAdId(sqlx::Error),
    FailedToCommitTransaction(sqlx::Error),
}

#[derive(Debug)]
pub struct JobTitleSynchronizationErrorWrapper {
    intranet_name: String,
    error: JobTitleSynchronizationError,
}

#[derive(Debug)]
pub enum JobTitleSynchronizationError {
    FailedToStartTransaction(sqlx::Error),

    FailedToCheckIfJobTitleExistsByIntranetName(sqlx::Error),
    FailedToCreateMissingJobTitle(sqlx::Error),

    FailedToCommitTransaction(sqlx::Error),
}

pub struct UserSynchronizationBackgroundWorker<'a> {
    cancellation_token: CancellationToken,
    db_pool: &'a Pool<Postgres>,
    // Job title cache (Intranet name to our database's internal ID mapping)
    job_title_cache: &'a HashMap<String, i32>,
    progress_sender: broadcast::Sender<Arc<Status>>,
}

impl<'a> UserSynchronizationBackgroundWorker<'a> {
    pub fn new(
        cancellation_token: CancellationToken,
        db_pool: &'a Pool<Postgres>,
        job_title_cache: &'a HashMap<String, i32>,
        progress_sender: broadcast::Sender<Arc<Status>>,
    ) -> Self {
        Self {
            cancellation_token,
            db_pool,
            job_title_cache,
            progress_sender
        }
    }

    pub async fn run(&self, intranet_users: Vec<IntranetUserDto>) {
        // prepare data for processing
        let total_to_synchronize = intranet_users.len() as u32;

        // process chunks
        for (index, intranet_user) in intranet_users.into_iter().enumerate() {
            self.send_status(Status::SynchronizingUser {
                user_full_name: intranet_user.full_name.clone(),
                user_email: intranet_user.email.clone(),
                current_item: (index as u32) + 1,
                total: total_to_synchronize,
            });

            if let Err(error) = self.process_user(intranet_user).await {
                self.send_status(Status::UserSynchronizationError {
                    current_item: (index as u32) + 1,
                    total: total_to_synchronize,
                    error
                });
            }
        }

        self.send_status(Status::UserSynchronizationFinished {
            total: total_to_synchronize,
        });
    }

    pub fn send_status(&self, status: Status) {
        if let Err(error) = self.progress_sender.send(Arc::new(status)) {
            eprintln!("Failed to send synchronization status via progress sender (receiver may not read messages?): {error:?}");
        }
    }

    pub async fn process_user(&self, intranet_user: IntranetUserDto) -> Result<(), UserSynchronizationErrorWrapper> {
        type Wrapper = UserSynchronizationErrorWrapper;
        type Error = UserSynchronizationError;

        let job_title_id = self.job_title_cache.get(&intranet_user.job_title)
            .ok_or_else(|| Wrapper {
                user_entity: None, error: Error::FailedToGetJobTitleIdFromCache(intranet_user.job_title.clone()), intranet_user: Some(intranet_user.clone())
            })?;

        let mut uow = UnitOfWork::new(&self.db_pool).await
            .map_err(|error| Wrapper { error: Error::FailedToStartTransaction(error), user_entity: None, intranet_user: Some(intranet_user.clone()) })?;

        let user_from_db = uow.find_user_by_ad_id(intranet_user.id).await
            .map_err(|error| Wrapper { user_entity: None, intranet_user: Some(intranet_user.clone()), error: Error::FailedToGetUserByAdId(error) })?;

        match user_from_db {
            Some(user_entity) => {
                if user_entity.ad_id != Some(intranet_user.id) ||
                user_entity.email != Some(intranet_user.email.clone()) || 
                user_entity.full_name != intranet_user.full_name ||
                user_entity.job_title_id != *job_title_id {

                    let args = UpdateUserArgs {
                        id: user_entity.id,
                        ad_id: Some(intranet_user.id),
                        full_name: intranet_user.full_name.clone(),
                        email: Some(intranet_user.email.clone()),
                        hashed_password: user_entity.password.clone(),
                        job_title_id: *job_title_id
                    };

                    uow.update_user(&args).await.map_err(|error| Wrapper {
                        intranet_user: Some(intranet_user.clone()), user_entity: Some(user_entity.clone()), error: Error::FailedToUpdateExistingUser { error, args }
                    })?;
                }

                uow.commit().await.map_err(|error| Wrapper {
                    intranet_user: Some(intranet_user),
                    user_entity: Some(user_entity),
                    error: Error::FailedToCommitTransaction(error),
                })?;
            },
            None => {
                let args = CreateUserArgs {
                    ad_id: Some(intranet_user.id),
                    email: Some(intranet_user.email.clone()),
                    full_name: intranet_user.full_name.clone(),
                    hashed_password: None,
                    job_title_id: *job_title_id,
                };

                let _ = uow.create_user(&args)
                    .await
                    .map_err(|error| Wrapper {
                        user_entity: None,
                        intranet_user: Some(intranet_user.clone()),
                        error: Error::FailedToCreateUser { error, args }
                    })?;

                uow.commit().await.map_err(|error| Wrapper {
                    intranet_user: Some(intranet_user),
                    user_entity: None,
                    error: Error::FailedToCommitTransaction(error),
                })?;
            }
        };

        Ok(())
    }
}

struct JobTitleSynchronizationBackgroundWorker<'a> {
    db_pool: &'a Pool<Postgres>,
    cancellation_token: CancellationToken,
    progress_sender: broadcast::Sender<Arc<Status>>,
}

impl<'a> JobTitleSynchronizationBackgroundWorker<'a> {
    pub fn send_status(&self, status: Status) {
        if let Err(error) = self.progress_sender.send(Arc::new(status)) {
            eprintln!("Failed to send synchronization status via progress sender (receiver may not read messages?): {error:?}");
        }
    }

    pub async fn process_job_title(&self, job_title_name: &str) -> Result<i32, JobTitleSynchronizationErrorWrapper> {
        type Wrapper = JobTitleSynchronizationErrorWrapper;
        type Error = JobTitleSynchronizationError;

        let mut uow = UnitOfWork::new(&self.db_pool).await
            .map_err(|error| Wrapper {
                intranet_name: job_title_name.to_string(),
                error: Error::FailedToStartTransaction(error)
            })?;

        let job_title_from_db = uow.get_job_title_by_intranet_name(job_title_name).await
            .map_err(|error| Wrapper {
                intranet_name: job_title_name.to_string(),
                error: Error::FailedToCheckIfJobTitleExistsByIntranetName(error)
            })?;

        match job_title_from_db {
            Some(job_title) => Ok(job_title.id),
            None => {
                let job_title_id = uow.create_job_title(CreateJobTitleArgs {
                    name: None,
                    intranet_name: job_title_name,
                    company_department_id: None,
                    parent_job_title_id: None,
                })
                    .await
                    .map_err(|error| Wrapper {
                        intranet_name: job_title_name.to_string(),
                        error: Error::FailedToCreateMissingJobTitle(error),
                    })?;

                uow.commit().await
                    .map_err(|error| Wrapper {
                        intranet_name: job_title_name.to_string(),
                        error: Error::FailedToCommitTransaction(error),
                    })?;

                Ok(job_title_id)
            }
        }
    }

    pub fn new(
        cancellation_token: CancellationToken,
        db_pool: &'a Pool<Postgres>,
        progress_sender: broadcast::Sender<Arc<Status>>,
    ) -> Self {
        Self {
            cancellation_token,
            db_pool,
            progress_sender
        }
    }

    pub async fn run(self, job_titles: &[&str]) -> HashMap<String, i32> {
        let mut job_title_cache = HashMap::new();

        let total_items = job_titles.len() as u32;

        for (index, job_title) in job_titles.into_iter().enumerate() {
            self.send_status(Status::SynchronizingJobTitle {
                current_item: index as u32 + 1,
                total: total_items,
                intranet_name: job_title.to_string()
            });

            match self.process_job_title(job_title).await {
                Ok(job_title_id) => {
                    job_title_cache.insert(job_title.to_string(), job_title_id);
                },
                Err(error) => {
                    self.send_status(Status::JobTitleSynchronizationError {
                        current_item: index as u32 + 1,
                        total: total_items,
                        error 
                    });
                }
            }
        }

        self.send_status(Status::JobTitleSynchronizationFinished {
            total: total_items
        });

        job_title_cache
    }
}
