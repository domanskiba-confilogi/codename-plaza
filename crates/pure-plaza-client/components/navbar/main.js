// Pure JS + Tailwind (CDN) Navbar Component
// Usage:
//   const navbar = mountNavbar('#navbar-root', { brandName: 'Blackline Labs' });
//   navbar.destroy() // to unmount
function mountNavbar(selector, options = {}) {
	const root = document.querySelector(selector);
	if (!root) throw new Error(`mountNavbar: no element found for selector "${selector}"`);

	const uid = `nav-${Math.random().toString(36).slice(2, 9)}`;
	const cfg = {
		brandHref: options.brandHref || '#',
		brandName: options.brandName || 'Blackline',
		brandAccent: options.brandAccent || 'Labs',
		ctaText: options.ctaText || 'Contact',
		ctaHref: options.ctaHref || '#',
		className: options.className || '',
		// Nav model (desktop and mobile share the same structure)
		items: Array.isArray(options.items) ? options.items : [
			{
				type: 'dropdown',
				id: 'solutions',
				label: 'Solutions',
				menuWidth: 'w-64',
				items: [
					{ label: 'Analytics', desc: 'Dashboards, insights, reporting', href: '#', icon: 'A', iconClass: 'bg-blue-500/20 text-blue-400' },
					{ label: 'Automation', desc: 'Workflows and scheduling', href: '#', icon: '⚙', iconClass: 'bg-yellow-400/20 text-yellow-400' },
					{ label: 'Integrations', desc: 'APIs and connectors', href: '#', icon: '⇄', iconClass: 'bg-neutral-800 text-neutral-300' },
				]
			},
			{
				type: 'dropdown',
				id: 'resources',
				label: 'Resources',
				menuWidth: 'w-56',
				items: [
					{ label: 'Blog', href: '#' },
					{ label: 'Docs', href: '#' },
					{ label: 'Tutorials', href: '#' },
					{ separator: true },
					{ label: 'Changelog', href: '#', accentClass: 'text-blue-400' },
				]
			},
			{ type: 'link', label: 'Pricing', href: '#' },
			{ type: 'link', label: 'About', href: '#' },
		]
	};

	function esc(s) {
		return String(s)
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	function renderLogo() {
		return `
<a href="${esc(cfg.brandHref)}" class="flex items-center gap-3 group">
${CONFILOGI_ONLY_LOGO_ICON_SVG}
</span>
<span class="text-lg font-semibold tracking-tight text-neutral-100">
${esc(cfg.brandName)} <span class="text-blue-400">${esc(cfg.brandAccent)}</span>
</span>
</a>
`;
	}

	function renderDesktopItem(item) {
		if (item.type === 'link') {
			return `
<a href="${esc(item.href || '#')}" class="rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400">
${esc(item.label)}
</a>
`;
		}
		if (item.type === 'dropdown') {
			const ddId = `dd-${item.id}-${uid}`;
			return `
<div class="relative" data-dropdown>
<button type="button"
class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
aria-expanded="false"
data-dropdown-toggle="${ddId}">
${esc(item.label)}
<svg class="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
</svg>
</button>
<div id="${ddId}"
class="absolute right-0 mt-2 ${item.menuWidth || 'w-64'} origin-top-right rounded-lg border border-neutral-800 bg-neutral-900/95 shadow-lg ring-1 ring-black/0 backdrop-blur hidden"
role="menu"
aria-label="${esc(item.label)} submenu">
${renderDesktopDropdownContent(item)}
</div>
</div>
`;
		}
		return '';
	}

	function renderDesktopDropdownContent(item) {
		if (!Array.isArray(item.items)) return '';
		if (item.id === 'solutions') {
			return `
<div class="p-2">
${item.items.map(entry => `
${entry.separator ? '<div class="my-2 border-t border-neutral-800"></div>' : `
<a href="${esc(entry.href || '#')}" class="flex items-start gap-3 rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 focus:bg-neutral-800 focus:outline-none">
<span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded ${esc(entry.iconClass || 'bg-neutral-800 text-neutral-300')}">${esc(entry.icon || '')}</span>
<span>
<span class="block font-medium">${esc(entry.label)}</span>
${entry.desc ? `<span class="block text-xs text-neutral-400">${esc(entry.desc)}</span>` : ''}
</span>
</a>`}
`).join('')}
</div>
`;
		}
		// Generic simple list (Resources)
		return `
<div class="py-2">
${item.items.map(entry => `
${entry.separator ? '<div class="my-2 border-t border-neutral-800"></div>' : `
<a href="${esc(entry.href || '#')}" class="block px-4 py-2 text-sm ${esc(entry.accentClass || 'text-neutral-200')} hover:bg-neutral-800">${esc(entry.label)}</a>`}
`).join('')}
</div>
`;
	}

	function renderMobileItem(item) {
		if (item.type === 'link') {
			return `
<a href="${esc(item.href || '#')}" class="block rounded-md px-4 py-3 text-sm font-medium text-neutral-200 hover:bg-neutral-900">
${esc(item.label)}
</a>
`;
		}
		if (item.type === 'dropdown') {
			const mddId = `mdd-${item.id}-${uid}`;
			return `
<div class="rounded-lg border border-neutral-800">
<button type="button"
class="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-200 hover:bg-neutral-900 focus:outline-none"
aria-expanded="false"
data-dropdown-toggle="${mddId}">
<span>${esc(item.label)}</span>
<svg class="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
</svg>
</button>
<div id="${mddId}" class="hidden px-2 pb-2">
${renderMobileDropdownContent(item)}
</div>
</div>
`;
		}
		return '';
	}

	function renderMobileDropdownContent(item) {
		if (!Array.isArray(item.items)) return '';
		if (item.id === 'solutions') {
			return item.items.map(entry => `
${entry.separator ? '<div class="my-2 border-t border-neutral-800"></div>' : `
<a href="${esc(entry.href || '#')}" class="block rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900">${esc(entry.label)}</a>`}
`).join('');
		}
		return item.items.map(entry => `
${entry.separator ? '<div class="my-2 border-t border-neutral-800"></div>' : `
<a href="${esc(entry.href || '#')}" class="block rounded-md px-3 py-2 text-sm ${esc(entry.accentClass || 'text-neutral-200')} hover:bg-neutral-900">${esc(entry.label)}</a>`}
`).join('');
	}

	root.innerHTML = `
<header id="${uid}" class="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur ${esc(cfg.className)}">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			${renderLogo()}

			<nav class="hidden lg:flex items-center gap-2">
				${cfg.items.map(renderDesktopItem).join('')}

				<a href="${esc(cfg.ctaHref)}"
					class="ml-2 inline-flex items-center justify-center rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400">
					${esc(cfg.ctaText)}
				</a>
			</nav>

			<div class="lg:hidden">
				<button
					type="button"
					id="${uid}-mobileBtn"
					class="inline-flex items-center justify-center rounded-md p-2 text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
					aria-controls="${uid}-mobileMenu"
					aria-expanded="false"
				>
					<span class="sr-only">Open main menu</span>
					<svg id="${uid}-icon-menu" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/>
					</svg>
					<svg id="${uid}-icon-close" class="hidden h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>
		</div>
	</div>

	<div id="${uid}-mobileMenu" class="lg:hidden hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
		<div class="space-y-1 px-4 py-4">
			${cfg.items.map(renderMobileItem).join('')}
			<a href="${esc(cfg.ctaHref)}" class="block rounded-md bg-yellow-400 px-4 py-3 text-center text-sm font-semibold text-black hover:bg-yellow-300">${esc(cfg.ctaText)}</a>
		</div>
	</div>
</header>
`;

	// State-less DOM manipulation helpers (per-instance)
	const headerEl = root.querySelector(`#${CSS.escape(uid)}`);
	const mobileBtn = root.querySelector(`#${CSS.escape(uid)}-mobileBtn`);
	const mobileMenu = root.querySelector(`#${CSS.escape(uid)}-mobileMenu`);
	const iconMenu = root.querySelector(`#${CSS.escape(uid)}-icon-menu`);
	const iconClose = root.querySelector(`#${CSS.escape(uid)}-icon-close`);

	function closeAllDropdowns(exceptId) {
		headerEl.querySelectorAll('[id^="dd-"], [id^="mdd-"]').forEach(menu => {
			if (exceptId && menu.id === exceptId) return;
			if (!menu.classList.contains('hidden')) {
				menu.classList.add('hidden');
			}
			const btn = headerEl.querySelector('[data-dropdown-toggle="' + menu.id + '"]');
			if (btn) btn.setAttribute('aria-expanded', 'false');
		});
	}

	function isMobileMenuOpen() {
		return !mobileMenu.classList.contains('hidden');
	}

	function openMobileMenu() {
		mobileMenu.classList.remove('hidden');
		mobileBtn?.setAttribute('aria-expanded', 'true');
		iconMenu?.classList.add('hidden');
		iconClose?.classList.remove('hidden');
	}

	function closeMobileMenu() {
		mobileMenu.classList.add('hidden');
		mobileBtn?.setAttribute('aria-expanded', 'false');
		iconMenu?.classList.remove('hidden');
		iconClose?.classList.add('hidden');
		closeAllDropdowns(); // also close any mobile accordions
	}

	// Event handlers
	const onDocumentClick = (e) => {
		const withinThisHeader = headerEl.contains(e.target);
		const toggleBtn = withinThisHeader ? e.target.closest('[data-dropdown-toggle]') : null;
		const menuId = toggleBtn ? toggleBtn.getAttribute('data-dropdown-toggle') : null;

		if (toggleBtn && menuId) {
			const menu = headerEl.querySelector('#' + CSS.escape(menuId));
			if (!menu) return;
			const isHidden = menu.classList.contains('hidden');
			closeAllDropdowns(isHidden ? menuId : null);
			menu.classList.toggle('hidden', !isHidden);
			toggleBtn.setAttribute('aria-expanded', String(isHidden));
			return;
		}

		// Outside click closes dropdowns for this navbar instance
		if (!withinThisHeader) {
			closeAllDropdowns();
			if (isMobileMenuOpen()) closeMobileMenu();
		}
	};

	const onKeydown = (e) => {
		if (e.key === 'Escape') {
			closeAllDropdowns();
			if (isMobileMenuOpen()) closeMobileMenu();
		}
	};

	const onMobileBtnClick = () => {
		if (isMobileMenuOpen()) {
			closeMobileMenu();
		} else {
			openMobileMenu();
		}
	};

	// Attach listeners
	document.addEventListener('click', onDocumentClick);
	document.addEventListener('keydown', onKeydown);
	mobileBtn?.addEventListener('click', onMobileBtnClick);

	// Public API
	return {
		root,
		headerEl,
		openMobile: openMobileMenu,
		closeMobile: closeMobileMenu,
		closeDropdowns: closeAllDropdowns,
		destroy: () => {
			document.removeEventListener('click', onDocumentClick);
			document.removeEventListener('keydown', onKeydown);
			mobileBtn?.removeEventListener('click', onMobileBtnClick);
			root.innerHTML = '';
		}
	};
}
