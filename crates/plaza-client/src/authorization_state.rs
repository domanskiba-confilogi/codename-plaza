use gloo_storage::{LocalStorage, errors::StorageError, Storage};
use connector::UserDto;
use std::cell::RefCell;
use std::rc::Rc;
use gloo_timers::future::TimeoutFuture;

#[derive(Clone, PartialEq)]
pub struct AuthorizationState {
    user: Rc<RefCell<Option<UserDto>>>,
}

impl AuthorizationState {
    pub fn new() -> Result<Self, StorageError> {
        Ok(Self {
            user: Rc::new(RefCell::new(Self::logged_in_user_from_localstorage()?)),
        })
    }

    pub fn emergency_clean() {
        LocalStorage::delete("user");
        LocalStorage::delete("authorization_token");
    }

    fn logged_in_user_from_localstorage() -> Result<Option<UserDto>, StorageError> {
        match LocalStorage::get("user") {
            Ok(user) => Ok(Some(user)),
            Err(error) => match error {
                StorageError::KeyNotFound(_) => Ok(None),
                _ => return Err(error),
            }
        }
    }

    fn set_logged_in_user_inside_localstorage(user: UserDto) -> Result<(), StorageError> {
        LocalStorage::set("user", user)
    }

    fn remove_logged_in_user_from_localstorage() {
        LocalStorage::delete("user");
    }

    pub async fn logged_in_user(&self) -> Option<UserDto> {
        let accessor = self.user.clone();

        loop {
            match accessor.try_borrow() {
                Ok(data) => return data.clone(),
                Err(_) => {
                    TimeoutFuture::new(10).await;
                }
            }
        }
    }

    pub async fn set_logged_in_user(&self, user: UserDto) -> Result<(), StorageError>{
        let accessor = self.user.clone();

        loop {
            match accessor.try_borrow_mut() {
                Ok(mut data) => {
                    *data = Some(user.clone());
                    Self::set_logged_in_user_inside_localstorage(user)?;
                    break;
                },
                Err(_) => {
                    TimeoutFuture::new(10).await;
                }
            }
        }

        Ok(())
    }

    pub async fn remove_logged_in_user(&self) {
        let accessor = self.user.clone();

        loop {
            match accessor.try_borrow_mut() {
                Ok(mut data) => {
                    *data = None;
                    Self::remove_logged_in_user_from_localstorage();
                },
                Err(_) => {
                    TimeoutFuture::new(10).await;
                }
            }
        }
    }

    pub async fn is_logged_in(&self) -> bool {
        self.logged_in_user().await.is_some()
    }
}
