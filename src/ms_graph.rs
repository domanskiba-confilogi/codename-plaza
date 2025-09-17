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

    pub fn get_login_callback_uri() -> Result<String, FailedToConstructLoginCallbackUrl> {
        let mut url = Url::parse(format!("https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"))
            .map_err(|error| FailedToConstructLoginCallbackUrl(error))?;

        url.append_pair("client_id", self.client_id);
        url.append_pair("response_type", "code");
        url.append_pair("redirect_uri", self.redirect_uri);
        url.append_pair("scope", "User.Read");
        url.append_pair("response_mode", "query");

        url.as_str().to_string()
    }

    pub async fn request_access_token(&self, code: &str) -> Result<RequestAccessTokenResponse, RequestAccessTokenError> {
        type E = RequestAccessTokenError;

        let client = reqwest::Client::new();

        let form = reqwest::multipart::Form::new()
            .text("client_id", &self.client_id)
            .text("scope", "User.Read")
            .text("code", code)
            .text("redirect_uri", &self.redirect_uri)
            .text("grant_type", "authorization_code")
            .text("client_secret", &self.client_secret);

        let response = client.post(&format!("/{tenant_id}/oauth2/v2.0/token"))
            .header("content-type", "application/x-www-form-urlencoded")
            .body(form)
            .send()
            .await?;

        let status_code = response.status();
        let response_body = response.text().await;

        if response.status() !== 200 {
            return Err(E::InvalidStatus(status_code));
        }

        let response_body = response.json().await
            .map_err(|error| E::FailedToParseJsonBody(status_code, response_body))?;

        Ok(response_body)
    }
    
    pub fn into_authenticated_client(self, access_token: String, refresh_token: String, expires_at_unix: u64) -> AuthenticatedClient {
        AuthenticatedClient {
            tenant_id: self.tenant_id,
            client_id: self.client_id,
            client_secret: self.client_secret,
            redirect_uri: self.redirect_uri,

            access_token,
            refresh_token
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
    expires_at_unix: u64
}

impl AuthenticatedClient {
    pub async fn renew_access_token(&self) -> Result<RenewAccessTokenResponse, RenewAccessTokenError> {
        type E = RenewAccessTokenError;

        let client = reqwest::Client::new();

        let form = reqwest::multipart::Form::new()
            .text("client_id", &self.client_id)
            .text("scope", "User.Read")
            .text("refresh_token", self.refresh_token)
            .text("grant_type", "refresh_token")
            .text("client_secret", &self.client_secret);

        let response = client.post(&format!("/{tenant_id}/oauth2/v2.0/token"))
            .header("content-type", "application/x-www-form-urlencoded")
            .body(form)
            .send()
            .await?;

        let status_code = response.status();
        let response_body = response.text().await;

        if response.status() !== 200 {
            return Err(E::InvalidStatus(status_code));
        }

        let response_body = response.json().await
            .map_err(|error| E::FailedToParseJsonBody(status_code, response_body))?;

        Ok(response_body)
    }

    pub async fn get_user_employee_id(&self) -> Result<i32, GetUserEmployeeIdError> {
        type E = GetUserEmployeeIdError;

        let client = reqwest::Client::new();

        let response = client.post(&format!("/{tenant_id}/oauth2/v2.0/token"))
            .header("authorization", format!("Bearer {}", self.acess_token))
            .send()
            .await?;

        let status_code = response.status();
        let response_body = response.text().await;

        if response.status() !== 200 {
            return Err(E::InvalidStatus(status_code));
        }

        #[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
        struct Response {
            #[serde(rename = "employeeId")]
            employee_id: i32,
        }

        let response_body: Response = response.json().await
            .map_err(|error| E::FailedToParseJsonBody(status_code, response_body))?;

        Ok(response_body.employee_id)
    }

    pub async fn update_access_token(&mut self, access_token: String, expires_at_unix: u64) {
        self.access_token = access_token;
        self.expires_at_unix = expires_at_unix;
    }
}

#[derive(Debug)]
enum RenewAccessTokenError {
    InvalidStatus(u16, Result<String, serde_json::Error>),
    FailedToParseJsonBody(u16, Result<String, serde_json::Error>)
}

#[derive(Debug)]
enum RequestAccessTokenError {
    InvalidStatus(u16, Result<String, serde_json::Error>),
    FailedToParseJsonBody(u16, Result<String, serde_json::Error>)
}

struct FailedToConstructLoginCallbackUrl(url::ParseError);

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct RequestAccessTokenResponse {
    token_type: String,
    scope: String,
    expires_in: u32,
    access_token: u32,
    refresh_token: String,
}
