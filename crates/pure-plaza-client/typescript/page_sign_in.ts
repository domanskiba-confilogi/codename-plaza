import { mountSuspenseScreen } from "./component_suspense_screen.js"; 
import { createApiConnector } from "./api.js"; 
import { mountButton } from "./component_button.js"; 
import { mountNavbar } from "./component_navbar.js"; 
import { createAuthStore } from "./auth_store.js";
import { checkIsGuestMiddleware } from "./middlewares.js";
import { LOGGED_OUT_NAVBAR_ARGS, mustQuerySelector, reportCriticalError } from "./helpers.js";

const authStore = createAuthStore();

const loadingScreen = mountSuspenseScreen("#loading-screen-root", {
	message: "Loading needed data...",
});

const apiConnector = createApiConnector({
	authStore
});

(async () => {
	try {
		await checkIsGuestMiddleware(authStore);

		const microsoftUri: string = await apiConnector.getMicrosoftSignInRedirectionUri()
			.then(result => {
				if (result.unknownError !== null) {
					throw result.unknownError;
				}

				if (result.ok !== null) {
					throw new Error("ok property should not be null");
				}

				return result.ok!;
			});

		loadingScreen.destroy();

		mountNavbar('#navbar-root', {
			brandHref: '/',
			brandName: 'Confilogi',
			brandAccent: 'IT Support',
			...LOGGED_OUT_NAVBAR_ARGS
		});

		mountButton('#redirect-now-btn', {
			label: 'Redirect now',
			variant: 'primary',
			size: 'md',
			type: 'button',
			href: microsoftUri
		});

		mountButton('#emergency-sign-in-btn', {
			label: 'Emergency sign in',
			variant: 'secondary',
			size: 'sm',
			type: 'button',
			href: '/emergency-sign-in.html'
		});

		let redirectIn = 5;
		const redirectionTimerEl = mustQuerySelector(document.body, "#redirection-timer");

		const redirectionTick = () => {
			redirectIn--;

			if (redirectIn < 0) {
				// window.location.href = microsoftUri;
			} else {
				redirectionTimerEl.innerHTML = String(redirectIn);
			}
		}

		redirectionTick();

		setInterval(redirectionTick, 1000);

	} catch (error: any) {
		reportCriticalError(error);
	}
})();
