import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { createAuthStore } from "./auth_store.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { mountNavbar } from "./component_navbar.js";
import { mustQuerySelector, reportCriticalError, LOGGED_IN_NAVBAR_ARGS } from "./helpers.js";

const loadingScreen = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {
		const authStore = createAuthStore();

		await checkIsLoggedInMiddleware(authStore);

		const search = new URLSearchParams();
		search.set("redirect_to", "/report-problem/hardware-replacement.html");

		mustQuerySelector(document.body, "#hardware-replacement-link")
			.setAttribute("href", "/report-problem/choose-person.html?" + search.toString());

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
