import { escapeHtml, mustQuerySelector } from "./helpers.js";

export type DropdownSeparator = { separator: true };

export type DropdownEntry =
  | {
      label: string;
      href?: string;
      desc?: string;
      icon?: string;
      iconClass?: string;
      accentClass?: string;
      separator?: false | undefined;
    }
  | DropdownSeparator;

export type NavLinkItem = {
  type: 'link';
  label: string;
  href?: string;
};

export type DropdownItem = {
  type: 'dropdown';
  id: string;
  label: string;
  menuWidth?: string; // Tailwind width class, e.g., 'w-64'
  items: DropdownEntry[];
};

export type NavItem = NavLinkItem | DropdownItem;

export type NavbarOptions = {
  brandHref?: string;
  brandName?: string;
  brandAccent?: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  items?: NavItem[];
  logoSvg?: string; // Optional inline SVG for logo
};

export type MountedNavbar = {
  root: HTMLElement;
  headerEl: HTMLElement;
  openMobile: () => void;
  closeMobile: () => void;
  closeDropdowns: (exceptId?: string) => void;
  destroy: () => void;
};

// Minimal, neutral default logo (zastąp własnym jeśli chcesz)
const DEFAULT_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
<path d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.77 5.82 22 7 14.15l-5-4.88 6.91-1.01L12 2z"/>
</svg>
`;

// CSS.escape fallback (zachowawczy)
const cssEscape: (s: string) => string =
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape
    : (s: string) => s.replace(/[^a-zA-Z0-9_\-]/g, (ch) => '\\' + ch);

const defaultItems: NavItem[] = [
  {
    type: 'dropdown',
    id: 'solutions',
    label: 'Solutions',
    menuWidth: 'w-64',
    items: [
      {
	label: 'Analytics',
	desc: 'Dashboards, insights, reporting',
	href: '#',
	icon: 'A',
	iconClass: 'bg-blue-500/20 text-blue-400',
      },
      {
	label: 'Automation',
	desc: 'Workflows and scheduling',
	href: '#',
	icon: '⚙',
	iconClass: 'bg-yellow-400/20 text-yellow-400',
      },
      {
	label: 'Integrations',
	desc: 'APIs and connectors',
	href: '#',
	icon: '⇄',
	iconClass: 'bg-neutral-800 text-neutral-300',
      },
    ],
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
    ],
  },
  { type: 'link', label: 'Pricing', href: '#' },
  { type: 'link', label: 'About', href: '#' },
];

export function mountNavbar(selector: string, options: NavbarOptions = {}): MountedNavbar {
  const root = document.querySelector(selector) as HTMLElement | null;
  if (!root) throw new Error(`mountNavbar: no element found for selector "${selector}"`);

  const uid = `nav-${Math.random().toString(36).slice(2, 9)}`;

  const cfg = {
    brandHref: options.brandHref ?? '#',
    brandName: options.brandName ?? 'Blackline',
    brandAccent: options.brandAccent ?? 'Labs',
    ctaText: options.ctaText ?? 'Contact',
    ctaHref: options.ctaHref ?? '#',
    className: options.className ?? '',
    items: Array.isArray(options.items) ? options.items : defaultItems,
    logoSvg: options.logoSvg ?? DEFAULT_LOGO_SVG,
  };

  function renderLogo(): string {
    return `
<a href="${escapeHtml(cfg.brandHref)}" class="flex items-center gap-3 group">
${cfg.logoSvg}
<span class="text-lg font-semibold tracking-tight text-neutral-100">
${escapeHtml(cfg.brandName)} <span class="text-blue-400">${escapeHtml(cfg.brandAccent)}</span>
</span>
</a>
`;
  }

  function renderDesktopDropdownContent(item: DropdownItem): string {
    if (!Array.isArray(item.items)) return '';

    if (item.id === 'solutions') {
      // Karty z opisami i ikonami
      return `
<div class="p-2">
${item.items
.map((entry) =>
'separator' in entry && entry.separator
? '<div class="my-2 border-t border-neutral-800"></div>'
: `
<a href="${escapeHtml(entry.href ?? '#')}" class="flex items-start gap-3 rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 focus:bg-neutral-800 focus:outline-none">
<span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded ${escapeHtml(
(entry as Exclude<DropdownEntry, DropdownSeparator>).iconClass ?? 'bg-neutral-800 text-neutral-300'
)}">${escapeHtml((entry as Exclude<DropdownEntry, DropdownSeparator>).icon ?? '')}</span>
<span>
<span class="block font-medium">${escapeHtml((entry as Exclude<DropdownEntry, DropdownSeparator>).label)}</span>
${
(entry as Exclude<DropdownEntry, DropdownSeparator>).desc !== undefined
? `<span class="block text-xs text-neutral-400">${escapeHtml(
(entry as Exclude<DropdownEntry, DropdownSeparator>).desc!
)}</span>`
: ''
}
</span>
</a>`
)
.join('')}
</div>
`;
    }

    // Prosta lista (np. Resources)
    return `
<div class="py-2">
${item.items
.map((entry) =>
'separator' in entry && entry.separator
? '<div class="my-2 border-t border-neutral-800"></div>'
: `
<a href="${escapeHtml((entry as Exclude<DropdownEntry, DropdownSeparator>).href ?? '#')}" class="block px-4 py-2 text-sm ${escapeHtml(
(entry as Exclude<DropdownEntry, DropdownSeparator>).accentClass ?? 'text-neutral-200'
)} hover:bg-neutral-800">${escapeHtml((entry as Exclude<DropdownEntry, DropdownSeparator>).label)}</a>`
)
.join('')}
</div>
`;
  }

  function renderDesktopItem(item: NavItem): string {
    if (item.type === 'link') {
      return `
<a href="${escapeHtml(item.href ?? '#')}" class="rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400">
${escapeHtml(item.label)}
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
data-dropdown-toggle="${escapeHtml(ddId)}">
${escapeHtml(item.label)}
<svg class="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
</svg>
</button>
<div id="${escapeHtml(ddId)}"
class="absolute right-0 mt-2 ${escapeHtml(item.menuWidth ?? 'w-64')} origin-top-right rounded-lg border border-neutral-800 bg-neutral-900/95 shadow-lg ring-1 ring-black/0 backdrop-blur hidden"
role="menu"
aria-label="${escapeHtml(item.label)} submenu">
${renderDesktopDropdownContent(item)}
</div>
</div>
`;
    }
    return '';
  }

  function renderMobileDropdownContent(item: DropdownItem): string {
    if (!Array.isArray(item.items)) return '';

    if (item.id === 'solutions') {
      return item.items
	.map((entry) =>
	  'separator' in entry && entry.separator
	    ? '<div class="my-2 border-t border-neutral-800"></div>'
	    : `
<a href="${escapeHtml((entry as Exclude<DropdownEntry, DropdownSeparator>).href ?? '#')}" class="block rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900">${escapeHtml(
(entry as Exclude<DropdownEntry, DropdownSeparator>).label
)}</a>`
	)
	.join('');
    }

    return item.items
      .map((entry) =>
	'separator' in entry && entry.separator
	  ? '<div class="my-2 border-t border-neutral-800"></div>'
	  : `
<a href="${escapeHtml((entry as Exclude<DropdownEntry, DropdownSeparator>).href ?? '#')}" class="block rounded-md px-3 py-2 text-sm ${escapeHtml(
(entry as Exclude<DropdownEntry, DropdownSeparator>).accentClass ?? 'text-neutral-200'
)} hover:bg-neutral-900">${escapeHtml((entry as Exclude<DropdownEntry, DropdownSeparator>).label)}</a>`
      )
      .join('');
  }

  function renderMobileItem(item: NavItem): string {
    if (item.type === 'link') {
      return `
<a href="${escapeHtml(item.href ?? '#')}" class="block rounded-md px-4 py-3 text-sm font-medium text-neutral-200 hover:bg-neutral-900">
${escapeHtml(item.label)}
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
data-dropdown-toggle="${escapeHtml(mddId)}">
<span>${escapeHtml(item.label)}</span>
<svg class="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
</svg>
</button>
<div id="${escapeHtml(mddId)}" class="hidden px-2 pb-2">
${renderMobileDropdownContent(item)}
</div>
</div>
`;
    }
    return '';
  }

  // Render
  root.innerHTML = `
<header id="${escapeHtml(uid)}" class="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur ${escapeHtml(
	cfg.className
)}">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			${renderLogo()}
			<nav class="hidden lg:flex items-center gap-2">
				${cfg.items.map((it) => renderDesktopItem(it)).join('')}
				<a href="${escapeHtml(cfg.ctaHref)}"
					class="ml-2 inline-flex items-center justify-center rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400">
					${escapeHtml(cfg.ctaText)}
				</a>
			</nav>
			<div class="lg:hidden">
				<button
					type="button"
					id="${escapeHtml(uid)}-mobileBtn"
					class="inline-flex items-center justify-center rounded-md p-2 text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
					aria-controls="${escapeHtml(uid)}-mobileMenu"
					aria-expanded="false">
					<span class="sr-only">Open main menu</span>
					<svg id="${escapeHtml(uid)}-icon-menu" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/>
					</svg>
					<svg id="${escapeHtml(uid)}-icon-close" class="hidden h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>
		</div>
	</div>
	<div id="${escapeHtml(uid)}-mobileMenu" class="lg:hidden hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
		<div class="space-y-1 px-4 py-4">
			${cfg.items.map((it) => renderMobileItem(it)).join('')}
			<a href="${escapeHtml(cfg.ctaHref)}" class="block rounded-md bg-yellow-400 px-4 py-3 text-center text-sm font-semibold text-black hover:bg-yellow-300">${escapeHtml(
				cfg.ctaText
				)}</a>
		</div>
	</div>
</header>
`;

  // Elementy instancji
  const headerEl = mustQuerySelector<HTMLElement>(root, `#${cssEscape(uid)}`);
  if (!headerEl) throw new Error('mountNavbar: failed to render header');

  const mobileBtn = mustQuerySelector<HTMLButtonElement>(root, `#${cssEscape(uid)}-mobileBtn`);
  const mobileMenu = mustQuerySelector<HTMLElement>(root, `#${cssEscape(uid)}-mobileMenu`);
  const iconMenu = mustQuerySelector<SVGElement>(root, `#${cssEscape(uid)}-icon-menu`);
  const iconClose = mustQuerySelector<SVGElement>(root, `#${cssEscape(uid)}-icon-close`);

  // Helpers
  function closeAllDropdowns(exceptId?: string): void {
    const menus = headerEl.querySelectorAll<HTMLElement>('[id^="dd-"], [id^="mdd-"]');
    menus.forEach((menu) => {
      if (exceptId && menu.id === exceptId) return;
      if (!menu.classList.contains('hidden')) {
	menu.classList.add('hidden');
      }
      const btn = headerEl.querySelector<HTMLElement>(`[data-dropdown-toggle="${menu.id}"]`);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function isMobileMenuOpen(): boolean {
    return !!mobileMenu && !mobileMenu.classList.contains('hidden');
  }

  function openMobileMenu(): void {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('hidden');
    mobileBtn?.setAttribute('aria-expanded', 'true');
    iconMenu?.classList.add('hidden');
    iconClose?.classList.remove('hidden');
  }

  function closeMobileMenu(): void {
    if (!mobileMenu) return;
    mobileMenu.classList.add('hidden');
    mobileBtn?.setAttribute('aria-expanded', 'false');
    iconMenu?.classList.remove('hidden');
    iconClose?.classList.add('hidden');
    closeAllDropdowns(); // zamyka też mobilne akordeony
  }

  // Event handlers
  const onDocumentClick = (e: MouseEvent) => {
    const target = e.target as Node | null;
    if (!target) return;

    const withinThisHeader = headerEl.contains(target);
    const toggleBtn = withinThisHeader && target instanceof Element ? target.closest<HTMLElement>('[data-dropdown-toggle]') : null;
    const menuId = toggleBtn?.getAttribute('data-dropdown-toggle') ?? null;

    if (toggleBtn && menuId) {
      const menu = headerEl.querySelector<HTMLElement>('#' + cssEscape(menuId));
      if (!menu) return;
      const isHidden = menu.classList.contains('hidden');
      closeAllDropdowns(isHidden ? menuId : undefined);
      menu.classList.toggle('hidden', !isHidden);
      toggleBtn.setAttribute('aria-expanded', String(isHidden));
      return;
    }

    // Klik poza headerem zamyka dropdowny i mobilne menu (tylko dla tej instancji)
    if (!withinThisHeader) {
      closeAllDropdowns();
      if (isMobileMenuOpen()) closeMobileMenu();
    }
  };

  const onKeydown = (e: KeyboardEvent) => {
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

  // Attach
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
    },
  };
}
