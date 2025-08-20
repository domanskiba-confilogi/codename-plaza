use yew::prelude::*;
use crate::app::Route;
use yew_router::prelude::*;
use crate::icons::{UserPlusIcon, UserMinusIcon, RepeatIcon, LogInIcon, BarChartIcon, UnlockIcon, HeadphonesIcon, AlertIcon};

pub struct ReportProblem;

impl Component for ReportProblem {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let navigator = ctx.link().navigator().unwrap();

        let redirect_to_onboarding = {
            let navigator = navigator.clone();
            Callback::from(move |_: MouseEvent| navigator.push(&Route::Home))
        };

        let redirect_to_offboarding = {
            let navigator = navigator.clone();
            Callback::from(move |_: MouseEvent| navigator.push(&Route::Home))
        };
        
        let redirect_to_request_permissions = {
            let navigator = navigator.clone();
            Callback::from(move |_: MouseEvent| navigator.push(&Route::Home))
        };

        let redirect_to_network_issues = {
            let navigator = navigator.clone();
            Callback::from(move |_: MouseEvent| navigator.push(&Route::Home))
        };

        let redirect_to_unlock_account = {
            let navigator = navigator.clone();
            Callback::from(move |_: MouseEvent| navigator.push(&Route::Home))
        };

        let redirect_to_broken_sound = {
            let navigator = navigator.clone();
            Callback::from(move |_: MouseEvent| navigator.push(&Route::Home))
        };

        let redirect_to_other = {
            let navigator = navigator.clone();
            Callback::from(move |_: MouseEvent| navigator.push(&Route::Home))
        };

        let redirect_to_stuff_replacement = Callback::from(move |_: MouseEvent| navigator.push(&Route::Home));

        html! {
            <div class="flex-grow w-full flex flex-col gap-4 items-center justify-start p-3">
                <ProblemCategoryCard onclick={redirect_to_onboarding} title="Onboarding" description="Zgłoszenia dotyczące tworzenia dostępów, wysyłki urządzeń i wszystkiego technicznego czego potrzebuje pracownik w pierwszym dniu pracy w firmie." >
                    <UserPlusIcon classes="w-10 sm:w-14 aspect-square" />
                </ProblemCategoryCard>

                <ProblemCategoryCard onclick={redirect_to_offboarding} title="Offboarding" description="Zgłoszenia związane z procesem zakończenia współpracy pracownika, obejmujące dezaktywację kont i zabezpieczenie danych.">
                    <UserMinusIcon classes="w-10 sm:w-14 aspect-square" />
                </ProblemCategoryCard>

                <ProblemCategoryCard onclick={redirect_to_stuff_replacement} title="Wymiana sprzętu komputerowego" description="Zgłoszenia dotyczące wymiany sprzętu komputerowego w celu poprawy wydajności lub naprawy usterek.">
                    <RepeatIcon classes="w-10 sm:w-14 aspect-square" />
                </ProblemCategoryCard>

                <ProblemCategoryCard onclick={redirect_to_broken_sound} title="Problemy z dźwiękiem" description="Zgłoszenia dotyczące niedziałającego, przerywającego dźwięku lub niedziałającego / cichego mikrofonu.">
                    <HeadphonesIcon classes="w-10 sm:w-14 aspect-square" />
                </ProblemCategoryCard>

                <ProblemCategoryCard onclick={redirect_to_network_issues} title="Problemy z łącznością" description="Zgłoszenia dotyczące przerywania połączeń głosowych lub internetu.">
                    <BarChartIcon classes="w-10 sm:w-14 aspect-square" />
                </ProblemCategoryCard>

                <ProblemCategoryCard onclick={redirect_to_request_permissions} title="Nadanie uprawnień" description="Zgłoszenia dotyczące nadania brakujących uprawnień dla już istniejącego użytkownika.">
                    <LogInIcon classes="w-10 sm:w-14 aspect-square" />
                </ProblemCategoryCard>

                <ProblemCategoryCard onclick={redirect_to_unlock_account} title="Odblokowanie konta" description="Zgłoszenia dotyczące odblokowywania zablokowanych kont Microsoft przez zbyt dużą ilość nieudanych prób logowania.">
                    <UnlockIcon classes="w-10 sm:w-14 aspect-square" />
                </ProblemCategoryCard>

                <ProblemCategoryCard onclick={redirect_to_other} title="Inne" description="Zgłoszenia dotyczące wszystkiego innego niż powyższe kategorie.">
                    <AlertIcon classes="w-10 sm:w-14 aspect-square" />
                </ProblemCategoryCard>
            </div>
        }
    }
}

struct ProblemCategoryCard;

#[derive(Properties, PartialEq)]
struct ProblemCategoryCardProperties {
    title: String,
    description: String,
    onclick: Callback<MouseEvent>,
    children: Html,
}


impl Component for ProblemCategoryCard {
    type Properties = ProblemCategoryCardProperties;
    type Message = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
                <div onclick={&ctx.props().onclick} class="w-full border-3 border-neutral-800 px-4 py-3 rounded-xl gap-4 hover:scale-[102%] duration-150 cursor-pointer max-w-3xl" >
			<div class="aspect-square max-w-[100px] sm:max-w-[125px] w-full bg-blue-800/50 rounded-[50%] flex justify-center items-center float-left">
                            {ctx.props().children.clone()}
			</div>

			<div class="pl-4 flex flex-col gap-3 overflow-hidden">
				<h2 class="font-semibold text-xl">{&ctx.props().title}</h2>
				<p class="line-clamp-2 sm:line-clamp-none">{&ctx.props().description}</p>
			</div>
		</div>
        }
    }
}
