import { createApiConnector } from "./api.js";
import { AuthStore } from "./auth_store.js";
import { mountModal } from "./component_modal.js";

export async function checkIsLoggedInMiddleware(authStore: AuthStore): Promise<void> {
	const apiConnector = createApiConnector({
		authStore
	});
	const result = await apiConnector.getLoggedInUser();

	if (result.unauthorizedError !== null) {
		window.location.href = '/index.html';
	} else if (result.ok !== null) {
		authStore.setLoggedInUser(authStore.getAuthorizationToken(), result.ok);
	} else {
		const errorModal = mountModal('#error-modal-root', {
			title: 'A critical error occured',
			contentHtml: `${result.unknownError}`,
			primaryAction: {
				label: 'Refresh page',
				onClick: () => {
					window.location.reload();
				},
			},
		});
		errorModal.open();
		throw result.unknownError;
	}
}

export async function checkIsGuestMiddleware(authStore: AuthStore): Promise<void> {
	const apiConnector = createApiConnector({
		authStore
	});
	const result = await apiConnector.getLoggedInUser();

	if (result.ok !== null) {
		window.location.href = '/reported-problems.html';
	} else if (result.unauthorizedError !== null) {
		authStore.setLoggedInUser(null, null);
	} else {
		const errorModal = mountModal('#error-modal-root', {
			title: 'A critical error occured',
			contentHtml: `${result.unknownError}`,
			primaryAction: {
				label: 'Refresh page',
				onClick: () => {
					window.location.reload();
				},
			},
		});
		errorModal.open();
		throw result.unknownError;
	}
}
