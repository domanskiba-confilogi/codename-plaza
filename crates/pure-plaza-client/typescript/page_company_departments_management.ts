import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { createApiConnector, CompanyDepartment } from "./api.js";
import { createAuthStore } from "./auth_store.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { mountNavbar } from "./component_navbar.js";
import { mountModal, ModalApi } from "./component_modal.js";
import { mountButton, ButtonAPI } from "./component_button.js";
import { LOGGED_IN_NAVBAR_ARGS, mustQuerySelector, escapeHtml, reportCriticalError } from "./helpers.js";
import { mountTextField, TextFieldApi } from "./component_text_field.js";

const loader = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {
		const authStore = createAuthStore();
		const apiConnector = createApiConnector({ authStore });

		await checkIsLoggedInMiddleware(authStore);

		const state: {
			items: CompanyDepartment[]
		} = {
			items: [],
		};

		const fetchFromBackend = async () => {
			let { ok, unknownError } = await apiConnector.getCompanyDepartments();

			if (unknownError !== null) {
				throw unknownError;
			} else if (ok === null) {
				throw new Error("ok property should not be null");
			} else {
				state.items = ok!;
			}
		}

		await Promise.all([
			fetchFromBackend(),
		]);

		Array.from(document.querySelectorAll(`[data-unhide="true"]`)).forEach(ele => ele.classList.remove("hidden"));

		loader.hide();

		mountNavbar('#navbar-root', {
			brandHref: '/',
			brandName: 'Confilogi',
			brandAccent: 'IT Support',
			...LOGGED_IN_NAVBAR_ARGS
		});

		const withLoader = async (message: string, hint: string, fn: () => Promise<void>) => {
			loader.setMessage(message || 'Working...');
			if (hint == null) loader.setHint(null); else loader.setHint(hint);
			loader.show();
			return new Promise((resolve, reject) => {
				setTimeout(async () => {
					try {
						const res = await fn();
						resolve(res);
					} catch (e) {
						reject(e);
					} finally {
						loader.hide();
					}
				}, 350);
			});
		}

		mountButton('#refresh-btn', {
			label: 'Refresh',
			variant: 'ghost',
			size: 'md',
			onClick: async () => {
				await withLoader('Refreshing from backend...', '', async () => {
					state.items = [];

					await fetchFromBackend();
					render();
				});
			}
		});

		mountButton('#new-company-department-btn', {
			label: 'Create new',
			variant: 'primary',
			size: 'md',
			onClick: () => openCreateCompanyDepartmentModal(),
		});

		const tbody = mustQuerySelector(document.body, '#tbody');
		const summaryEl = mustQuerySelector(document.body, '#results-summary');
		const emptyStateEl = mustQuerySelector(document.body, '#empty-state');
		const cardsRoot = mustQuerySelector(document.body, '#cards-root');
		let rowButtons: ButtonAPI[] = [];

		const cleanupRowButtons = () => {
			for (const b of rowButtons) {
				try { b.destroy && b.destroy(); } catch {}
			}
			rowButtons = [];
		}

		const render = () => {
			summaryEl!.textContent = `Showing ${state.items.length} company departments`;
			cleanupRowButtons();

			emptyStateEl!.classList.add('hidden');
			// Desktop rows
			const rowsHtml = state.items.map(j => {
				const configureId = `cfg-${j.id}`;

				return `
<tr class="hover:bg-neutral-900/40 transition">
<td class="px-4 py-3 align-top">
<div class="flex flex-col">
<span class="font-semibold">${escapeHtml(j.name)}</span>
<span class="text-xs text-neutral-500 mt-1">ID: ${escapeHtml(String(j.id))}</span>
</div>
</td>
<td class="px-4 py-3 align-top">
<div class="flex items-center justify-end gap-2">
<span id="${configureId}"></span>
</div>
</td>
</tr>
`;
			}).join('');

			tbody.innerHTML = rowsHtml;

			state.items.forEach((companyDepartment) => {
				rowButtons.push(mountButton(`#cfg-${companyDepartment.id}`, {
					type: 'button',
					variant: 'secondary',
					label: 'Configure',
					onClick: () => {
						openEditJobTitleModal(companyDepartment)
					},
				}));
			});

			const cardsHtml = state.items.map(companyDepartment => {
				const configureId = `cfg-m-${companyDepartment.id}`;

				return `
<article class="bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4 flex flex-col gap-3 hover:bg-neutral-900 transition">
<h2 class="text-base font-semibold leading-snug">${escapeHtml(companyDepartment.name)}</h2>
<div class="mt-1 flex items-center justify-end gap-2">
<span id="${configureId}"></span>
</div>
</article>
`;
			}).join('');

			cardsRoot.innerHTML = cardsHtml;

			state.items.forEach((companyDepartment) => {
				rowButtons.push(mountButton(`#cfg-m-${companyDepartment.id}`, {
					type: 'button',
					variant: 'secondary',
					label: 'Configure',
					onClick: () => {
						openEditJobTitleModal(companyDepartment)
					},
				}));
			});
		}

		const openCreateCompanyDepartmentModal = () => {
			const modal = mountModal('#company-department-modal-root', {
				title: `Create new company department`,
				contentHtml: '',
				size: 'lg',
				closeOnEsc: true,
				closeOnBackdrop: true,
				showCloseButton: true
			});

			const content = document.createElement('div');
			content.className = 'flex flex-col gap-5';

			content.innerHTML = `<div id="company-department-name-root"></div>`;

			modal.setContent(content);

			const fields: {
				name: TextFieldApi,
			}= {
				name: mountTextField(`#company-department-name-root`, {
					type: 'text',
					label: "Name",
				})
			};

			modal.setPrimaryAction({
				label: 'Save changes',
				onClick: async (_, api: ModalApi) => {
					try {
						fields.name.disable();

						api.setActionsLoading(true);

						await withLoader('Creating company department...', '', async () => {
							const { unknownError } = await apiConnector.createCompanyDepartment({
								name: fields.name.getValue(), 
							});

							if (unknownError !== null) {
								throw unknownError;
							}

							await fetchFromBackend();
							render();
						});

						api.close(); 
						modal.destroy();
					} catch (error: any) {
						reportCriticalError(error);
					}
				}
			});

			modal.setSecondaryAction({
				label: 'Cancel',
				onClick: (_, api) => { api.close(); modal.destroy(); }
			});

			modal.open();
		}

		const openEditJobTitleModal = (companyDepartment: CompanyDepartment) => {
			const modal = mountModal('#company-department-modal-root', {
				title: `Configure: ${escapeHtml(companyDepartment.name)}`,
				contentHtml: '',
				size: 'lg',
				closeOnEsc: true,
				closeOnBackdrop: true,
				showCloseButton: true
			});

			const content = document.createElement('div');
			content.className = 'flex flex-col gap-5';

			content.innerHTML = `<div id="company-department-name-root"></div>`;

			modal.setContent(content);

			const fields: {
				name: TextFieldApi,
			}= {
				name: mountTextField(`#company-department-name-root`, {
					type: 'text',
					label: "Name",
					value: companyDepartment.name,
				})
			};

			modal.setPrimaryAction({
				label: 'Save changes',
				onClick: async (_, api: ModalApi) => {
					fields.name.disable();

					api.setActionsLoading(true);

					await withLoader('Saving permissions...', 'Updating job title', async () => {
						try {
							const { unknownError } = await apiConnector.updateCompanyDepartment({
								id: companyDepartment.id,
								name: fields.name.getValue(), 
							});

							if (unknownError !== null) {
								throw unknownError;
							}

							await fetchFromBackend();
							render();
						} catch (error: any) {
							reportCriticalError(error);
						}
					});

					api.close(); 
					modal.destroy();
				}
			});

			modal.setSecondaryAction({
				label: 'Cancel',
				onClick: (_, api) => { api.close(); modal.destroy(); }
			});

			modal.open();
		}

		// Initial render
		render();

	} catch (error: any) {
		reportCriticalError(error);
	}
})();


