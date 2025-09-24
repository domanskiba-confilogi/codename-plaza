import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { createAuthStore } from "./auth_store.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { mountNavbar } from "./component_navbar.js";
import { reportCriticalError, LOGGED_IN_NAVBAR_ARGS, mustQuerySelector } from "./helpers.js";

const loadingScreen = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {
		const authStore = createAuthStore();

		await checkIsLoggedInMiddleware(authStore);

		Array.from(document.querySelectorAll(`[data-unhide="true"]`)).forEach(ele => ele.classList.remove("hidden"));

		loadingScreen.destroy();

		mountNavbar('#navbar-root', {
			brandHref: '/',
			brandName: 'Confilogi',
			brandAccent: 'IT Support',
			...LOGGED_IN_NAVBAR_ARGS
		});

		// Current user (injected by server or fallback demo)
		const CURRENT_USER = authStore.getLoggedInUser();

		if (CURRENT_USER === null) {
			throw new Error("Current user is null (it shouldn't be).");
		}


		// Populate profile card safely
		mustQuerySelector(document.body, '#profile-name').textContent  = CURRENT_USER!.fullName || '';
		mustQuerySelector(document.body, '#profile-email').textContent = CURRENT_USER!.email || '';
		mustQuerySelector(document.body, '#profile-job').textContent   = CURRENT_USER!.jobTitle.name || CURRENT_USER!.jobTitle.intranetName;
		mustQuerySelector(document.body, '#profile-dept').textContent  = CURRENT_USER!.companyDepartment?.name || 'No department specified';

	} catch (error) {
		reportCriticalError(error);
	}
})();
