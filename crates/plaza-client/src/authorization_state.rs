use gloo_storage::{LocalStorage, errors::StorageError, Storage};
use connector::UserDto;
use std::cell::RefCell;
use std::rc::Rc;
use gloo_timers::future::TimeoutFuture;

#[derive(Clone, PartialEq)]
struct AuthorizationStateShape {
    user: Option<UserDto>,
    authorization_token: Option<String>,
}

#[derive(Clone, PartialEq)]
pub struct AuthorizationState {
    inner: Rc<RefCell<AuthorizationStateShape>>,
}

enum LocalStorageKey {
    Token,
}

impl AsRef<str> for LocalStorageKey {
    fn as_ref(&self) -> &str {
        match self {
            LocalStorageKey::Token => "token",
        }
    }
}

impl AuthorizationState {
    pub fn new() -> Result<Self, StorageError> {
        Ok(Self {
            inner: Rc::new(RefCell::new(AuthorizationStateShape {
                user: None,
                authorization_token: Self::authorization_token_from_localstorage()?,
            })),
        })
    }

    pub fn emergency_clean() {
        LocalStorage::delete(LocalStorageKey::Token);
    }

    fn authorization_token_from_localstorage() -> Result<Option<String>, StorageError> {
        match LocalStorage::get(LocalStorageKey::Token) {
            Ok(user) => Ok(Some(user)),
            Err(error) => match error {
                StorageError::KeyNotFound(_) => Ok(None),
                _ => return Err(error),
            }
        }
    }

    fn remove_logged_in_user_from_localstorage() {
        LocalStorage::delete(LocalStorageKey::Token);
    }

    pub async fn logged_in_user(&self) -> Option<UserDto> {
        let accessor = self.inner.clone();

        loop {
            match accessor.try_borrow() {
                Ok(data) => return data.user.clone(),
                Err(_) => {
                    TimeoutFuture::new(10).await;
                }
            }
        }
    }

    pub async fn authorization_token(&self) -> Option<String> {
        let accessor = self.inner.clone();

        loop {
            match accessor.try_borrow() {
                Ok(data) => return data.authorization_token.clone(),
                Err(_) => {
                    TimeoutFuture::new(10).await;
                }
            }
        }
    }

    pub async fn set_logged_in_user(&self, user: UserDto, authorization_token: String) -> Result<(), StorageError>{
        let accessor = self.inner.clone();

        loop {
            match accessor.try_borrow_mut() {
                Ok(mut data) => {
                    (*data).user = Some(user);
                    (*data).authorization_token = Some(authorization_token.clone());
                    LocalStorage::set(LocalStorageKey::Token, authorization_token)?;
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
        let accessor = self.inner.clone();

        loop {
            match accessor.try_borrow_mut() {
                Ok(mut data) => {
                    (*data).user = None;
                    (*data).authorization_token = None;
                    Self::remove_logged_in_user_from_localstorage();
                },
                Err(_) => {
                    TimeoutFuture::new(10).await;
                }
            }
        }
    }

    pub async fn is_logged_in(&self) -> bool {
        let accessor = self.inner.clone();

        loop {
            match accessor.try_borrow() {
                Ok(data) => return data.user.is_some() && data.authorization_token.is_some(),
                Err(_) => {
                    TimeoutFuture::new(10).await;
                }
            }
        }
    }
}
