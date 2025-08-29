use connector::BadRequestError;

pub struct ApiClient {

}

#[derive(Debug, thiserror::Error)]
pub enum LoginError {
    #[error("bad request error: {0:?}")]
    BadRequest(BadRequestError),

    #[error("response body parsing error: {0}")]
    ResponseBodyParsing(gloo_net::Error),

    #[error("unknown http response error - StatusCode: {status_code} - Body: {body}")]
    UnknownHttpResponse {
        status_code: u16,
        body: String,
    },

    #[error("attach request body error: {0}")]
    AttachRequestBody(gloo_net::Error),

    #[error("failed to send request: {0}")]
    FailedToSendRequest(gloo_net::Error),

    #[error("failed to parse bad request: {0}")]
    FailedToParseBadRequest(gloo_net::Error),
}

impl ApiClient {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn login(&self, request_body: connector::LoginRequestBody) -> Result<connector::LoginResponse, LoginError> {
        let request = gloo_net::http::Request::post("/api/auth/login").json(&request_body)
            .map_err(|gloo_error| LoginError::AttachRequestBody(gloo_error))?;

        let response = request.send().await.map_err(|gloo_error| LoginError::FailedToSendRequest(gloo_error))?;

        if response.status() == 400 {
            let bad_request = response.json::<BadRequestError>()
                .await
                .map_err(|error| LoginError::FailedToParseBadRequest(error))?;

            return Err(LoginError::BadRequest(bad_request));
        }

        if response.status() != 200 {
            let text = response.text().await.unwrap_or_default();
            
            return Err(LoginError::UnknownHttpResponse {
                status_code: response.status(),
                body: text,
            });
        }


        return Ok(
            response.json::<connector::LoginResponse>()
                .await
                .map_err(|error| LoginError::ResponseBodyParsing(error))?
        );
    }
}

