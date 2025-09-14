use reqwest::header::HeaderMap;
use reqwest::header::HeaderValue;
use reqwest::header::HeaderName;
use curl::easy::{Easy2, Handler, WriteError};
use chrono::{FixedOffset, NaiveDateTime, LocalResult};

const HEADER_ACCEPT: &str = "accept";
const HEADER_X_AUTH_TOKEN: &str = "x-auth-token";

struct Collector(Vec<u8>);

impl Handler for Collector {
    fn write(&mut self, data: &[u8]) -> Result<usize, WriteError> {
        self.0.extend_from_slice(data);
        Ok(data.len())
    }
}

pub struct IntranetApi {
    token: String,
}

impl IntranetApi {
    pub fn new(token: String) -> Self {
        Self { token }
    }

    pub async fn download_users(&self) -> Result<Vec<IntranetUserDto>, IntranetError> {
        let mut headers = HeaderMap::new();
        headers.insert(HEADER_X_AUTH_TOKEN, self.token.parse().map_err(|error| IntranetError::FailedToParseHeaderValue(error))?);
        headers.insert(HEADER_ACCEPT, "application/json".parse().unwrap());

        let client = reqwest::Client::new();

        let response = client.get("https://intranet.confilogi.com/api/users")
            .version(reqwest::Version::HTTP_2)
            .headers(headers.clone())
            .send()
            .await
            .map_err(|error| IntranetError::FailedToSendRequest(error))?;

        let response_status = response.status().into();
        let response_text = response.text().await;

        if response_status != 200 {
            return Err(IntranetError::InvalidStatusError {
                status: response_status,
                body: format!("{:?}", response_text),
            });
        }

        let response_text = response_text.map_err(|error| IntranetError::FailedToReadResponseBody(error))?;

        let raw_users: Vec<IntranetUserRaw> = serde_json::from_str(&response_text).unwrap();

        let mut users = Vec::with_capacity(raw_users.len());

        for user_raw in raw_users.into_iter() {
            users.push(IntranetUserDto::from_raw(user_raw).unwrap());
        }

        Ok(users)
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
struct IntranetUserRaw {
    #[serde(rename = "employID")]
    id: i32,

    // user hostname
    #[serde(rename = "samaccountname")]
    hostname: String,

    #[serde(rename = "displayFName")]
    full_name: String,

    email: String,

    #[serde(rename = "accountEnabled")]
    is_enabled: i32,

    #[serde(rename = "jobTitle")]
    job_title: String,

    manager: Option<String>,

    #[serde(rename = "usageLocation")]
    location: Option<String>,

    #[serde(rename = "userRegistrationDatetime")]
    registered_at: Option<String>,
}

#[derive(Debug)]
pub struct IntranetUserDto {
    pub id: i32,
    pub hostname: String,
    pub email: String,
    pub full_name: String,
    pub is_enabled: bool,
    pub job_title: String,
    pub location: Option<String>,
    pub manager: Option<String>,
    pub registered_at: Option<chrono::DateTime<chrono::Utc>>
}

impl IntranetUserDto {
    pub fn from_raw(value: IntranetUserRaw) -> Result<IntranetUserDto, IntranetUserDtoParsingError> {
        type E = IntranetUserDtoParsingError;

        let is_enabled = if value.is_enabled == 0 {
            false
        } else if value.is_enabled == 1 {
            true
        } else {
            return Err(E::InvalidIsEnabledValue(value.is_enabled));
        };

        let registered_at = if let Some(registered_at) = value.registered_at {
            let offset = FixedOffset::east_opt(3600 * 1).unwrap();

            let naive_registered_at = NaiveDateTime::parse_from_str(&registered_at, "%Y-%m-%d %H:%M:%S")
                .map_err(|error| E::InvalidRegistrationDate(registered_at.clone()))?;

            let registered_at = match naive_registered_at.and_local_timezone(offset) {
                LocalResult::Single(result) => result,
                _ => return Err(E::InvalidRegistrationDate(registered_at.clone())),
            };

            Some(registered_at.to_utc())
        } else {
            None
        };

        Ok(IntranetUserDto {
            id: value.id,
            hostname: value.hostname,
            email: value.email,
            full_name: value.full_name,
            is_enabled,
            job_title: value.job_title,
            location: value.location,
            manager: value.manager,
            registered_at
        })
    }
}

#[derive(Debug)]
enum IntranetUserDtoParsingError {
    InvalidRegistrationDate(String),
    InvalidIsEnabledValue(i32),
}

#[derive(Debug)]
pub enum IntranetError {
    FailedToParseHeaderValue(reqwest::header::InvalidHeaderValue),
    FailedToSendRequest(reqwest::Error),
    FailedToReadResponseBody(reqwest::Error),
    FailedToDeserializeBody(serde_json::Error),
    InvalidStatusError {
        status: u16,
        body: String,
    }
}
