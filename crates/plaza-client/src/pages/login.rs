use yew::prelude::*;
use yew_router::prelude::*;
use crate::app::Route;
use crate::text_field::*;
use connector::{LoginRequestBody, LoginResponse, ValidationErrorWithTranslation, BadRequestError};
use crate::api::{ApiClient, LoginError};
use crate::app::AppState;
use crate::icons::LoadingIcon;

pub struct Login {
    email: String,
    password: String,
    validation_error: Option<ValidationErrorWithTranslation>,
    loading: bool,
}

pub enum LoginMessage {
    UpdateEmail(String),
    UpdatePassword(String),
    FormSubmitted,
    FormSuccess(LoginResponse),
    FormSuccessProcessingFinished,
    FormValidationError(ValidationErrorWithTranslation),
    FormError(LoginError),
}

impl Component for Login {
    type Message = LoginMessage;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            email: String::new(),
            password: String::new(),
            validation_error: None,
            loading: false,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::UpdateEmail(email) => {
                self.email = email;
                self.validation_error = None;

                return true;
            },
            Self::Message::UpdatePassword(password) => {
                self.password = password;
                self.validation_error = None;
                
                return true;
            },
            Self::Message::FormSubmitted => {
                self.loading = true;

                let body = LoginRequestBody {
                    email: self.email.clone(),
                    password: self.password.clone(),
                };

                let scope = ctx.link().clone();

                wasm_bindgen_futures::spawn_local(async move {
                    match ApiClient::new().login(body).await {
                        Ok(json) => scope.send_message(Self::Message::FormSuccess(json)),
                        Err(error) => match error {
                            LoginError::BadRequest(ref bad_request) => match bad_request {
                                BadRequestError::ValidationWithTranslation(validation_error) => {
                                    scope.send_message(Self::Message::FormValidationError(validation_error.clone()));
                                },
                                _ => scope.send_message(Self::Message::FormError(error)),
                            }
                            _ => scope.send_message(Self::Message::FormError(error)),
                        }
                    }
                });

                return true;
            },
            Self::Message::FormSuccess(success_response) => {
                let state = ctx.link().context::<AppState>(Callback::noop()).expect("expected a valid global state handle").0;

                let link = ctx.link().clone();
                wasm_bindgen_futures::spawn_local(async move {
                    if let Err(error) = state.authorization_state.set_logged_in_user(
                        success_response.user, 
                        success_response.authorization_token
                    ).await {
                        state.fatal_error_state.report(error);
                    }

                    link.send_message(Self::Message::FormSuccessProcessingFinished);
                });

                return false;
            }
            Self::Message::FormSuccessProcessingFinished => {
                self.loading = false;

                ctx.link().navigator().expect("expected a valid navigation handle").push(&Route::Home);

                return true;
            }
            Self::Message::FormError(error) => {
                let state = ctx.link().context::<AppState>(Callback::noop()).expect("global state to be present").0;
                state.fatal_error_state.report(error);
                self.loading = false;

                return true;
            }
            Self::Message::FormValidationError(error) => {
                self.validation_error = Some(error);
                self.loading = false;

                return true;
            }
        };

    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let update_email = {
            let scope = ctx.link().clone();
            Callback::from(move |event: TextFieldInputEvent| {
                scope.send_message(Self::Message::UpdateEmail(event.new_value));
            })
        };

        let update_password = {
            let scope = ctx.link().clone();
            Callback::from(move |event: TextFieldInputEvent| {
                scope.send_message(Self::Message::UpdatePassword(event.new_value));
            })
        };

        let on_login_by_microsoft = Callback::from(|_: MouseEvent| {
            unimplemented!("unimplemented");
        });

        let on_form_submit = {
            let scope = ctx.link().clone();
            Callback::from(move |submit_event: SubmitEvent| {
                submit_event.prevent_default();

                scope.send_message(LoginMessage::FormSubmitted);
            })
        };

        html! {
            <div class="flex flex-col gap-4 justify-center items-center w-full flex-grow overflow-auto">
                <div class="w-full h-full flex-grow flex flex-col justify-center items-center gap-4 p-3 group relative">
                    <div class="p-4 border-3 border-neutral-800 w-full max-w-xl flex flex-col gap-4 justify-center items-center rounded-xl">
                        <h2 class="text-3xl font-bold pb-2">{"Logowanie"}</h2>

                        <button onclick={on_login_by_microsoft} class="bg-blue-800 w-full rounded-xl px-8 py-3 flex flex-row gap-2 justify-center items-center cursor-pointer">
                            <img data-trunk="true" src="/assets/white_microsoft_logo.png" class="w-5 aspect-square" />
                            {"Zaloguj przez Microsoft"}
                        </button>

                        <form onsubmit={on_form_submit} class="flex flex-col gap-4 justify-center items-center w-full">
                            <div class="w-full text-neutral-300 flex flex-row justify-center items-center gap-2">
                                <hr class="text-neutral-600 w-full" />
                                {"albo"}
                                <hr class="text-neutral-600 w-full" />
                            </div>

                            {
                                match &self.validation_error {
                                    Some(validation_error) => html! {
                                        <div class="px-4 py-3 bg-red-600/15 border-3 border-red-900 rounded-xl w-full">

                                            {&validation_error.message}
                                        </div>
                                    },
                                    None => html! {}
                                }
                            }

                            <TextField disabled={self.loading} field_type={TextFieldType::Email} oninput={update_email}>{"Email"}</TextField>
                            <TextField disabled={self.loading} field_type={TextFieldType::Password} oninput={update_password}>{"Hasło"}</TextField>

                            <button disabled={self.loading} class="px-8 py-2 border-3 border-blue-600 w-full rounded-xl cursor-pointer hover:bg-blue-800 focus:bg-blue-800 disabled:bg-blue-800 duration-300 uppercase tracking-widest text-blue-600 hover:border-blue-800 hover:text-neutral-200 focus:border-blue-800 focus:text-neutral-200 disabled:border-blue-800 disabled:text-neutral-200 font-semibold flex flex-row gap-2 justify-center items-center">
                                { if self.loading {
                                    html! {
                                        <LoadingIcon classes="w-6 aspect-square animate-spin" />
                                    }
                                } else {
                                    html! {}
                                } }

                                {"Zaloguj"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        }
    }
}
