use serde::{Serialize, Deserialize};
use std::borrow::Cow;
use axum::{http::StatusCode, response::{Response, IntoResponse}, Json};
use email_address::*;
use std::str::FromStr;
use connector::{*, i18n::*};

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

pub struct CreateSystemPermissionValidator<'a> {
    pub name: &'a str,
    pub subpermission_of_id: Option<i32>
}

impl<'a> Validator for CreateSystemPermissionValidator<'a> {
    fn validate(self) -> Result<(), ValidationError> {
        StringTooShortValidator {
            property_name: FieldTranslationKey::SystemPermissionName,
            value: self.name,
            min_length: 3
        }.validate()?;

        StringTooLongValidator {
            property_name: FieldTranslationKey::SystemPermissionName,
            value: self.name,
            max_length: 64
        }.validate()?;

        Ok(())
    }
}
