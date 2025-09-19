use url::Url;

pub struct UnauthenticatedClient {
    tenant_id: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
}

impl UnauthenticatedClient {
    pub fn new(
        tenant_id: String,
        client_id: String,
        client_secret: String,
        redirect_uri: String,
    ) -> Self {
        Self {
            tenant_id,
            client_id,
            client_secret,
            redirect_uri,
        }
    }

    pub fn get_sign_in_redirection_uri(&self) -> Result<String, FailedToConstructLoginCallbackUrl> {
        let mut url = Url::parse(&format!("https://login.microsoftonline.com/{}/oauth2/v2.0/authorize", self.tenant_id))
            .map_err(|error| FailedToConstructLoginCallbackUrl(error))?;

        url.query_pairs_mut()
            .clear()
            .append_pair("client_id", &self.client_id)
            .append_pair("response_type", "code")
            .append_pair("redirect_uri", &self.redirect_uri)
            .append_pair("scope", "User.Read")
            .append_pair("response_mode", "query");

        Ok(url.as_str().to_string())
    }

    pub async fn request_access_token(&self, code: &str) -> Result<RequestAccessTokenResponse, RequestAccessTokenError> {
        type E = RequestAccessTokenError;

        let client = reqwest::Client::new();

        let response = client.post(&format!("https://login.microsoftonline.com/{}/oauth2/v2.0/token", self.tenant_id))
            .header("content-type", "application/x-www-form-urlencoded")
            .form(&[
                ("client_id", self.client_id.as_str()),
                ("scope", "offline_access User.Read"),
                ("code", code),
                ("redirect_uri", self.redirect_uri.as_str()),
                ("grant_type", "authorization_code"),
                ("client_secret", self.client_secret.as_str())
            ])
            .send()
            .await
            .map_err(|error| E::FailedToSendRequest(error))?;

        let status_code = response.status();
        let response_body = response.text().await;

        if status_code != 200 {
            return Err(E::InvalidStatus(status_code.into(), response_body));
        }

        let response_body = response_body.map_err(|error| E::FailedToReceiveRequestBody(error))?;

        let response_body = serde_json::from_str(&response_body)
            .map_err(|error| E::FailedToParseJsonBody { status_code: status_code.into(), response_body, error })?;

        Ok(response_body)
    }

    pub fn into_authenticated_client(self, access_token: String, refresh_token: String) -> AuthenticatedClient {
        AuthenticatedClient {
            tenant_id: self.tenant_id,
            client_id: self.client_id,
            client_secret: self.client_secret,
            redirect_uri: self.redirect_uri,

            access_token,
            refresh_token,
        }
    }
}

pub struct AuthenticatedClient {
    tenant_id: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,

    access_token: String,
    refresh_token: String,
}

impl AuthenticatedClient {
    pub async fn renew_access_token(&self) -> Result<RenewAccessTokenResponse, RenewAccessTokenError> {
        type E = RenewAccessTokenError;

        let client = reqwest::Client::new();

        let response = client.post(&format!("https://login.microsoftonline.com/{}/oauth2/v2.0/token", self.tenant_id))
            .header("content-type", "application/x-www-form-urlencoded")
            .form(&[
                ("client_id", self.client_id.as_str()),
                ("scope", "User.Read"),
                ("refresh_token", self.refresh_token.as_str()),
                ("grant_type", "refresh_token"),
                ("client_secret", self.client_secret.as_str())
            ])
            .send()
            .await
            .map_err(|error| E::FailedToSendRequest(error))?;

        let status_code = response.status();
        let response_body = response.text().await;

        if status_code != 200 {
            return Err(E::InvalidStatus(status_code.into(), response_body));
        }

        let response_body = response_body.map_err(|error| E::FailedToReceiveRequestBody(error))?;

        let response_body = serde_json::from_str(&response_body)
            .map_err(|error| E::FailedToParseJsonBody { status_code: status_code.into(), response_body, error })?;

        Ok(response_body)
    }

    pub async fn get_user_employee_id(&self) -> Result<Option<i32>, GetUserEmployeeIdError> {
        type E = GetUserEmployeeIdError;

        let client = reqwest::Client::new();

        let response = client.get("https://graph.microsoft.com/beta/me")
            .header("authorization", &format!("Bearer {}", self.access_token))
            .send()
            .await
            .map_err(|error| E::FailedToSendRequest(error))?;

        let status_code = response.status();
        let response_body = response.text().await;

        if status_code != 200 {
            return Err(E::InvalidStatus(status_code.into(), response_body));
        }

        #[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
        struct Response {
            #[serde(rename = "employeeId")]
            employee_id: Option<String>,
        }

        let response_body = response_body.map_err(|error| E::FailedToReceiveRequestBody(error))?;

        let response_body: Response = serde_json::from_str(&response_body)
            .map_err(|error| E::FailedToParseJsonBody { status_code: status_code.into(), response_body, error })?;


        match response_body.employee_id {
            Some(employee_id) => Ok(Some(
                (&employee_id).parse::<i32>()
                    .map_err(|error| E::FailedToParseStringResponseToInt { original_value: employee_id, error })?
            )),
            None => Ok(None)
        }
    }

    pub async fn update_access_token(&mut self, access_token: String) {
        self.access_token = access_token;
    }
}

#[derive(Debug, thiserror::Error)]
pub enum RenewAccessTokenError {
    #[error("Failed to send request: {0:?}")]
    FailedToSendRequest(reqwest::Error),

    #[error("Invalid HTTP Status received: {0:?}, response body: {1:?}")]
    InvalidStatus(u16, Result<String, reqwest::Error>),

    #[error("Failed to receive request body: {0:?}")]
    FailedToReceiveRequestBody(reqwest::Error),

    #[error("Failed to parse json body, status code: {status_code:?}, response body: {response_body:?}, error: {error:?}")]
    FailedToParseJsonBody { status_code: u16, response_body: String, error: serde_json::Error },
}

#[derive(Debug, thiserror::Error)]
pub enum RequestAccessTokenError {
    #[error("Failed to send request: {0:?}")]
    FailedToSendRequest(reqwest::Error),

    #[error("Invalid HTTP Status received: {0:?}, response body: {1:?}")]
    InvalidStatus(u16, Result<String, reqwest::Error>),

    #[error("Failed to receive request body: {0:?}")]
    FailedToReceiveRequestBody(reqwest::Error),

    #[error("Failed to parse json body, status code: {status_code:?}, response body: {response_body:?}, error: {error:?}")]
    FailedToParseJsonBody { status_code: u16, response_body: String, error: serde_json::Error },
}

#[derive(Debug, thiserror::Error)]
pub enum GetUserEmployeeIdError {
    #[error("Failed to send request: {0:?}")]
    FailedToSendRequest(reqwest::Error),

    #[error("Invalid HTTP Status received: {0:?}, response body: {1:?}")]
    InvalidStatus(u16, Result<String, reqwest::Error>),

    #[error("Failed to receive request body: {0:?}")]
    FailedToReceiveRequestBody(reqwest::Error),

    #[error("Failed to parse json body, status code: {status_code:?}, response body: {response_body:?}, error: {error:?}")]
    FailedToParseJsonBody { status_code: u16, response_body: String, error: serde_json::Error },

    #[error("Failed to parse string from response to int: {error}")]
    FailedToParseStringResponseToInt { original_value: String, error: std::num::ParseIntError },
}

#[derive(Debug, thiserror::Error)]
#[error("failed to construct login callback url: {0}")]
pub struct FailedToConstructLoginCallbackUrl(url::ParseError);

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct RequestAccessTokenResponse {
    pub token_type: String,
    pub scope: String,
    pub expires_in: u32,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct RenewAccessTokenResponse {
    pub token_type: String,
    pub scope: String,
    pub expires_in: u32,
    pub access_token: String,
    pub refresh_token: String,
}
