use yew::prelude::*;
use yew_router::prelude::*;
use crate::app::Route;

pub struct Login;

impl Component for Login {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! {
            <div class="flex flex-col gap-4 justify-center items-center w-full flex-grow overflow-auto">
                <div class="w-full h-full flex-grow flex flex-col justify-center items-center gap-4 p-3 group relative" hx-indicator="global-loading-indicator">

                    <h2 class="text-3xl font-bold">{"Logowanie"}</h2>

                    <form method="GET" action="/showcase/login" class="w-full max-w-xl px-4 py-3">
                        <Link<Route> to={Route::ReportProblem} classes="bg-blue-800 w-full rounded-xl px-8 py-3 flex flex-row gap-2 justify-center items-center cursor-pointer">
                            <img data-trunk="true" src="/assets/white_microsoft_logo.png" class="w-5 aspect-square" />
                            {"Zaloguj przez Microsoft"}
                        </Link<Route>>
                    </form>
                </div>
            </div>
        }
    }
}
