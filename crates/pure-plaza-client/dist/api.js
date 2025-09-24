var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// High-resolution time when available (browser/Node)
export var now = function () {
    return typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
};
export function createAccessibilityTimer(totalMs) {
    if (!Number.isFinite(totalMs) || totalMs < 0) {
        throw new TypeError("totalMs must be a non-negative number");
    }
    var startedAt = now();
    var api = {
        remaining: function () {
            var elapsed = now() - startedAt;
            return Math.max(0, Math.ceil(totalMs - elapsed));
        },
        elapsed: function () {
            return Math.max(0, now() - startedAt);
        },
        done: function () {
            return api.remaining() === 0;
        },
        wait: function (signal) {
            var ms = api.remaining();
            if (ms === 0)
                return Promise.resolve();
            return new Promise(function (resolve, reject) {
                var id = setTimeout(resolve, ms);
                if (signal) {
                    var onAbort_1 = function () {
                        var _a;
                        clearTimeout(id);
                        signal.removeEventListener("abort", onAbort_1);
                        var err = typeof DOMException !== "undefined"
                            ? new DOMException("Aborted", "AbortError")
                            : Object.assign(new Error("Aborted"), { name: "AbortError" });
                        reject((_a = signal.reason) !== null && _a !== void 0 ? _a : err);
                    };
                    if (signal.aborted) {
                        onAbort_1();
                    }
                    else {
                        signal.addEventListener("abort", onAbort_1, { once: true });
                    }
                }
            });
        },
    };
    return api;
}
// Converters
export function convertResponseUserDto(userFromResponse) {
    var companyDepartment = null;
    var jobTitle = {
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
        companyDepartment: companyDepartment,
        jobTitle: jobTitle,
    };
}
export function convertResponseJobTitle(fromResponse) {
    return {
        id: fromResponse.id,
        intranetName: fromResponse.intranet_name,
        name: fromResponse.name,
        parentJobTitleId: fromResponse.parent_job_title_id,
        companyDepartmentId: fromResponse.company_department_id,
    };
}
export function convertResponseCompanyDepartment(fromResponse) {
    return {
        id: fromResponse.id,
        name: fromResponse.name,
    };
}
export function convertResponsePermission(fromResponse) {
    return {
        id: fromResponse.id,
        humanId: fromResponse.human_id,
        description: fromResponse.description,
    };
}
export function convertResponseSystemPermission(fromResponse) {
    return {
        id: fromResponse.id,
        name: fromResponse.name,
        subpermissionOfId: fromResponse.subpermission_of_id,
    };
}
// Helpers
function buildApiError(message, status, details) {
    var err = new Error(message);
    if (status !== undefined) {
        err.status = status;
    }
    if (details !== undefined) {
        err.details = details;
    }
    return err;
}
function parseJsonSafe(resp) {
    return __awaiter(this, void 0, void 0, function () {
        var ct, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ct = resp.headers.get("content-type") || "";
                    if (!ct.toLowerCase().includes("application/json"))
                        return [2 /*return*/, null];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, resp.json()];
                case 2: return [2 /*return*/, _b.sent()];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function normalizeBase(u) {
    return (u || "").replace(/\/+$/, "");
}
function toURL(baseUrl, path) {
    return "".concat(normalizeBase(baseUrl)).concat(path);
}
export function createApiConnector(config) {
    var _this = this;
    if (config === void 0) { config = {}; }
    var _a = config.baseUrl, baseUrl = _a === void 0 ? "/api" : _a, _b = config.timeout, timeout = _b === void 0 ? 15000 : _b, _c = config.authStore, authStoreParam = _c === void 0 ? null : _c, _d = config.defaultHeaders, defaultHeaders = _d === void 0 ? {} : _d;
    // Small shared helpers to reduce repetition without overcomplicating
    function buildHeaders(opts) {
        if (opts === void 0) { opts = {}; }
        var headers = __assign({}, defaultHeaders);
        if (opts.auth) {
            if (!authStoreParam)
                return null;
            headers["Authorization"] = "Bearer ".concat(authStoreParam.getAuthorizationToken());
        }
        if (opts.json)
            headers["Content-Type"] = "application/json";
        return headers;
    }
    function doRequest(path_1) {
        return __awaiter(this, arguments, void 0, function (path, init) {
            var controller, timer, initWithSignal, res, data;
            if (init === void 0) { init = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
                        timer = controller
                            ? setTimeout(function () { return controller.abort("request timed out"); }, timeout)
                            : null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 4, 5]);
                        initWithSignal = controller ? __assign(__assign({}, init), { signal: controller.signal }) : init;
                        return [4 /*yield*/, fetch(toURL(baseUrl, path), initWithSignal)];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, parseJsonSafe(res)];
                    case 3:
                        data = _a.sent();
                        return [2 /*return*/, { res: res, data: data }];
                    case 4:
                        if (timer)
                            clearTimeout(timer);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function httpError(res, details) {
        return buildApiError("HTTP ".concat(res.status), res.status, details);
    }
    // login
    function login() {
        return __awaiter(this, arguments, void 0, function (params) {
            var result, _a, email, _b, password, headers, _c, res, data, e_1, err;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b, _c;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                validationError: (_b = p.validationError) !== null && _b !== void 0 ? _b : null,
                                unknownError: (_c = p.unknownError) !== null && _c !== void 0 ? _c : null,
                            });
                        };
                        _a = params.email, email = _a === void 0 ? "" : _a, _b = params.password, password = _b === void 0 ? "" : _b;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        headers = buildHeaders({ json: true });
                        return [4 /*yield*/, doRequest("/auth/login", {
                                method: "POST",
                                headers: headers,
                                body: JSON.stringify({ email: email, password: password }),
                            })];
                    case 2:
                        _c = _d.sent(), res = _c.res, data = _c.data;
                        if (res.status === 200) {
                            if (data && typeof data === "object" && data.user && data.authorization_token) {
                                return [2 /*return*/, result({ ok: data })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        if (res.status === 400) {
                            if (data && data.ValidationWithTranslation) {
                                return [2 /*return*/, result({ validationError: data.ValidationWithTranslation })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Bad Request", 400, data) })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_1 = _d.sent();
                        err = e_1 instanceof Error ? e_1 : buildApiError(String(e_1));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getLoggedInUser
    function getLoggedInUser() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_2, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b, _c;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unauthorizedError: (_b = p.unauthorizedError) !== null && _b !== void 0 ? _b : null,
                                unknownError: (_c = p.unknownError) !== null && _c !== void 0 ? _c : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/auth/user", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (data &&
                                typeof data === "object" &&
                                data.id &&
                                data.email &&
                                data.full_name &&
                                typeof data.is_active !== "undefined" &&
                                data.job_title) {
                                return [2 /*return*/, result({ ok: convertResponseUserDto(data) })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        if (res.status === 401) {
                            return [2 /*return*/, result({ unauthorizedError: buildApiError("Unauthorized", 401) })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_2 = _b.sent();
                        err = e_2 instanceof Error ? e_2 : buildApiError(String(e_2));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getJobTitles
    function getJobTitles() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_3, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/job-titles", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({ ok: data.map(function (row) { return convertResponseJobTitle(row); }) })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_3 = _b.sent();
                        err = e_3 instanceof Error ? e_3 : buildApiError(String(e_3));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getCompanyDepartments
    function getCompanyDepartments() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_4, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/company-departments", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({
                                        ok: data.map(function (entry) { return convertResponseCompanyDepartment(entry); })
                                    })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_4 = _b.sent();
                        err = e_4 instanceof Error ? e_4 : buildApiError(String(e_4));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getLicenses
    function getLicenses() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_5, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/licenses", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({ ok: data })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_5 = _b.sent();
                        err = e_5 instanceof Error ? e_5 : buildApiError(String(e_5));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getSystemPermissions
    function getSystemPermissions() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_6, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/system-permissions", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({ ok: data.map(function (row) { return convertResponseSystemPermission(row); }) })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_6 = _b.sent();
                        err = e_6 instanceof Error ? e_6 : buildApiError(String(e_6));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getMailingGroups
    function getMailingGroups() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_7, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/mailing-groups", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({ ok: data })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_7 = _b.sent();
                        err = e_7 instanceof Error ? e_7 : buildApiError(String(e_7));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getLicenseToJobTitleMappings
    function getLicenseToJobTitleMappings() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_8, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/job-titles/license-mappings", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({
                                        ok: data.map(function (entry) { return ({
                                            licenseId: entry.license_id,
                                            jobTitleId: entry.job_title_id,
                                        }); }),
                                    })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_8 = _b.sent();
                        err = e_8 instanceof Error ? e_8 : buildApiError(String(e_8));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getSystemPermissionToJobTitleMappings
    function getSystemPermissionToJobTitleMappings() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_9, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/job-titles/system-permission-mappings", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({
                                        ok: data.map(function (entry) { return ({
                                            systemPermissionId: entry.system_permission_id,
                                            jobTitleId: entry.job_title_id,
                                        }); }),
                                    })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_9 = _b.sent();
                        err = e_9 instanceof Error ? e_9 : buildApiError(String(e_9));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getMicrosoftSignInRedirectionUri
    function getMicrosoftSignInRedirectionUri() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_10, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        headers = buildHeaders();
                        return [4 /*yield*/, doRequest("/microsoft/redirection-uri", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (typeof data === "object" && data && "redirection_uri" in data) {
                                return [2 /*return*/, result({ ok: data.redirection_uri })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_10 = _b.sent();
                        err = e_10 instanceof Error ? e_10 : buildApiError(String(e_10));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getPaginatedUsers
    function getPaginatedUsers(per_page_1) {
        return __awaiter(this, arguments, void 0, function (per_page, cursor) {
            var result, headers, params, _a, res, data, e_11, err;
            var _b;
            if (cursor === void 0) { cursor = 0; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        params = new URLSearchParams();
                        params.set("per_page", String(per_page));
                        params.set("cursor", String(cursor));
                        return [4 /*yield*/, doRequest("/users?".concat(params.toString()), {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _c.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (typeof data === "object" && data && data.items && typeof data.total !== "undefined") {
                                return [2 /*return*/, result({
                                        ok: {
                                            items: data.items.map(function (user) { return convertResponseUserDto(user); }),
                                            total: data.total,
                                            nextCursor: (_b = data.next_cursor) !== null && _b !== void 0 ? _b : null,
                                        },
                                    })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_11 = _c.sent();
                        err = e_11 instanceof Error ? e_11 : buildApiError(String(e_11));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getPaginatedJobTitlesWithDependencies
    function getPaginatedJobTitlesWithDependencies() {
        return __awaiter(this, arguments, void 0, function (per_page, cursor) {
            var result, headers, params, _a, res, data, e_12, err;
            var _b;
            if (per_page === void 0) { per_page = 30; }
            if (cursor === void 0) { cursor = 1; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        params = new URLSearchParams();
                        params.set("per_page", String(per_page));
                        params.set("cursor", String(cursor));
                        return [4 /*yield*/, doRequest("/job-titles/paginated?".concat(params.toString()), {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _c.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (typeof data === "object" && data && data.items && typeof data.total !== "undefined") {
                                return [2 /*return*/, result({
                                        ok: {
                                            items: data.items.map(function (_a) {
                                                var job_title = _a.job_title, company_department = _a.company_department, permission_ids = _a.permission_ids;
                                                return ({
                                                    jobTitle: convertResponseJobTitle(job_title),
                                                    companyDepartment: company_department
                                                        ? convertResponseCompanyDepartment(company_department)
                                                        : null,
                                                    permissionIds: permission_ids,
                                                });
                                            }),
                                            total: data.total,
                                            nextCursor: (_b = data.next_cursor) !== null && _b !== void 0 ? _b : null,
                                        },
                                    })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_12 = _c.sent();
                        err = e_12 instanceof Error ? e_12 : buildApiError(String(e_12));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function getPermissions() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_13, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/permissions", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({ ok: data.map(convertResponsePermission) })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_13 = _b.sent();
                        err = e_13 instanceof Error ? e_13 : buildApiError(String(e_13));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // updateJobTitle
    function updateJobTitle(id, name, parentJobTitleId, companyDepartmentId, permissionIds) {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_14, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true, json: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/job-titles", {
                                method: "PUT",
                                headers: headers,
                                body: JSON.stringify({
                                    id: id,
                                    name: name,
                                    parent_job_title_id: parentJobTitleId,
                                    company_department_id: companyDepartmentId,
                                    permission_ids: permissionIds,
                                }),
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({ ok: data.map(convertResponsePermission) })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_14 = _b.sent();
                        err = e_14 instanceof Error ? e_14 : buildApiError(String(e_14));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // getJobTitlesWithDependencies
    function getJobTitlesWithDependencies() {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, _a, res, data, e_15, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = function (p) {
                            var _a, _b;
                            return ({
                                ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                                unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                            });
                        };
                        headers = buildHeaders({ auth: true });
                        if (!headers) {
                            return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, doRequest("/job-titles/with-dependencies", {
                                method: "GET",
                                headers: headers,
                            })];
                    case 2:
                        _a = _b.sent(), res = _a.res, data = _a.data;
                        if (res.status === 200) {
                            if (Array.isArray(data)) {
                                return [2 /*return*/, result({
                                        ok: data.map(function (_a) {
                                            var job_title = _a.job_title, company_department = _a.company_department, permission_ids = _a.permission_ids;
                                            return ({
                                                jobTitle: convertResponseJobTitle(job_title),
                                                companyDepartment: company_department
                                                    ? convertResponseCompanyDepartment(company_department)
                                                    : null,
                                                permissionIds: permission_ids,
                                            });
                                        }),
                                    })];
                            }
                            return [2 /*return*/, result({ unknownError: buildApiError("Unexpected 200 response shape") })];
                        }
                        return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                    case 3:
                        e_15 = _b.sent();
                        err = e_15 instanceof Error ? e_15 : buildApiError(String(e_15));
                        return [2 /*return*/, result({ unknownError: err })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    var updateCompanyDepartment = function (payload) { return __awaiter(_this, void 0, void 0, function () {
        var result, headers, _a, res, data, e_16, err;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    result = function (p) {
                        var _a, _b;
                        return ({
                            ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                            unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                        });
                    };
                    headers = buildHeaders({ auth: true, json: true });
                    if (!headers) {
                        return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, doRequest("/company-departments", {
                            method: "PUT",
                            headers: headers,
                            body: JSON.stringify(payload)
                        })];
                case 2:
                    _a = _b.sent(), res = _a.res, data = _a.data;
                    if (res.status === 200) {
                        return [2 /*return*/, result({
                                ok: null,
                            })];
                    }
                    return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                case 3:
                    e_16 = _b.sent();
                    err = e_16 instanceof Error ? e_16 : buildApiError(String(e_16));
                    return [2 /*return*/, result({ unknownError: err })];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var createCompanyDepartment = function (payload) { return __awaiter(_this, void 0, void 0, function () {
        var result, headers, _a, res, data, e_17, err;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    result = function (p) {
                        var _a, _b;
                        return ({
                            ok: (_a = p.ok) !== null && _a !== void 0 ? _a : null,
                            unknownError: (_b = p.unknownError) !== null && _b !== void 0 ? _b : null,
                        });
                    };
                    headers = buildHeaders({ auth: true, json: true });
                    if (!headers) {
                        return [2 /*return*/, result({ unknownError: buildApiError("Auth store has not been initialized") })];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, doRequest("/company-departments", {
                            method: "POST",
                            headers: headers,
                            body: JSON.stringify(payload)
                        })];
                case 2:
                    _a = _b.sent(), res = _a.res, data = _a.data;
                    if (res.status === 204) {
                        return [2 /*return*/, result({
                                ok: null,
                            })];
                    }
                    return [2 /*return*/, result({ unknownError: httpError(res, data) })];
                case 3:
                    e_17 = _b.sent();
                    err = e_17 instanceof Error ? e_17 : buildApiError(String(e_17));
                    return [2 /*return*/, result({ unknownError: err })];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return {
        login: login,
        getLoggedInUser: getLoggedInUser,
        getJobTitles: getJobTitles,
        getCompanyDepartments: getCompanyDepartments,
        getLicenses: getLicenses,
        getSystemPermissions: getSystemPermissions,
        getMailingGroups: getMailingGroups,
        getLicenseToJobTitleMappings: getLicenseToJobTitleMappings,
        getSystemPermissionToJobTitleMappings: getSystemPermissionToJobTitleMappings,
        getMicrosoftSignInRedirectionUri: getMicrosoftSignInRedirectionUri,
        getPaginatedUsers: getPaginatedUsers,
        getPaginatedJobTitlesWithDependencies: getPaginatedJobTitlesWithDependencies,
        getPermissions: getPermissions,
        updateJobTitle: updateJobTitle,
        getJobTitlesWithDependencies: getJobTitlesWithDependencies,
        updateCompanyDepartment: updateCompanyDepartment,
        createCompanyDepartment: createCompanyDepartment
    };
}
