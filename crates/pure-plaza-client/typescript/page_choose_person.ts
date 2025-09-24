import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { createAuthStore } from "./auth_store.js";
import { mountNavbar } from "./component_navbar.js";
import { LOGGED_IN_NAVBAR_ARGS, reportCriticalError, mustQuerySelector } from "./helpers.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";

const loadingScreen = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {
		const authStore = createAuthStore();

		await checkIsLoggedInMiddleware(authStore);

		let url = new URL(window.location.href);
		const search = new URLSearchParams(url.search);

		const redirectTo = new URLSearchParams(search).get('redirect_to') ?? '';

		if (redirectTo.length === 0) {
			throw new Error("Invalid 'redirect_to' argument.");
		}

		if (redirectTo[0]! !== '/') {
			throw new Error("Invalid 'redirect_to' argument.");
		}

		mustQuerySelector<HTMLAnchorElement>(document.body, `[data-target="myself"]`).href = redirectTo + "?target_person=myself";

		mustQuerySelector<HTMLAnchorElement>(document.body, `[data-target="colleague"]`).href = redirectTo + "?target_person=colleague";

		Array.from(document.querySelectorAll(`[data-unhide="true"]`)).forEach(ele => ele.classList.remove("hidden"));

		loadingScreen.destroy();

		mountNavbar('#navbar-root', {
			brandHref: '/',
			brandName: 'Confilogi',
			brandAccent: 'IT Support',
			...LOGGED_IN_NAVBAR_ARGS
		});
	} catch (error) {
		reportCriticalError(error);
	}
})();
