use yew::prelude::*;
use yew_router::prelude::*;
use crate::icons::ConfilogiIcon;
use crate::pages::*;
use crate::icons::MenuIcon;
use crate::fatal_error::*;
use crate::authorization_state::AuthorizationState;
use crate::route_guard::RouteGuard;
use connector::UserDto;
use crate::api::{AuthorizedApiClient, TypicalFetchingError};

pub struct App {
    fetched_logged_in_user: bool,
    logged_in_user: Option<UserDto>,
    mobile_navbar_show: bool,
    state: AppState,
}

pub enum Msg {
    MobileNavbarToggle,
    FinishedFetchingUser {
        user: Option<UserDto>,
    },
}

#[derive(Clone, PartialEq)]
pub struct AppState {
    pub fatal_error_state: FatalErrorState,
    pub authorization_state: AuthorizationState,
}

impl Component for App {
    type Message = Msg;
    type Properties = ();

    fn create(ctx: &Context<Self>) -> Self {
        let authorization_state = match AuthorizationState::new() {
            Ok(state) => state,
            Err(error) => {
                log::error!("Critical error, failed to initialize authorization state: {error:?}");
                log::debug!("Removing the cache and reloading...");

                AuthorizationState::emergency_clean();

                gloo_utils::window().location().set_href("/");

                unreachable!();
            }
        };

        let state = AppState {
            fatal_error_state: FatalErrorState::new(),
            authorization_state: authorization_state.clone(),
        };

        let me = Self {
            fetched_logged_in_user: false,
            logged_in_user: None,
            mobile_navbar_show: false, 
            state: state.clone(),
        };

        me.fetch_user(ctx, state);

        me
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::MobileNavbarToggle => {
                self.mobile_navbar_show = !self.mobile_navbar_show;
                true
            }
            Self::Message::FinishedFetchingUser { user } => {
                self.logged_in_user = user;
                self.fetched_logged_in_user = true;
                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <ContextProvider<AppState> context={self.state.clone()}>
                <BrowserRouter>
                    <FatalErrorModal />

                    <div class="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col">
                        { if !self.fetched_logged_in_user {
                            html! {
                                <div class="w-full min-h-screen flex flex-col gap-4 justify-center items-center">
                                    <ConfilogiIcon classes="w-28 z-10" />
                                    <p class="animate-pulse select-none z-10">{"Pobieranie danych o użytkowniku..."}</p>
                                </div>
                            }
                        } else {
                            html! {
                                <>
                                    <RouteGuard />
                                    {self.render_header(ctx.clone())}
                                    <Switch<Route> render={switch_routes} />
                                </>
                            }
                        } }
                    </div>
                </BrowserRouter>
            </ContextProvider<AppState>>
        }
    }
}

impl App {
    fn fetch_user(&self, ctx: &Context<Self>, app_state: AppState) {
        let scope = ctx.link().clone();

        wasm_bindgen_futures::spawn_local(async move {
            let token = match app_state.authorization_state.authorization_token().await {
                Some(token) => token,
                None => {
                    scope.send_message(Msg::FinishedFetchingUser { user: None });
                    return;
                },
            };

            match AuthorizedApiClient::new(token.clone())
                .get_currently_logged_in_user()
                .await {
                Ok(user) => {
                    app_state.authorization_state.set_logged_in_user(user.clone(), token).await;
                    scope.send_message(Msg::FinishedFetchingUser { user: Some(user) });
                },
                Err(error) => match error {
                    TypicalFetchingError::UnauthorizedError(_) => {
                        app_state.authorization_state.remove_logged_in_user();
                        scope.send_message(Msg::FinishedFetchingUser { user: None });
                    }
                    _ => app_state.fatal_error_state.report(error),
                }
            }

        });
    }

    fn render_header(&self, ctx: &Context<Self>) -> Html {
        let on_toggle_mobile_menu_button_click = ctx.link().callback(|_: MouseEvent| Msg::MobileNavbarToggle);

        let mobile_navbar_items_classes = if self.mobile_navbar_show {
            "absolute w-screen md:!hidden hidden [&.is-active]:flex flex-col h-full top-[100%] left-0 z-30 bg-neutral-950 border-t border-neutral-800 is-active"
        } else {
            "absolute w-screen md:!hidden hidden [&.is-active]:flex flex-col h-full top-[100%] left-0 z-30 bg-neutral-950 border-t border-neutral-800"
        };

        html! {
            <header class="relative w-full flex flex-row justify-between items-center border-b border-b-neutral-800">
                <ConfilogiIcon classes="w-28 mx-4 py-2" />

                <div class="w-full hidden md:flex flex-row justify-end">
                    { if self.logged_in_user.is_some() {
                        html! {
                            <>
                                <Link<Route> to={Route::ReportProblem} classes="px-4 py-4 hover:bg-neutral-800">
                                    {"Zgłoś problem"}
                                </Link<Route>>

                                <Link<Route> to={Route::MyTickets} classes="px-4 py-4 hover:bg-neutral-800">
                                    {"Moje zgłoszenia"}
                                </Link<Route>>

                                <div class="flex flex-col text-end justify-center px-4">
                                    <span class="text-xs text-neutral-400">
                                        {"Zalogowany jako"}
                                    </span>
                                    {&self.logged_in_user.as_ref().expect("if statement to not lie").full_name}
                                </div>
                            </>
                        }
                    } else {
                        html! {
                            <Link<Route> to={Route::Home} classes="px-4 py-4 hover:bg-neutral-800">
                            {"Zaloguj"}
                            </Link<Route>>
                        } 
                    } }
                </div>

                <div class={mobile_navbar_items_classes}>
                    { if self.logged_in_user.is_some() {
                        html! {
                            <>
                                <Link<Route> to={Route::ReportProblem} classes="px-4 py-3 bg-neutral-950 hover:bg-neutral-800 border-t border-b border-neutral-800">{ "Zgłoś problem" }</Link<Route>>

                                <Link<Route> to={Route::MyTickets} classes="px-4 py-3 bg-neutral-950 hover:bg-neutral-800 border-b border-b-neutral-800">
                                    {"Moje zgłoszenia"}
                                </Link<Route>>
                            </>
                        }
                    } else {
                        html! {
                            <Link<Route> to={Route::Home} classes="px-4 py-3 bg-neutral-950 hover:bg-neutral-800 border-b border-b-neutral-800">
                                {"Zaloguj"}
                            </Link<Route>>
                        }
                    } }
                </div>

                <button onclick={on_toggle_mobile_menu_button_click} class="flex justify-center items-center px-4 py-3 cursor-pointer md:hidden text-neutral-200" type="button">
                    <MenuIcon additional_classes="text-neutral-200 w-8 aspect-square" />
                </button>
            </header>
        }
    }
}

#[derive(Routable, PartialEq, Eq, Clone, Debug)]
pub enum Route {
    #[at("/")]
    Home,

    #[at("/login")]
    Login,

    #[at("/report-problem")]
    ReportProblem,

    #[at("/report-problem/onboarding")]
    ReportOnboarding,

    #[at("/my-tickets")]
    MyTickets,

    #[not_found]
    #[at("/404")]
    NotFound,
}

fn switch_routes(route: Route) -> Html {
    match route {
        Route::Home => {
            html! { <Home /> }
        }
        Route::Login => {
            html! { <Login /> }
        }
        Route::ReportProblem => {
            html! { <ReportProblem /> }
        }
        Route::ReportOnboarding => {
            html! { <ReportOnboarding /> }
        }
        Route::MyTickets => {
            html! { <MyTickets /> }
        }
        Route::NotFound => {
            html! { <PageNotFound /> }
        }
    }
}

