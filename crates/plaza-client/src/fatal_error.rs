use std::collections::VecDeque;
use yew::prelude::*;
use std::rc::Rc;
use gloo_timers::future::TimeoutFuture;
use std::cell::RefCell;
use crate::app::AppState;
use std::fmt::Debug;

#[derive(Clone, PartialEq)]
pub struct FatalErrorState {
    inner: Rc<RefCell<VecDeque<String>>>
}

impl FatalErrorState {
    pub fn new() -> Self {
        Self { inner: Rc::new(RefCell::new(VecDeque::new())) }
    }

    pub fn report<T: Sized + Debug>(&self, error: T) {
        let error = format!("{error:?}");

        log::error!("FATAL ERROR OCCURED: {error:?}");

        let inner_state = self.inner.clone();

        wasm_bindgen_futures::spawn_local(async move {
            loop {
                match inner_state.try_borrow_mut() {
                    Ok(mut state) => {
                        state.push_back(error);
                        break;
                    },
                    Err(_) => TimeoutFuture::new(50).await,
                }
            }
        });
    }

    pub async fn read(&self) -> Option<String> {
        loop {
            match self.inner.try_borrow_mut() {
                Ok(mut state) => {
                    return state.pop_front();
                },
                Err(_) => TimeoutFuture::new(50).await,
            }
        }
    }
}

pub struct FatalErrorModal {
    errors: Vec<String>,
}

pub enum FatalErrorModalMessage {
    ShowError(String),
    DismissError(usize),
}

impl Component for FatalErrorModal {
    type Properties = ();
    type Message = FatalErrorModalMessage;

    fn create(ctx: &Context<Self>) -> Self {
        {
            let scope = ctx.link().clone();
            let state = scope.context::<AppState>(Callback::noop()).expect("Expected global state to be present.").0;

            wasm_bindgen_futures::spawn_local(async move {
                loop {
                    TimeoutFuture::new(150).await;

                    if let Some(fatal_error) = state.fatal_error_state.read().await {
                        scope.send_message(FatalErrorModalMessage::ShowError(fatal_error))
                    }
                }
            })
        }

        Self { errors: Vec::new() }
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::ShowError(message) => {
                self.errors.push(message);
            },
            Self::Message::DismissError(error_index) => {
                self.errors.remove(error_index);
            }
        }

        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let scope = ctx.link().clone();
        let dismiss_error = |error_index: usize| {
            Callback::from(move |_: MouseEvent| {
                scope.send_message(Self::Message::DismissError(error_index));
            })
        };

        html! {
            { for self.errors.iter().enumerate().map(|(index, error)| {
                html! {
                    <div class="text-neutral-100 z-50 fixed top-0 left-0 w-full h-screen bg-neutral-950/75 flex justify-center items-center px-4 py-3">
                        <div class="flex flex-col gap-4 w-full max-w-xl bg-neutral-950 border-3 border-neutral-800 rounded-xl px-4 py-3">
                            <h1 class="text-3xl font-bold truncate">{"A critical error occured"}</h1>

                            <p>{"Please contact our tech support team at support@confilogi.com to resolve the issue."}</p>

                            <div class="text-neutral-300 text-sm">
                                {error}
                            </div>

                            <div class="flex flex-row justify-end items-center">
                                <button class="px-8 py-3 bg-blue-800 font-semibold rounded-xl cursor-pointer" onclick={dismiss_error.clone()(index)}>
                                    {"Close"}
                                </button>
                            </div>
                        </div>
                    </div>
                }
            }) }
        }
    }
}
