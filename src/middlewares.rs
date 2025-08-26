use sqlx::{Pool, Postgres};
use axum::{middleware::Next, extract::{Request, State}, response::Response};
use axum_macros::debug_middleware;
use crate::UnitOfWork;
use crate::handlers::UnauthorizedError;
use axum::response::IntoResponse;

#[debug_middleware]
pub async fn must_be_logged_in(
    State(pool): State<Pool<Postgres>>,
    mut request: Request,
    next: Next,
) -> Response {
    let mut uow = UnitOfWork::new(&pool).await.unwrap();

    let authorization = request.headers().get("authorization").map(|value| value.to_str().unwrap_or_default()).unwrap_or_default();

    if !authorization.starts_with("Bearer ") {
        return UnauthorizedError::new().into_response();
    }

    let authorization = authorization.trim_start_matches("Bearer ");

    if let Some(user) = uow.find_user_by_authorization_token(&authorization).await.unwrap() {
        request.extensions_mut().insert(user);
    } else {
        return UnauthorizedError::new().into_response();
    }

    uow.commit().await.unwrap();

    next.run(request).await
}
