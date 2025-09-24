import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { createAuthStore } from "./auth_store.js";
import { createApiConnector, User } from "./api.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { reportCriticalError, escapeHtml, mountOnTableEndSeen, LOGGED_IN_NAVBAR_ARGS, mustQuerySelector } from "./helpers.js";
import { mountNavbar } from "./component_navbar.js";

const loadingScreen = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {
		const authStore = createAuthStore();
		const apiConnector = createApiConnector({ authStore });

		await checkIsLoggedInMiddleware(authStore);

		const state: {
			endReached: boolean,
			nextCursor: number,
			total: number,
			users: User[]
		} = {
			endReached: false,
			nextCursor: 1,
			total: 0,
			users: []
		};


		const fetchUsers = async () => {
			let { ok, unknownError } = await apiConnector.getPaginatedUsers(30, state.nextCursor);

			if (unknownError !== null) {
				throw unknownError;
			} else if (ok === null) {
				throw new Error("ok should not be null");
			} else {
				const { items, nextCursor: responseNextCursor, total: responseTotal } = ok;
				state.users = state.users.concat(items);
				state.nextCursor = responseNextCursor;
				state.total = responseTotal;

				if (items.length === 0) state.endReached = true;
			}
		}

		await fetchUsers();

		Array.from(document.querySelectorAll(`[data-unhide="true"]`)).forEach(ele => ele.classList.remove("hidden"));

		loadingScreen.destroy();

		mountNavbar('#navbar-root', {
			brandHref: '/',
			brandName: 'Confilogi',
			brandAccent: 'IT Support',
			...LOGGED_IN_NAVBAR_ARGS
		});

		const tbody = mustQuerySelector(document.body, '#users-tbody');
		const summaryEl = mustQuerySelector(document.body, '#results-summary');
		const emptyStateEl = mustQuerySelector(document.body, '#empty-state');
		const cardsRoot = mustQuerySelector(document.body, '#users-cards-root');

		const statusBadgeClasses = (status: string) => {
			return status === 'Active'
				? 'bg-green-500/20 text-green-400'
				: 'bg-red-500/20 text-red-400';
		}

		const render = () => {
			summaryEl.textContent = `Showing ${state.users.length} of ${state.total} users`;

			if (state.users.length === 0) {
				tbody.innerHTML = '';
				cardsRoot.innerHTML = '';
				emptyStateEl.classList.remove('hidden');
				return;
			}
			emptyStateEl.classList.add('hidden');

			const rowsHtml = state.users.map(u => {
				return `
<tr class="hover:bg-neutral-900/40 transition">
<td class="px-4 py-3 align-top">
<div class="flex flex-col">
<span class="font-semibold">${escapeHtml(u.fullName)}</span>
<span class="text-xs text-neutral-400">ID: ${escapeHtml(String(u.id))}</span>
</div>
</td>
<td class="px-4 py-3 align-top">
<span class="text-neutral-300">${escapeHtml(u.email)}</span>
</td>
<td class="px-4 py-3 align-top">
<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300">${escapeHtml(u.jobTitle.name || u.jobTitle.intranetName)}</span>
<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300">${escapeHtml(u.companyDepartment?.name || "No department")}</span>

</td>
<td class="px-4 py-3 align-top">
<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 ${statusBadgeClasses(u.isActive ? 'Active' : 'Disabled')}">${escapeHtml(u.isActive ? 'Active' : 'Disabled')}</span>
</td>
</tr>
`;
			}).join('');
			tbody.innerHTML = rowsHtml;

			const cardsHtml = state.users.map(u => {
				return `
<article class="bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4 flex flex-col gap-3 hover:bg-neutral-900 transition">
<div class="flex items-start justify-between gap-3">
<div>
<h2 class="text-base font-semibold leading-snug">${escapeHtml(u.fullName)}</h2>
<p class="text-sm text-neutral-400">${escapeHtml(u.email)}</p>
</div>
<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 ${statusBadgeClasses(u.isActive ? 'Active' : 'Disabled')}">
${escapeHtml(u.isActive ? 'Active' : 'Disabled')}
</span>
</div>
<div class="flex items-center gap-2">
<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300">
${escapeHtml(u.jobTitle?.name || u.jobTitle.intranetName)}
</span>
<span class="text-xs text-neutral-500">ID: ${escapeHtml(String(u.id))}</span>
</div>
</article>
`;
			}).join('');
			cardsRoot.innerHTML = cardsHtml;
		}

		mountOnTableEndSeen('#table-end-sentinel', async () => {
			try {
				if (!state.endReached) {
					const loadingScreen = mountSuspenseScreen("#loading-screen", {
						message: "Loading next items...",
					});

					await fetchUsers();
					render();

					loadingScreen.destroy();
				}
			} catch (error) {
				reportCriticalError(error);
			}
		})

		// Initial render
		render();
	} catch (error) {
		reportCriticalError(error);
	}
})();
