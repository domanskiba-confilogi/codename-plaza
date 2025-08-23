use yew::prelude::*;
use yew_router::prelude::*;
use crate::icons::ConfilogiIcon;
use crate::pages::*;
use crate::icons::MenuIcon;

pub struct App {
    mobile_navbar_show: bool,
    is_logged_in: bool,
    logged_in_full_name: String,
}

pub enum Msg {
    MobileNavbarToggle
}

impl Component for App {
    type Message = Msg;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self { mobile_navbar_show: false, is_logged_in: false, logged_in_full_name: "".to_string(), }
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Self::Message::MobileNavbarToggle => {
                self.mobile_navbar_show = !self.mobile_navbar_show;
                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let on_toggle_mobile_menu_button_click = ctx.link().callback(|_: MouseEvent| Self::Message::MobileNavbarToggle);

        let mobile_navbar_items_classes = if self.mobile_navbar_show {
            "absolute w-screen md:!hidden hidden [&.is-active]:flex flex-col h-full top-[100%] left-0 z-30 bg-neutral-950 border-t border-neutral-800 is-active"
        } else {
            "absolute w-screen md:!hidden hidden [&.is-active]:flex flex-col h-full top-[100%] left-0 z-30 bg-neutral-950 border-t border-neutral-800"
        };

        html! {
            <BrowserRouter>
                <div class="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col">
                    <header class="relative w-full flex flex-row justify-between items-center border-b border-b-neutral-800">
                        <ConfilogiIcon additional_classes="w-28 mx-4 py-2" />

                        <div class="w-full hidden md:flex flex-row justify-end">
                            { if self.is_logged_in {
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
                                            {&self.logged_in_full_name}
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
                            { if self.is_logged_in {
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
                    <Switch<Route> render={switch_routes} />
                </div>
            </BrowserRouter>
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

