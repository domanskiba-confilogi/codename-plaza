use serde::{Serialize, Deserialize};
use std::borrow::Cow;
use axum::{http::StatusCode, response::{Response, IntoResponse}, Json};
use email_address::*;
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Language {
    Polish,
}

pub trait Validator {
    fn validate(self) -> Result<(), ValidationError>;
}

#[derive(Debug)]
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

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ValidationErrorWithTranslation {
    pub property_name: FieldTranslationKey,
    pub message: String,
    pub translation: TranslationKey,
}

impl IntoResponse for ValidationErrorWithTranslation {
    fn into_response(self) -> Response {
        (StatusCode::BAD_REQUEST, Json(self)).into_response()
    }
}

pub trait Translate {
    fn translate(&self, language: Language) -> String;
}

#[derive(Serialize, Deserialize, Debug)]
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

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[serde(tag = "type", content = "data")]
pub enum FieldTranslationKey {
    Email,
    Password,
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
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
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
        }
    }
}

struct StringTooShortValidator<'a> {
    property_name: FieldTranslationKey,
    value: &'a str,
    min_length: usize,
}

impl<'a> Validator for StringTooShortValidator<'a> {
    fn validate(self) -> Result<(), ValidationError> {
        if self.value.len() < self.min_length {
            return Err(ValidationError {
                property_name: self.property_name,
                translation: TranslationKey::Validation(ValidationTranslationKey::StringTooShort {
                    property_name: self.property_name,
                    min_length: self.min_length
                }),
            })
        }

        Ok(())
    }
}

struct StringTooLongValidator<'a> {
    property_name: FieldTranslationKey,
    value: &'a str,
    max_length: usize,
}

impl<'a> Validator for StringTooLongValidator<'a> {
    fn validate(self) -> Result<(), ValidationError> {
        if self.value.len() > self.max_length {
            return Err(ValidationError {
                property_name: self.property_name,
                translation: TranslationKey::Validation(ValidationTranslationKey::StringTooLong {
                    property_name: self.property_name,
                    max_length: self.max_length
                }),
            })
        }

        Ok(())
    }
}

struct InvalidEmailValidator<'a> {
    property_name: FieldTranslationKey,
    value: &'a str
}

impl<'a> Validator for InvalidEmailValidator<'a> {
    fn validate(self) -> Result<(), ValidationError> {
        let error = ValidationError {
            property_name: self.property_name,
            translation: TranslationKey::Validation(ValidationTranslationKey::InvalidEmail {
                property_name: self.property_name,
            }),
        };

        match EmailAddress::from_str(self.value) {
            Ok(email_address) => if self.value != email_address.email() {
                Err(error)
            } else if email_address.domain() != "confilogi.com" {
                Err(error)
            } else {
                Ok(())
            },
            Err(_) => Err(error)
        }
    }
}

pub struct LoginValidator<'a> {
    pub email: &'a str,
    pub password: &'a str,
}

impl<'a> Validator for LoginValidator<'a> {
    fn validate(self) -> Result<(), ValidationError> {
        StringTooShortValidator {
            property_name: FieldTranslationKey::Email,
            value: self.email,
            min_length: 3
        }.validate()?;

        StringTooLongValidator {
            property_name: FieldTranslationKey::Email,
            value: self.email,
            max_length: 64
        }.validate()?;

        InvalidEmailValidator {
            property_name: FieldTranslationKey::Email,
            value: self.email,
        }.validate()?;

        StringTooShortValidator {
            property_name: FieldTranslationKey::Password,
            value: self.password,
            min_length: 10,
        }.validate()?;

        StringTooLongValidator {
            property_name: FieldTranslationKey::Password,
            value: self.password,
            max_length: 64,
        }.validate()?;

        Ok(())
    }
}
