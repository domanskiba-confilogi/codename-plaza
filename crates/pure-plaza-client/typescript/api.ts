import { AuthStore } from "./auth_store.js";

export interface ApiConnectorConfig {
	baseUrl?: string;
	timeout?: number;
	authStore?: AuthStore | null;
	defaultHeaders?: Record<string, string>;
}

export type ApiError = Error & {
	status?: number;
	details?: unknown;
};

export interface ResponseCompanyDepartment {
	id: number;
	name: string;
}

export interface ResponseJobTitle {
	id: number;
	intranet_name: string;
	name: string | null;
	parent_job_title_id: number | null;
	company_department_id: number | null;
}

export interface ResponseUser {
	id: number;
	full_name: string;
	email: string;
	is_active: boolean;
	job_title_id: number;
	company_department_id: number | null;
	job_title: ResponseJobTitle;
	company_department: ResponseCompanyDepartment | null;
}

export interface ResponseSystemPermission {
	id: number;
	name: string,
	subpermission_of_id: number;
}

export interface SystemPermission {
	id: number;
	name: string,
	subpermissionOfId: number;
}

export interface MailingGroup {
	id: number,
	name: string,
	email: string,
}

export interface User {
	id: number;
	fullName: string;
	email: string;
	isActive: boolean;
	jobTitleId: number;
	companyDepartmentId: number | null;
	companyDepartment: CompanyDepartment | null;
	jobTitle: JobTitle;
}

export interface JobTitle {
	id: number;
	intranetName: string;
	name: string | null;
	parentJobTitleId: number | null;
	companyDepartmentId: number | null;
}

export interface CompanyDepartment {
	id: number;
	name: string;
}

export interface Permission {
	id: number;
	humanId: string;
	description: string;
}

export interface ValidationWithTranslation {
	property_name: string;
	message: string;
	translation: string;
}

export interface Paginated<T> {
	items: T[];
	total: number;
	nextCursor: number;
}

export interface License {
	id: number,
	name: string,
}

export interface PersonData {
	name: string,
	secondName: string,
	surname: string,
}

export interface PostalAddressData {
	country: string,
	postalCode: string,
	city: string,
	street: string,
	houseNumber: string,
	apartmentNumber: string,
	cellphone: string,
	email: string,
}

// High-resolution time when available (browser/Node)
export const now = (): number =>
	typeof performance !== "undefined" && typeof performance.now === "function"
		? performance.now()
		: Date.now();

export function createAccessibilityTimer(totalMs: number) {
	if (!Number.isFinite(totalMs) || totalMs < 0) {
		throw new TypeError("totalMs must be a non-negative number");
	}
	const startedAt = now();
	const api = {
		remaining() {
			const elapsed = now() - startedAt;
			return Math.max(0, Math.ceil(totalMs - elapsed));
		},
		elapsed() {
			return Math.max(0, now() - startedAt);
		},
		done() {
			return api.remaining() === 0;
		},
		wait(signal?: AbortSignal) {
			const ms = api.remaining();
			if (ms === 0) return Promise.resolve();
			return new Promise<void>((resolve, reject) => {
				const id = setTimeout(resolve, ms);
				if (signal) {
					const onAbort = () => {
						clearTimeout(id);
						signal.removeEventListener("abort", onAbort);
						const err =
							typeof DOMException !== "undefined"
								? new DOMException("Aborted", "AbortError")
								: Object.assign(new Error("Aborted"), { name: "AbortError" });
						reject((signal as any).reason ?? err);
					};
					if (signal.aborted) {
						onAbort();
					} else {
						signal.addEventListener("abort", onAbort, { once: true });
					}
				}
			});
		},
	};
	return api;
}

// Converters
export function convertResponseUserDto(userFromResponse: ResponseUser): User {
	let companyDepartment: CompanyDepartment | null = null;
	const jobTitle: JobTitle = {
		id: userFromResponse.job_title.id,
		name: userFromResponse.job_title.name,
		intranetName: userFromResponse.job_title.intranet_name,
		parentJobTitleId: userFromResponse.job_title.parent_job_title_id,
		companyDepartmentId: userFromResponse.job_title.company_department_id,
	};
	if (userFromResponse.company_department !== null) {
		companyDepartment = {
			id: userFromResponse.company_department.id,
			name: userFromResponse.company_department.name,
		};
	}
	return {
		id: userFromResponse.id,
		fullName: userFromResponse.full_name,
		email: userFromResponse.email,
		isActive: userFromResponse.is_active,
		jobTitleId: userFromResponse.job_title_id,
		companyDepartmentId: userFromResponse.company_department_id,
		companyDepartment,
		jobTitle,
	};
}

export function convertResponseJobTitle(fromResponse: ResponseJobTitle): JobTitle {
	return {
		id: fromResponse.id,
		intranetName: fromResponse.intranet_name,
		name: fromResponse.name,
		parentJobTitleId: fromResponse.parent_job_title_id,
		companyDepartmentId: fromResponse.company_department_id,
	};
}

export function convertResponseCompanyDepartment(fromResponse: ResponseCompanyDepartment): CompanyDepartment {
	return {
		id: fromResponse.id,
		name: fromResponse.name,
	};
}

export interface ResponsePermission {
	id: number;
	human_id: string;
	description: string;
}

export function convertResponsePermission(fromResponse: ResponsePermission): Permission {
	return {
		id: fromResponse.id,
		humanId: fromResponse.human_id,
		description: fromResponse.description,
	};
}

export function convertResponseSystemPermission(fromResponse: ResponseSystemPermission): SystemPermission {
	return {
		id: fromResponse.id,
		name: fromResponse.name,
		subpermissionOfId: fromResponse.subpermission_of_id,
	};
}

// Helpers
function buildApiError(message: string, status?: number, details?: unknown): ApiError {
	const err = new Error(message) as ApiError;
	if (status !== undefined) {
		err.status = status;
	}
	if (details !== undefined) {
		err.details = details;
	}
	return err;
}

async function parseJsonSafe(resp: Response): Promise<unknown | null> {
	const ct = resp.headers.get("content-type") || "";
	if (!ct.toLowerCase().includes("application/json")) return null;
	try {
		return await resp.json();
	} catch {
		return null;
	}
}

function normalizeBase(u?: string | null): string {
	return (u || "").replace(/\/+$/, "");
}

function toURL(baseUrl: string, path: string): string {
	return `${normalizeBase(baseUrl)}${path}`;
}

// Interface for the API connector
export interface ApiConnector {
	login(params?: { email?: string; password?: string }): Promise<{
		ok: { user: unknown; authorization_token: string } | null;
		validationError: ValidationWithTranslation | null;
		unknownError: ApiError | null;
	}>;
	getLoggedInUser(): Promise<{
		ok: User | null;
		unauthorizedError: ApiError | null;
		unknownError: ApiError | null;
	}>;
	getJobTitles(): Promise<{ ok: JobTitle[] | null; unknownError: ApiError | null }>;
	getCompanyDepartments(): Promise<{ ok: CompanyDepartment[] | null; unknownError: ApiError | null }>;
	getLicenses(): Promise<{ ok: License[] | null; unknownError: ApiError | null }>;
	getSystemPermissions(): Promise<{ ok: SystemPermission[] | null; unknownError: ApiError | null }>;
	getMailingGroups(): Promise<{ ok: MailingGroup[] | null; unknownError: ApiError | null }>;
	getLicenseToJobTitleMappings(): Promise<{
		ok: { licenseId: number; jobTitleId: number }[] | null;
		unknownError: ApiError | null;
	}>;
	getSystemPermissionToJobTitleMappings(): Promise<{
		ok: { systemPermissionId: number; jobTitleId: number }[] | null;
		unknownError: ApiError | null;
	}>;
	getMicrosoftSignInRedirectionUri(): Promise<{ ok: string | null; unknownError: ApiError | null }>;
	getPaginatedUsers(
		per_page: number,
		cursor?: number 
	): Promise<{ ok: Paginated<User> | null; unknownError: ApiError | null }>;
	getPaginatedJobTitlesWithDependencies(
		per_page?: number | string,
		cursor?: number | string
	): Promise<{
		ok:
		| Paginated<{
			jobTitle: JobTitle;
			companyDepartment: CompanyDepartment | null;
			permissionIds: number[];
		}>
		| null;
		unknownError: ApiError | null;
	}>;
	getPermissions(): Promise<{ ok: Permission[] | null; unknownError: ApiError | null }>;
	updateJobTitle(
		id: number,
		name: string,
		parentJobTitleId: number | null,
		companyDepartmentId: number | null,
		permissionIds: number[]
	): Promise<{ ok: Permission[] | null; unknownError: ApiError | null }>;
	getJobTitlesWithDependencies(): Promise<{
		ok:
		| {
			jobTitle: JobTitle;
			companyDepartment: CompanyDepartment | null;
			permissionIds: number[];
		}[]
		| null;
		unknownError: ApiError | null;
	}>;
	updateCompanyDepartment(payload: {
		id: number,
		name: string,
	}): Promise<{ ok: null, unknownError: ApiError | null }>;
	createCompanyDepartment(payload: {
		name: string,
	}): Promise<{ ok: null, unknownError: ApiError | null }>;
}

export function createApiConnector(config: ApiConnectorConfig = {}): ApiConnector {
	const {
		baseUrl = "/api",
		timeout = 15000,
		authStore: authStoreParam = null,
		defaultHeaders = {},
	} = config;

	// Small shared helpers to reduce repetition without overcomplicating
	function buildHeaders(opts: { auth?: boolean; json?: boolean } = {}) {
		const headers: Record<string, string> = { ...defaultHeaders };
		if (opts.auth) {
			if (!authStoreParam) return null;
			headers["Authorization"] = `Bearer ${authStoreParam.getAuthorizationToken()}`;
		}
		if (opts.json) headers["Content-Type"] = "application/json";
		return headers;
	}

	async function doRequest(
		path: string,
		init: RequestInit = {}
	): Promise<{ res: Response; data: unknown | null }> {
		const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
		const timer: ReturnType<typeof setTimeout> | null = controller
			? setTimeout(() => controller.abort("request timed out"), timeout)
			: null;
		try {
			const initWithSignal: RequestInit = controller ? { ...init, signal: controller.signal } : init;
			const res = await fetch(toURL(baseUrl, path), initWithSignal);
			const data = await parseJsonSafe(res);
			return { res, data };
		} finally {
			if (timer) clearTimeout(timer);
		}
	}

	function httpError(res: Response, details: unknown) {
		return buildApiError(`HTTP ${res.status}`, res.status, details);
	}

	// login
	async function login(params: { email?: string; password?: string } = {}) {
		const result = (p: {
			ok?: { user: unknown; authorization_token: string } | null;
			validationError?: ValidationWithTranslation | null;
			unknownError?: ApiError | null;
		}) => ({
				ok: p.ok ?? null,
				validationError: p.validationError ?? null,
				unknownError: p.unknownError ?? null,
			});
		const { email = "", password = "" } = params;
		try {
			const headers = buildHeaders({ json: true })!;
			const { res, data } = await doRequest("/auth/login", {
				method: "POST",
				headers,
				body: JSON.stringify({ email, password }),
			});
			if (res.status === 200) {
				if (data && typeof data === "object" && (data as any).user && (data as any).authorization_token) {
					return result({ ok: data as any });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			if (res.status === 400) {
				if (data && (data as any).ValidationWithTranslation) {
					return result({ validationError: (data as any).ValidationWithTranslation });
				}
				return result({ unknownError: buildApiError("Bad Request", 400, data) });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getLoggedInUser
	async function getLoggedInUser() {
		const result = (p: {
			ok?: User | null;
			unauthorizedError?: ApiError | null;
			unknownError?: ApiError | null;
		}) => ({
				ok: p.ok ?? null,
				unauthorizedError: p.unauthorizedError ?? null,
				unknownError: p.unknownError ?? null,
			});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/auth/user", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (
					data &&
						typeof data === "object" &&
						(data as any).id &&
						(data as any).email &&
						(data as any).full_name &&
						typeof (data as any).is_active !== "undefined" &&
						(data as any).job_title
				) {
					return result({ ok: convertResponseUserDto(data as ResponseUser) });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			if (res.status === 401) {
				return result({ unauthorizedError: buildApiError("Unauthorized", 401) });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getJobTitles
	async function getJobTitles() {
		const result = (p: { ok?: JobTitle[] | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/job-titles", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({ ok: data.map(row => convertResponseJobTitle(row)) });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getCompanyDepartments
	async function getCompanyDepartments() {
		const result = (p: { ok?: CompanyDepartment[] | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/company-departments", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({ 
						ok: data.map((entry) => convertResponseCompanyDepartment(entry as ResponseCompanyDepartment))
					});
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getLicenses
	async function getLicenses() {
		const result = (p: { ok?: License[] | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/licenses", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({ ok: data as License[] });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getSystemPermissions
	async function getSystemPermissions() {
		const result = (p: { ok?: SystemPermission[] | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/system-permissions", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({ ok: (data as ResponseSystemPermission[]).map(row => convertResponseSystemPermission(row)) });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getMailingGroups
	async function getMailingGroups() {
		const result = (p: { ok?: MailingGroup[] | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/mailing-groups", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({ ok: data as MailingGroup[] });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getLicenseToJobTitleMappings
	async function getLicenseToJobTitleMappings() {
		const result = (p: {
			ok?: { licenseId: number; jobTitleId: number }[] | null;
			unknownError?: ApiError | null;
		}) => ({
				ok: p.ok ?? null,
				unknownError: p.unknownError ?? null,
			});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/job-titles/license-mappings", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({
						ok: (data as any[]).map((entry) => ({
							licenseId: entry.license_id,
							jobTitleId: entry.job_title_id,
						})),
					});
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getSystemPermissionToJobTitleMappings
	async function getSystemPermissionToJobTitleMappings() {
		const result = (p: {
			ok?: { systemPermissionId: number; jobTitleId: number }[] | null;
			unknownError?: ApiError | null;
		}) => ({
				ok: p.ok ?? null,
				unknownError: p.unknownError ?? null,
			});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/job-titles/system-permission-mappings", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({
						ok: (data as any[]).map((entry) => ({
							systemPermissionId: entry.system_permission_id,
							jobTitleId: entry.job_title_id,
						})),
					});
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getMicrosoftSignInRedirectionUri
	async function getMicrosoftSignInRedirectionUri(): Promise<{
		ok: string | null;
		unknownError: ApiError | null;
	}> {
		const result = (p: { ok?: string | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		try {
			const headers = buildHeaders()!;
			const { res, data } = await doRequest("/microsoft/redirection-uri", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (typeof data === "object" && data && "redirection_uri" in (data as any)) {
					return result({ ok: (data as any).redirection_uri as string });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getPaginatedUsers
	async function getPaginatedUsers(per_page: number , cursor: number = 0) {
		const result = (p: { ok?: Paginated<User> | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const params = new URLSearchParams();
			params.set("per_page", String(per_page));
			params.set("cursor", String(cursor));
			const { res, data } = await doRequest(`/users?${params.toString()}`, {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (typeof data === "object" && data && (data as any).items && typeof (data as any).total !== "undefined") {
					return result({
						ok: {
							items: ((data as any).items as ResponseUser[]).map((user) => convertResponseUserDto(user)),
							total: (data as any).total as number,
							nextCursor: (data as any).next_cursor ?? null,
						},
					});
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getPaginatedJobTitlesWithDependencies
	async function getPaginatedJobTitlesWithDependencies(per_page: number | string = 30, cursor: number | string = 1) {
		const result = (p: {
			ok?:
			| Paginated<{
				jobTitle: JobTitle;
				companyDepartment: CompanyDepartment | null;
				permissionIds: number[];
			}>
			| null;
			unknownError?: ApiError | null;
		}) => ({
				ok: p.ok ?? null,
				unknownError: p.unknownError ?? null,
			});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const params = new URLSearchParams();
			params.set("per_page", String(per_page));
			params.set("cursor", String(cursor));
			const { res, data } = await doRequest(`/job-titles/paginated?${params.toString()}`, {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (typeof data === "object" && data && (data as any).items && typeof (data as any).total !== "undefined") {
					return result({
						ok: {
							items: ((data as any).items as any[]).map(({ job_title, company_department, permission_ids }) => ({
								jobTitle: convertResponseJobTitle(job_title as ResponseJobTitle),
								companyDepartment: company_department
									? convertResponseCompanyDepartment(company_department as ResponseCompanyDepartment)
									: null,
								permissionIds: permission_ids as number[],
							})),
							total: (data as any).total as number,
							nextCursor: (data as any).next_cursor ?? null,
						},
					});
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	async function getPermissions() {
		const result = (p: { ok?: Permission[] | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/permissions", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({ ok: (data as ResponsePermission[]).map(convertResponsePermission) });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// updateJobTitle
	async function updateJobTitle(
		id: number,
		name: string,
		parentJobTitleId: number | null,
		companyDepartmentId: number | null,
		permissionIds: number[]
	) {
		const result = (p: { ok?: Permission[] | null; unknownError?: ApiError | null }) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true, json: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/job-titles", {
				method: "PUT",
				headers,
				body: JSON.stringify({
					id,
					name,
					parent_job_title_id: parentJobTitleId,
					company_department_id: companyDepartmentId,
					permission_ids: permissionIds,
				}),
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({ ok: (data as ResponsePermission[]).map(convertResponsePermission) });
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	// getJobTitlesWithDependencies
	async function getJobTitlesWithDependencies() {
		const result = (p: {
			ok?:
			| { jobTitle: JobTitle; companyDepartment: CompanyDepartment | null; permissionIds: number[] }[]
			| null;
			unknownError?: ApiError | null;
		}) => ({
				ok: p.ok ?? null,
				unknownError: p.unknownError ?? null,
			});
		const headers = buildHeaders({ auth: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/job-titles/with-dependencies", {
				method: "GET",
				headers,
			});
			if (res.status === 200) {
				if (Array.isArray(data)) {
					return result({
						ok: (data as any[]).map(({ job_title, company_department, permission_ids }) => ({
							jobTitle: convertResponseJobTitle(job_title as ResponseJobTitle),
							companyDepartment: company_department
								? convertResponseCompanyDepartment(company_department as ResponseCompanyDepartment)
								: null,
							permissionIds: permission_ids as number[],
						})),
					});
				}
				return result({ unknownError: buildApiError("Unexpected 200 response shape") });
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	}

	const updateCompanyDepartment = async (payload: { id: number, name: string }) => {
		const result = (p: {
			ok?: null;
			unknownError?: ApiError | null;
		}) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true, json: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/company-departments", {
				method: "PUT",
				headers,
				body: JSON.stringify(payload)
			});
			if (res.status === 200) {
				return result({
					ok: null,
				});
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	};

	const createCompanyDepartment = async (payload: { name: string }) => {
		const result = (p: {
			ok?: null;
			unknownError?: ApiError | null;
		}) => ({
			ok: p.ok ?? null,
			unknownError: p.unknownError ?? null,
		});
		const headers = buildHeaders({ auth: true, json: true });
		if (!headers) {
			return result({ unknownError: buildApiError("Auth store has not been initialized") });
		}
		try {
			const { res, data } = await doRequest("/company-departments", {
				method: "POST",
				headers,
				body: JSON.stringify(payload)
			});
			if (res.status === 204) {
				return result({
					ok: null,
				});
			}
			return result({ unknownError: httpError(res, data) });
		} catch (e) {
			const err: ApiError = e instanceof Error ? (e as ApiError) : buildApiError(String(e));
			return result({ unknownError: err });
		}
	};

	return {
		login,
		getLoggedInUser,
		getJobTitles,
		getCompanyDepartments,
		getLicenses,
		getSystemPermissions,
		getMailingGroups,
		getLicenseToJobTitleMappings,
		getSystemPermissionToJobTitleMappings,
		getMicrosoftSignInRedirectionUri,
		getPaginatedUsers,
		getPaginatedJobTitlesWithDependencies,
		getPermissions,
		updateJobTitle,
		getJobTitlesWithDependencies,
		updateCompanyDepartment,
		createCompanyDepartment
	};
}
