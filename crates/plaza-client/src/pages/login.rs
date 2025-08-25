use yew::prelude::*;
use yew_router::prelude::*;
use crate::app::Route;
use crate::text_field::*;

pub struct Login {
    email: String,
    password: String,
}

pub enum LoginMessage {
    UpdateEmail(String),
    UpdatePassword(String),
    FormSubmitted,
}

impl Component for Login {
    type Message = LoginMessage;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            email: String::new(),
            password: String::new(),
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::UpdateEmail(email) => {
                self.email = email;
            },
            Self::Message::UpdatePassword(password) => {
                self.password = password;
            },
            Self::Message::FormSubmitted => {
                log::info!("new form submittion: {}:{}", self.email, self.password);
            }
        };

        false
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

                            <TextField field_type={TextFieldType::Email} oninput={update_email}>{"Email"}</TextField>
                            <TextField field_type={TextFieldType::Password} oninput={update_password}>{"Hasło"}</TextField>

                            <button class="px-8 py-2 border-3 border-blue-600 w-full rounded-xl cursor-pointer hover:bg-blue-800 duration-300 uppercase tracking-widest text-blue-600 hover:border-blue-800 hover:text-neutral-200 font-semibold">
                                {"Zaloguj"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        }
    }
}
