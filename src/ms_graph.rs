pub struct MsGraphClient {
    tenant_id: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
}

impl MsGraphClient {
    pub fn new(
        tenant_id: String,
        client_id: String,
        client_secret: String,
        redirect_uri: String,
    ) -> Self {
        Self {
            tenant_id,
            client_id,
            client_secret
        }
    }

    pub fn get_login_callback_uri(&self) -> Result<String, FailedToConstructLoginCallbackUrl> {
        let mut url = Url::parse(format!("https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"))
            .map_err(|error| FailedToConstructLoginCallbackUrl(error))?;

        url.append_pair("client_id", self.client_id);
        url.append_pair("response_type", "code");
        url.append_pair("redirect_uri", self.redirect_uri);
        url.append_pair("scope", "User.Read");
        url.append_pair("response_mode", "query");

        url.as_str().to_string()
    }

    pub async fn request_access_token(&self, code: &str) {
        let client = reqwest::Client::new();

        let form = reqwest::multipart::Form::new()
            .text("client_id", &self.client_id)
            .text("scope", "User.Read")
            .text("code", code)
            .text("redirect_uri", &self.redirect_uri)
            .text("grant_type", "authorization_code")
            .text("client_secret", &self.client_secret);

        client.post(&format!("/{tenant_id}/oauth2/v2.0/token"))
            .header("content-type", "application/x-www-form-urlencoded")
            .body(form)
            .await?;
    }
}

struct FailedToConstructLoginCallbackUrl(url::ParseError);
