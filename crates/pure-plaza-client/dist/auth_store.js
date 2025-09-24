export function createAuthStore(options) {
    var _a;
    if (options === void 0) { options = {}; }
    var STORAGE_KEY = (_a = options.storageKey) !== null && _a !== void 0 ? _a : 'auth.token';
    // Fallback-safe storage that prefers localStorage, falls back to in-memory
    var storage = (function () {
        var available = false;
        var ls;
        try {
            var g = globalThis;
            if (g && g.localStorage) {
                ls = g.localStorage;
                var t = '__auth_store_test__';
                ls.setItem(t, '1');
                ls.removeItem(t);
                available = true;
            }
        }
        catch (_a) {
            available = false;
        }
        var memoryToken = null;
        return {
            set: function (token) {
                if (available && ls)
                    ls.setItem(STORAGE_KEY, token);
                else
                    memoryToken = token;
            },
            get: function () {
                if (available && ls)
                    return ls.getItem(STORAGE_KEY);
                return memoryToken;
            },
            remove: function () {
                if (available && ls)
                    ls.removeItem(STORAGE_KEY);
                else
                    memoryToken = null;
            },
        };
    })();
    // User is kept only in memory (not persisted)
    var inMemoryUser = null;
    return {
        setLoggedInUser: function (authentication_token, user) {
            if (typeof authentication_token === 'string' && authentication_token.length > 0) {
                storage.set(authentication_token);
            }
            else {
                // If no valid token provided, clear stored token
                storage.remove();
            }
            // Store user only in memory (session-scoped)
            inMemoryUser = user !== null && user !== void 0 ? user : null;
        },
        getLoggedInUser: function () {
            return inMemoryUser;
        },
        getAuthorizationToken: function () {
            return storage.get();
        },
        isUserLoggedIn: function () {
            var token = storage.get();
            return typeof token === 'string' && token.length > 0;
        },
    };
}
