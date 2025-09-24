import { mountSuspenseScreen } from "./component_suspense_screen.js";
import { createApiConnector, Permission, CompanyDepartment, JobTitle } from "./api.js";
import { createAuthStore } from "./auth_store.js";
import { checkIsLoggedInMiddleware } from "./middlewares.js";
import { mountNavbar } from "./component_navbar.js";
import { mountModal, ModalApi } from "./component_modal.js";
import { mountButton, ButtonAPI } from "./component_button.js";
import { LOGGED_IN_NAVBAR_ARGS, mustQuerySelector, escapeHtml, reportCriticalError } from "./helpers.js";
import { CheckboxApi } from "./component_checkbox.js";
import { SelectFieldApi, mountSelectField } from "./component_select_field.js";
import { mountTextField, TextFieldApi } from "./component_text_field.js";
import { mountCheckbox } from "./component_checkbox.js";

const loader = mountSuspenseScreen("#loading-screen", {
	message: "Loading needed data...",
});

(async () => {
	try {
		const authStore = createAuthStore();
		const apiConnector = createApiConnector({ authStore });

		await checkIsLoggedInMiddleware(authStore);

		const state: {
			permissions: Permission[],
			companyDepartments: CompanyDepartment[],
			items: {
				jobTitle: JobTitle;
				companyDepartment: CompanyDepartment | null;
				permissionIds: number[];
			}[],
			total: number,
			perPage: number,
			nextCursor: number,
			endReached: boolean,
		} = {
				permissions: [],
				companyDepartments: [],
				items: [],
				total: 0,
				perPage: 30,
				nextCursor: 1,
				endReached: false,
			};

		const fetchPermissions = async () => {
			let { ok, unknownError } = await apiConnector.getPermissions();

			if (unknownError !== null) {
				throw unknownError;
			} else if (ok === null) {
				throw new Error("ok property should not be null");
			} else {
				state.permissions = ok!;
			}
		}

		const fetchCompanyDepartments = async () => {
			let { ok, unknownError } = await apiConnector.getCompanyDepartments();

			if (unknownError !== null) {
				throw unknownError;
			} else if (ok === null) {
				throw new Error("ok property should not be null");
			} else {
				state.companyDepartments = ok!;
			}
		}

		const fetchFromBackend = async () => {
			let { ok, unknownError }= await apiConnector.getJobTitlesWithDependencies();

			if (unknownError !== null) {
				throw unknownError;
			} else if (ok === null) {
				throw new Error("ok property should not be null");
			} else {
				state.items = ok!;
			}
		}

		await Promise.all([
			fetchPermissions(),
			fetchCompanyDepartments(),
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
					} catch (e: any) {
						reject(e);
					} finally {
						loader.hide();
					}
				}, 350);
			});
		}

		// Access + config helpers
		const isConfigured = (job: { jobTitle: JobTitle, companyDepartment: CompanyDepartment | null, permissionIds: number[] }) => {
			return job.permissionIds.length !== 0;
		}

		const statusBadgeConfig = (conf: boolean) => {
			return conf ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-400';
		}

		mountButton('#refresh-btn', {
			label: 'Refresh',
			variant: 'ghost',
			size: 'md',
			onClick: async () => {
				await withLoader('Refreshing from backend...', '', async () => {
					state.items = [];
					state.nextCursor = 1;
					state.total = 0;
					state.endReached = false;

					await fetchFromBackend();
					render();
				});
			}
		});

		mustQuerySelector(document.body, '#dismiss-alert').addEventListener('click', () => {
			const el = mustQuerySelector(document.body, '#unconfigured-alert');
			el.classList.add('hidden');
		});

		// Rendering
		const tbody = mustQuerySelector(document.body, '#jobs-tbody');
		const summaryEl = mustQuerySelector(document.body, '#results-summary');
		const emptyStateEl = mustQuerySelector(document.body, '#empty-state');
		const cardsRoot = mustQuerySelector(document.body, '#jobs-cards-root');
		let rowButtons: ButtonAPI[] = [];

		const permissionHumanId = (permissionId: number): string | null => {
			const permission = state.permissions.find(permission => permission.id === permissionId);

			return permission?.humanId ?? null;
		}

		const cleanupRowButtons = () => {
			for (const b of rowButtons) {
				try { b.destroy && b.destroy(); } catch {}
			}
			rowButtons = [];
		}

		const render = () => {
			summaryEl!.textContent = `Showing ${state.items.length} job titles`;
			cleanupRowButtons();

			emptyStateEl!.classList.add('hidden');
			// Desktop rows
			const rowsHtml = state.items.map(j => {
				const conf = isConfigured(j);
				const pcount = j.permissionIds.length;
				const configureId = `cfg-${j.jobTitle.id}`;

				const tags = [];

				if (!conf) {
					tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 bg-amber-500/20 text-amber-400">Unconfigured</span>`);
				} else {
					tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 bg-sky-500/20 text-sky-300">Configured</span>`);
				}

				return `
<tr class="hover:bg-neutral-900/40 transition">
<td class="px-4 py-3 align-top">
<div class="flex flex-col">
<span class="font-semibold">${escapeHtml(j.jobTitle.name ?? j.jobTitle.intranetName)}</span>
<div class="mt-1 flex flex-wrap gap-1.5">${tags.join('')}</div>
<span class="text-xs text-neutral-500 mt-1">ID: ${escapeHtml(String(j.jobTitle.id))} · Intranet Name: ${escapeHtml(j.jobTitle.intranetName!)}</span>
</div>
</td>
<td class="px-4 py-3 align-top">
<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800">
${escapeHtml(j.companyDepartment === null ? 'No company department' : j.companyDepartment.name)}
</span>
</td>
<td class="px-4 py-3 align-top">
${pcount === 0
? '<span class="text-neutral-400 text-sm">No permissions</span>'
: `<div class="flex flex-wrap gap-1.5">
${j.permissionIds.slice(0, 4).map(p => `
<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300">${escapeHtml(permissionHumanId(p) ?? 'ERROR: Failed to find permission human ID')}</span>
`).join('')}
${j.permissionIds.length > 4 ? `<span class="text-xs text-neutral-400">+${j.permissionIds.length - 4} more</span>` : ''}
</div>`
}
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

			state.items.forEach(({ jobTitle, companyDepartment, permissionIds }) => {
				rowButtons.push(mountButton(`#cfg-${jobTitle.id}`, {
					type: 'button',
					variant: 'secondary',
					label: 'Configure',
					onClick: () => {
						openEditJobTitleModal(jobTitle, companyDepartment, permissionIds)
					},
				}));
			});

			// Mobile cards
			const cardsHtml = state.items.map(j => {
				const conf = isConfigured(j);
				const configureId = `cfg-m-${j.jobTitle.id}`;

				return `
<article class="bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4 flex flex-col gap-3 hover:bg-neutral-900 transition">
<div class="flex items-start justify-between gap-3">
<div>
<h2 class="text-base font-semibold leading-snug">${escapeHtml(j.jobTitle.name === null ? j.jobTitle.intranetName : j.jobTitle.name)}</h2>
<p class="text-xs text-neutral-500 mt-0.5">ID: ${escapeHtml(String(j.jobTitle.id))} · Intranet Name: ${escapeHtml(j.jobTitle.intranetName)}</p>
</div>
<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ring-1 ring-neutral-800 w-full max-w-[150px] text-ellipsis whitespace-nowrap overflow-hidden">${escapeHtml(j.companyDepartment === null ? 'No company department' : j.companyDepartment.name)}</span>
</div>
<div class="flex flex-wrap gap-1.5">
<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 ${statusBadgeConfig(conf)}">${conf ? 'Configured' : 'Unconfigured'}</span>
</div>
<div class="flex flex-wrap gap-1.5">
${(j.permissionIds.length === 0)
? '<span class="text-neutral-400 text-sm">No permissions</span>'
: j.permissionIds.slice(0, 3).map(p => `
<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md ring-1 ring-neutral-800 bg-neutral-800 text-neutral-300">${escapeHtml(permissionHumanId(p) ?? 'ERROR: No permission human ID found')}</span>
`).join('')
}
${j.permissionIds.length > 3 ? `<span class="text-xs text-neutral-400">+${j.permissionIds.length - 3} more</span>` : ''}
</div>
<div class="mt-1 flex items-center justify-end gap-2">
<span id="${configureId}"></span>
</div>
</article>
`;
			}).join('');

			cardsRoot.innerHTML = cardsHtml;

			state.items.forEach(({ jobTitle, companyDepartment, permissionIds }) => {
				rowButtons.push(mountButton(`#cfg-m-${jobTitle.id}`, {
					type: 'button',
					variant: 'secondary',
					label: 'Configure',
					onClick: () => {
						try {
							openEditJobTitleModal(jobTitle, companyDepartment, permissionIds)
						} catch (error: any) {
							reportCriticalError(error);
						}

					},
				}));
			});
		}

		const openEditJobTitleModal = (jobTitle: JobTitle, companyDepartment: CompanyDepartment | null, permissionIds: number[]) => {
			const modal = mountModal('#job-modal-root', {
				title: `Configure: ${escapeHtml(jobTitle.name === null ? jobTitle.intranetName : jobTitle.name)}`,
				contentHtml: '',
				size: 'lg',
				closeOnEsc: true,
				closeOnBackdrop: true,
				showCloseButton: true
			});

			const content = document.createElement('div');
			content.className = 'flex flex-col gap-5';

			content.innerHTML += `
<div id="job-title-intranet-name-root"></div>
<div id="job-title-name-root"></div>
<div id="job-title-parent-job-title-root"></div>
<div id="job-title-company-department-root"></div>
`;

			// Permissions by API
			const authPermissions = state.permissions.filter(permission => permission.humanId.startsWith("auth:"));
			const userManagementPermissions = state.permissions.filter(permission => permission.humanId.startsWith("users:"));
			const ticketCreationPermissions = state.permissions.filter(permission => permission.humanId.startsWith("create-ticket:"));
			const ticketManagementPermissions = state.permissions.filter(permission => permission.humanId.startsWith("ticket:"));
			const companyDepartmentsPermissions = state.permissions.filter(permission => permission.humanId.startsWith("company-departments:"));
			const jobTitlesPermissions = state.permissions.filter(permission => permission.humanId.startsWith("job-titles:"));
			const synchronizationPermissions = state.permissions.filter(permission => permission.humanId.startsWith("synchronization:"));
			const otherPermissions = state.permissions.filter(permission => 
				!(authPermissions.findIndex(sp => sp.id === permission.id) !== -1 ||
					userManagementPermissions.findIndex(sp => sp.id === permission.id) !== -1 ||
					ticketCreationPermissions.findIndex(sp => sp.id === permission.id) !== -1 ||
					ticketManagementPermissions.findIndex(sp => sp.id === permission.id) !== -1 ||
					synchronizationPermissions.findIndex(sp => sp.id === permission.id) !== -1 ||
					jobTitlesPermissions.findIndex(sp => sp.id === permission.id) !== -1 ||
					companyDepartmentsPermissions.findIndex(sp => sp.id === permission.id) !== -1)
			);

			const generatePermissionsHtmlSection = (name: string, permissions: Permission[]) => `
<div class="bg-neutral-900/60 ring-1 ring-neutral-800 rounded-xl p-3">
<div class="flex items-center justify-between mb-2">
<h3 class="text-sm font-medium text-neutral-200">${escapeHtml(name)}</h3>
</div>
<div class="flex flex-col gap-2">
${permissions.map((p: Permission) => `<div id="permission-${p.id}"></div>`).join('')}
</div>
</div>
`;

			content.innerHTML += `
${generatePermissionsHtmlSection("Authentication", authPermissions)}
${generatePermissionsHtmlSection("User management", userManagementPermissions)}
${generatePermissionsHtmlSection("Create ticket", ticketCreationPermissions)}
${generatePermissionsHtmlSection("Tickets", ticketManagementPermissions)}
${generatePermissionsHtmlSection("Synchronization", synchronizationPermissions)}
${generatePermissionsHtmlSection("Company departments", companyDepartmentsPermissions)}
${generatePermissionsHtmlSection("Job titles", jobTitlesPermissions)}
${generatePermissionsHtmlSection("Other", otherPermissions)}
`;

			modal.setContent(content);

			mountTextField(`#job-title-intranet-name-root`, {
				type: 'text',
				label: "Intranet name",
				value: jobTitle.intranetName,
				disabled: true
			});

			const fields: {
				name: TextFieldApi,
				parentJobTitleId: SelectFieldApi<number>,
				companyDepartmentId: SelectFieldApi<number>,
				permissionIds: { [key: number]: CheckboxApi }
			}= {
					name: mountTextField(`#job-title-name-root`, {
						type: 'text',
						label: "English name",
						value: jobTitle.name,
					}),
					parentJobTitleId: mountSelectField(
						`#job-title-parent-job-title-root`, 
						state.items.slice().filter(row => row.jobTitle.id !== jobTitle.id)
							.map(row => ({ 
								displayText: row.jobTitle.name ?? row.jobTitle.intranetName,
								value: row.jobTitle.id,
							})),
						{
							label: "Parent",
							multiple: false,
						}
					),
					companyDepartmentId: mountSelectField(
						`#job-title-company-department-root`, 
						state.companyDepartments.map(row => ({ displayText: row.name, value: row.id })), 
						{
							label: "Company department",
							multiple: false,
						}
					),
					permissionIds: {}
				};

			if (jobTitle.parentJobTitleId !== null) {
				fields.parentJobTitleId.setChosen([jobTitle.parentJobTitleId]);
			}

			if (companyDepartment !== null) {
				fields.companyDepartmentId.setChosen([companyDepartment.id]);
			}

			state.permissions.forEach(permission => {
				fields.permissionIds[permission.id] = mountCheckbox(`#permission-${permission.id}`, {
					description: permission.humanId,
					label: permission.description,
					checked: permissionIds.includes(permission.id),
				});
			});

			modal.setPrimaryAction({
				label: 'Save changes',
				onClick: async (_, api: ModalApi) => {
					try {
						fields.name.disable();
						fields.parentJobTitleId.disable();
						fields.companyDepartmentId.disable();
						Object.values(fields.permissionIds).forEach(val => val.disable());
						api.setActionsLoading(true);

						const enabledPermissionIds: number[] = [];

						Object.keys(fields.permissionIds).forEach(permissionId => {
							const checkbox = fields.permissionIds[parseInt(permissionId)];

							if (checkbox === undefined) {
								throw new Error("Permission checkbox with permission id " + permissionId + " has not been found");
							}

							if (checkbox!.getValue()) {
								enabledPermissionIds.push(parseInt(permissionId));
							}
						});

						await withLoader('Saving permissions...', 'Updating job title', async () => {
							try {
								const { unknownError } = await apiConnector.updateJobTitle(
									jobTitle.id, 
									fields.name.getValue(), 
									fields.parentJobTitleId.getChosen()[0] ?? null, 
									fields.companyDepartmentId.getChosen()[0] ?? null,
									enabledPermissionIds
								);
								if (unknownError !== null) throw unknownError;

								await fetchFromBackend();
								render();
							} catch (error: any) {
								reportCriticalError(error);
							}

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

		// Initial render
		render();

	} catch (error: any) {
		reportCriticalError(error);
	}
})();

