use axum::{
    Extension,
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use sqlx::{Pool, Postgres};

use crate::{SessionEntity, UnitOfWork};

pub async fn must_be_logged_in(
    State(state): State<Pool<Postgres>>,
    mut req: Request,
    next: Next,
) -> Result<Response, Response> {
    let mut uow = UnitOfWork::new(&state).await.unwrap();

    let session_entity: &SessionEntity = req
        .extensions()
        .get::<SessionEntity>()
        .expect("middleware that handles session should prepare session entity first");

    let user = match session_entity.logged_in_user_id {
        Some(logged_in_user_id) => uow.find_user_by_id(logged_in_user_id).await.unwrap(),
        None => return Ok((StatusCode::UNAUTHORIZED, "401 Unauthorized").into_response()),
    };

    uow.commit().await.unwrap();

    req.extensions_mut().insert(user);

    Ok(next.run(req).await)
}
