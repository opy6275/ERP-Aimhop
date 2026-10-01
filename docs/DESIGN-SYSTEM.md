# aimhop-ERP — Design System

Premium internal ERP — clean, minimal, data-first. Not a generic colorful admin template.

## Brand

- **Product name:** aimhop-ERP  
- **Tone:** Professional, trustworthy, calm  
- **Logo:** TBD in Settings (company logo on receipts & sidebar)

## Color (Tailwind-oriented)

| Token | Usage |
|-------|--------|
| `background` | Page bg — zinc-50 / dark zinc-950 |
| `foreground` | Primary text — zinc-900 / zinc-50 |
| `muted` | Secondary text — zinc-500 |
| `border` | zinc-200 / zinc-800 |
| `primary` | Actions, active nav — indigo-600 (adjust once logo exists) |
| `success` | Present, paid — emerald-600 |
| `warning` | Pending, half day — amber-600 |
| `destructive` | Absent, errors — rose-600 |

Avoid heavy gradients on dashboard; KPI cards use subtle border + white/dark surface.

## Typography

- **Font:** Geist Sans or Inter  
- **Page title:** text-2xl font-semibold tracking-tight  
- **Section:** text-sm font-medium text-muted-foreground uppercase tracking-wide  
- **Body:** text-sm  
- **Tables:** text-sm tabular-nums for amounts and dates  

## Spacing & layout

- Sidebar width: **240px** (collapsible to icons on tablet)  
- Content padding: **p-6** desktop, **p-4** mobile  
- Max form width: **max-w-2xl**; tables full width  
- Sticky table header on long lists  

## Components (shadcn/ui baseline, customized)

- `AppShell` — sidebar + header + main  
- `KpiCard` — label, value, optional delta  
- `DataTable` — sort, filter chips, empty state, skeleton  
- `StatusBadge` — attendance & payment states  
- `PageHeader` — title + primary action right  
- `ConfirmDialog` — deactivate, delete, large payments  
- `Toast` — Sonner for success/error  

## Tables

- Row hover, zebra optional  
- Responsive: horizontal scroll with pinned first column (name) on mobile  
- Amounts right-aligned with ₹ formatter (`Intl.NumberFormat('en-IN')`)

## Empty & loading

- Empty: short title + one line + CTA (“Add first staff member”)  
- Loading: skeleton rows matching table layout  
- Error: inline alert + retry  

## Staff vs admin chrome

Same shell component; `navItems` from RBAC. Staff header shows avatar + name; admin shows company name + global search (staff quick find, Phase 3+).

## Receipt / PDF

- A4, company header, receipt title, monospace receipt number  
- Print stylesheet: hide sidebar  

Implementation: customize shadcn theme in `globals.css` when Next.js app is scaffolded (Phase 0).
