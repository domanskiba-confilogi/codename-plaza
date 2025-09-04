# Navbar Component (Pure JS + Tailwind CDN)

A lightweight, framework-agnostic navigation bar with desktop dropdowns and a mobile menu. Built with vanilla JavaScript and Tailwind CSS classes (CDN-ready), it supports multiple independent instances on the same page, clean teardown, and safe content rendering.

## Quick Start

1) Include Tailwind CDN (or your Tailwind build) in your page:
```html
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.10/dist/tailwind.min.css" rel="stylesheet">
```

2) Add a root element for the navbar:
```html
<div id="navbar-root"></div>
```

3) Include the component script (the code from this file) and mount it:
```html
<script>
  // Assuming mountNavbar is available in this scope
  const navbar = mountNavbar('#navbar-root', {
    brandName: 'Blackline',
    brandAccent: 'Labs',
    ctaText: 'Contact',
    ctaHref: '#contact',
    items: [
      { type: 'link', label: 'Pricing', href: '#pricing' },
      { type: 'link', label: 'About', href: '#about' }
    ]
  });

  // Later, to unmount:
  // navbar.destroy();
</script>
```

## Features

- Pure JavaScript, no framework dependency
- Tailwind CSS utility classes (CDN-friendly)
- Desktop dropdown menus and mobile accordion menu
- ARIA attributes and keyboard support (Escape to close)
- Multiple instances on a single page (instance-scoped behavior)
- Safe HTML escaping to prevent XSS from injected labels/links
- Clean teardown via destroy()

## API

mountNavbar(selector, options?) => instance

- selector (string, required): CSS selector for the root container (e.g., "#navbar-root"). Throws if not found.
- options (object, optional):
  - brandHref (string, default "#")
  - brandName (string, default "Blackline")
  - brandAccent (string, default "Labs")
  - ctaText (string, default "Contact")
  - ctaHref (string, default "#")
  - className (string, default "") Additional Tailwind classes for the header element
  - items (array) Navigation model used for both desktop and mobile

Returned instance:
- root (HTMLElement): The container element where the navbar is mounted
- headerEl (HTMLElement): The generated header element
- openMobile(): Programmatically open the mobile menu
- closeMobile(): Programmatically close the mobile menu
- closeDropdowns(exceptId?): Close all dropdowns (pass an id to keep one open)
- destroy(): Remove event listeners and unmount the navbar content

## Navigation Model (items)

Provide an array of items. Supported item types:
- Link item
  - type: "link"
  - label (string)
  - href (string)
- Dropdown item
  - type: "dropdown"
  - id (string) Unique within your config; used to scope dropdown DOM ids
  - label (string)
  - menuWidth (string, Tailwind width class, e.g., "w-64")
  - items (array) Submenu entries:
    - Entry with separator
      - separator: true
    - Regular entry
      - label (string)
      - href (string)
      - Optional fields:
        - desc (string) Shown in desktop “solutions” variant
        - icon (string) Character or short text badge for “solutions”
        - iconClass (string) Tailwind classes for the icon badge
        - accentClass (string) Tailwind text class for simple lists (e.g., resources)

Notes:
- A special “solutions” dropdown (id === "solutions") renders a richer desktop layout with icon + description. Other dropdowns render a simple list style.
- On mobile, the “solutions” entries render as simple links (labels only) for clarity and compactness.

## Usage Examples

Minimal:
```js
const navbar = mountNavbar('#navbar-root');
```

Custom brand, CTA, and simple links:
```js
const navbar = mountNavbar('#navbar-root', {
  brandHref: '/',
  brandName: 'Blackline',
  brandAccent: 'Labs',
  ctaText: 'Contact',
  ctaHref: '/contact',
  items: [
    { type: 'link', label: 'Pricing', href: '/pricing' },
    { type: 'link', label: 'About', href: '/about' },
  ]
});
```

Dropdowns (Solutions, Resources):
```js
const navbar = mountNavbar('#navbar-root', {
  items: [
    {
      type: 'dropdown',
      id: 'solutions',
      label: 'Solutions',
      menuWidth: 'w-64',
      items: [
        { label: 'Analytics', desc: 'Dashboards, insights, reporting', href: '/analytics', icon: 'A', iconClass: 'bg-blue-500/20 text-blue-400' },
        { label: 'Automation', desc: 'Workflows and scheduling', href: '/automation', icon: '⚙', iconClass: 'bg-yellow-400/20 text-yellow-400' },
        { label: 'Integrations', desc: 'APIs and connectors', href: '/integrations', icon: '⇄', iconClass: 'bg-neutral-800 text-neutral-300' },
      ]
    },
    {
      type: 'dropdown',
      id: 'resources',
      label: 'Resources',
      menuWidth: 'w-56',
      items: [
        { label: 'Blog', href: '/blog' },
        { label: 'Docs', href: '/docs' },
        { label: 'Tutorials', href: '/tutorials' },
        { separator: true },
        { label: 'Changelog', href: '/changelog', accentClass: 'text-blue-400' },
      ]
    },
    { type: 'link', label: 'Pricing', href: '/pricing' },
    { type: 'link', label: 'About', href: '/about' },
  ]
});
```

Programmatic control:
```js
navbar.openMobile();
navbar.closeDropdowns();
navbar.closeMobile();
navbar.destroy();
```

## Accessibility

- Buttons controlling dropdowns use aria-expanded and data-dropdown-toggle to reflect state
- Escape key closes dropdowns and the mobile menu
- Focus-visible rings on interactive elements (Tailwind focus-visible:ring classes)
- The mobile toggle button reflects aria-expanded true/false

Tip: Ensure link labels are meaningful. Avoid using only icons without text for better screen reader support.

## Behavior and Interaction

- Desktop:
  - Clicking a dropdown trigger toggles its submenu
  - Clicking elsewhere or pressing Escape closes any open submenu
  - Only one dropdown is open at a time within a navbar instance
- Mobile:
  - The hamburger toggles the entire mobile menu
  - Each dropdown behaves like an accordion section
  - Opening the mobile menu hides the “menu” icon and shows the “close” icon
- Outside Click:
  - Clicking outside the specific navbar instance closes its open dropdowns and mobile menu
- Multiple Instances:
  - Each instance is isolated via a unique id, so interactions don’t interfere across navbars

## Security

- All user-supplied strings (labels, hrefs, classes, etc.) are escaped via a dedicated esc() helper to mitigate XSS risks from content injection.

Note: Because class names are escaped, avoid passing quotes or unusual characters in class strings. Use standard Tailwind utility tokens.

## Performance and Cleanup

- A single document-level click and keydown listener per mounted instance
- Clean teardown via destroy() removes listeners and clears the root’s innerHTML
- Lightweight, no virtual DOM or reactive systems

## Error Handling

- If selector does not match an element, mountNavbar throws:
  - Error: mountNavbar: no element found for selector "…"

## Full Default Configuration (for reference)

```js
const navbar = mountNavbar('#navbar-root', {
  brandHref: '#',
  brandName: 'Blackline',
  brandAccent: 'Labs',
  ctaText: 'Contact',
  ctaHref: '#',
  className: '',
  items: [
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
});
```

## Unmounting

To remove the navbar and all its listeners:
```js
navbar.destroy();
```

