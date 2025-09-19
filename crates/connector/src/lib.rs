use crate::i18n::Language;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub enum BadRequestError {
    Message {
        message: String,
    },
    Validation(ValidationError),
    ValidationWithTranslation(ValidationErrorWithTranslation),
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq)]
pub struct CompanyDepartmentDto {
    pub id: i32,
    pub name: String
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct ExternalPermissionDto {
    pub id: i32,
    pub name: String
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct SystemPermissionDto {
    pub id: i32,
    pub name: String,
    pub subpermission_of_id: Option<i32>
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct LicenseDto {
    pub id: i32,
    pub name: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq)]
pub struct JobTitleDto {
    pub id: i32,
    pub name: Option<String>,
    pub intranet_name: String,
    pub company_department_id: Option<i32>,
    pub parent_job_title_id: Option<i32>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct LicenseToJobTitleMappingDto {
    pub license_id: i32,
    pub job_title_id: i32,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct SystemPermissionToJobTitleMappingDto {
    pub system_permission_id: i32,
    pub job_title_id: i32,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq)]
pub struct UserDto {
    pub id: i32,
    pub email: Option<String>,
    pub full_name: String,
    pub job_title: JobTitleDto,
    pub company_department: Option<CompanyDepartmentDto>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct MailingGroupDto {
    pub id: i32,
    pub name: String,
    pub email: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct LoginRequestBody {
    pub email: String,
    pub password: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct LoginResponse {
    pub user: UserDto,
    pub authorization_token: String,
}

use i18n::{FieldTranslationKey, TranslationKey, Translate};

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct ValidationError {
    pub property_name: FieldTranslationKey,
    pub translation: TranslationKey,
}

impl ValidationError {
    pub fn into_with_translation(self, language: Language) -> ValidationErrorWithTranslation {
        ValidationErrorWithTranslation {
            property_name: self.property_name,
            message: self.translation.translate(language),
            translation: self.translation,
        }
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct ValidationErrorWithTranslation {
    pub property_name: FieldTranslationKey,
    pub message: String,
    pub translation: TranslationKey,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct UnauthorizedError {
    title: String,
    message: String,
}

impl UnauthorizedError {
    pub fn new() -> Self {
        Self {
            title: "Unauthorized".to_string(),
            message: "You are unauthorized to view this resource.".to_string()
        }
    }
}

#[cfg(feature = "server-side")]
impl axum::response::IntoResponse for ValidationErrorWithTranslation {
    fn into_response(self) -> axum::response::Response {
        BadRequestError::ValidationWithTranslation(self).into_response()
    }
}

#[cfg(feature = "server-side")]
impl axum::response::IntoResponse for BadRequestError {
    fn into_response(self) -> axum::response::Response {
        (axum::http::StatusCode::BAD_REQUEST, axum::Json(self)).into_response()
    }
}

#[cfg(feature = "server-side")]
impl axum::response::IntoResponse for UnauthorizedError {
    fn into_response(self) -> axum::response::Response {
        (axum::http::StatusCode::UNAUTHORIZED, axum::Json(self)).into_response()
    }
}

pub mod i18n {
    use crate::{ValidationError};

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum Language {
        Polish,
    }

    pub trait Validator {
        fn validate(self) -> Result<(), ValidationError>;
    }

    pub trait Translate {
        fn translate(&self, language: Language) -> String;
    }

    #[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
    #[serde(tag = "type", content = "data")]
    pub enum TranslationKey {
        Validation(ValidationTranslationKey),
        Field(FieldTranslationKey),
    }

    impl Translate for TranslationKey {
        fn translate(&self, language: Language) -> String {
            match self {
                TranslationKey::Validation(validation_translation_key) => validation_translation_key.translate(language),
                TranslationKey::Field(field_translation_key) => field_translation_key.translate(language),
            }
        }
    }

    #[derive(serde::Serialize, serde::Deserialize, Debug, Clone, Copy)]
    pub enum FieldTranslationKey {
        Email,
        Password,
        SystemPermissionName,
        PaginationPage,
        PaginationPerPage,
    }

    impl Translate for FieldTranslationKey {
        fn translate(&self, language: Language) -> String {
            match self {
                FieldTranslationKey::Email => {
                    match language {
                        Language::Polish => format!("email"),
                    }
                },
                FieldTranslationKey::Password => {
                    match language {
                        Language::Polish => format!("hasło"),
                    }
                }
                FieldTranslationKey::SystemPermissionName => {
                    match language {
                        Language::Polish => format!("name"),
                    }
                }
                FieldTranslationKey::PaginationPage => {
                    match language {
                        Language::Polish => format!("Numer porządkowy strony"),
                    }
                }
                FieldTranslationKey::PaginationPerPage => {
                    match language {
                        Language::Polish => format!("Ilość wierszy na jednej stronie"),
                    }
                }
            }
        }
    }

    #[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
    #[serde(tag = "type", content = "data")]
    pub enum ValidationTranslationKey {
        StringTooShort {
            property_name: FieldTranslationKey,
            min_length: usize,
        },
        StringTooLong {
            property_name: FieldTranslationKey,
            max_length: usize,
        },
        InvalidEmail {
            property_name: FieldTranslationKey,
        },
        InvalidCredentials,
        NumberTooSmall {
            property_name: FieldTranslationKey,
            min: u32,
        },
        NumberTooBig {
            property_name: FieldTranslationKey,
            max: u32,
        }
    }

    impl Translate for ValidationTranslationKey {
        fn translate(&self, language: Language) -> String {
            match self {
                ValidationTranslationKey::StringTooShort { property_name, min_length } => {
                    match language {
                        Language::Polish => format!("Pole \"{}\" jest za krótkie, minimum {min_length} znaków.", property_name.translate(language)),
                    }
                },
                ValidationTranslationKey::StringTooLong { property_name, max_length } => {
                    match language {
                        Language::Polish => format!("Pole \"{}\" jest za długi, maksimum {max_length} znaków.", property_name.translate(language)),
                    }
                }
                ValidationTranslationKey::InvalidEmail { property_name } => {
                    match language {
                        Language::Polish => format!("Pole \"{}\" jest niepoprawnym adresem mailowym.", property_name.translate(language)),
                    }
                }
                ValidationTranslationKey::InvalidCredentials => {
                    match language {
                        Language::Polish => format!("Email lub hasło są nieprawidłowe")
                    }
                }
                ValidationTranslationKey::NumberTooSmall { property_name, min } => {
                    match language {
                        Language::Polish => format!("Pole \"{}\" ma za małą wartość! Minimum: {min}", property_name.translate(language))
                    }
                }
                ValidationTranslationKey::NumberTooBig { property_name, max } => {
                    match language {
                        Language::Polish => format!("Pole \"{}\" ma za dużą wartość! Maximum: {max}", property_name.translate(language))
                    }
                }
            }
        }
    }
}
