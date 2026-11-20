# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev          # start Vite dev server on port 8080
npm run build         # production build
npm run build:dev     # development-mode build
npm run lint          # eslint over the whole repo
npm run test          # run vitest once
npm run test:watch    # run vitest in watch mode
```

Run a single test file: `npx vitest run src/test/example.test.ts`
Run tests matching a name: `npx vitest run -t "some test name"`

Vite only reads `.env` at startup — **restart `npm run dev` after changing it**. The only test is the Lovable example test (`src/test/example.test.ts`); there is no real test coverage yet.

## Architecture

A Vite + React + TypeScript SPA ("hiro-stock-view", a warehouse stock monitoring system for PT. Hiro Takashi Mura, which sells LED lighting), scaffolded via Lovable (see `lovable-tagger` dev-only plugin in `vite.config.ts`), using shadcn/ui components (`src/components/ui/*`, configured in `components.json`) on top of Tailwind.

**The backend is Supabase** (hosted PostgreSQL + Supabase Auth). There is no server code in this repo: the frontend talks to Supabase directly through `@supabase/supabase-js`, and security is enforced by Row Level Security and database functions, not by the frontend. Stock starts from zero (no imported data).

Provider order in `src/App.tsx` matters: `QueryClientProvider > AuthProvider > DataProvider > TooltipProvider > ... > BrowserRouter`. `DataProvider` is inside `AuthProvider` because it calls `useAuth()` to load data when a user logs in and clear it on logout.

### Configuration
`src/lib/supabase.ts` creates the client from two Vite env vars in `.env` (git-ignored; keep a `.env.example`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

- The URL must be the API URL (`https://<ref>.supabase.co`), **not** the dashboard page URL.
- Only the publishable key (formerly "anon") belongs in the frontend. **Never** put the `secret` / `service_role` key in this repo or in client code.
- The module throws at import time if either variable is missing.

### Database (source of truth: `supabase/schema.sql`)
Run in the Supabase SQL Editor; there is no migration tooling, so any schema change must be applied there manually *and* reflected in `schema.sql`.

- Tables: `profiles` (id → auth.users, nama, email, role, aktif), `categories`, `products` (kode unique, category_id, satuan, aktif), `transactions`, `stock_batches` (one per Barang Masuk: jumlah_awal, sisa), `batch_allocations`.
- View `product_stock` (`total_masuk`, `total_keluar`, `stok_akhir`, `security_invoker`). Stock is **never stored in a column**; it is derived from batches.
- Function `catat_transaksi(p_jenis, p_product_id, p_jumlah, p_keterangan, p_tanggal, p_alokasi)` is the **only** way stock changes. It is atomic, admin-only (checked inside), creates a batch for `Masuk`, and for `Keluar` either validates the manual allocation in `p_alokasi` (`[{batch_id, jumlah}]`, total must equal `p_jumlah`) or, if `p_alokasi` is null, takes from the oldest batches (FIFO). Insert/update/delete on `transactions`, `stock_batches` and `batch_allocations` are revoked for client roles.
- Function `app_role()` returns the caller's role, or NULL for inactive / profile-less accounts. Policies: any active user can read everything; only `admin` can write `products`/`categories`; only `manajer` can update `profiles`, and only the columns `nama`, `role`, `aktif`.
- Trigger `profiles_jaga_manajer` refuses to deactivate or demote the last active `manajer`.
- Function `laporan_stok(p_from, p_to)` exists in the database but the frontend does not use it (ExportLaporan computes the report client-side).
- A product that has transactions cannot be deleted (foreign key); it is deactivated instead.

### Auth (Supabase Auth)
`src/contexts/AuthContext.tsx` exposes `{ isAuthenticated, isLoading, user, login, logout }`.

- `login(email, password)` is async and returns `{ success, message? }` (no role argument; the role comes from the account). It calls `signInWithPassword`, then loads the user's row from `profiles`. If the profile is missing or `aktif` is false the session is signed out and login fails.
- `user` is `{ id, email, nama, role }`. The session is restored on page load via `getSession`; `isLoading` is true meanwhile, and `ProtectedRoute` / `PublicRoute` render a spinner instead of redirecting.
- `describeAuthError` maps Supabase errors (wrong credentials, unconfirmed email, bad API key, network/URL problems) to specific Indonesian messages — keep it, it makes configuration problems diagnosable.
- Do **not** call Supabase queries inside the `onAuthStateChange` callback (can deadlock); it only handles `SIGNED_OUT`.
- **Accounts are created manually**: Supabase dashboard → Authentication → Users → Add user (tick *Auto Confirm User*), then add the profile row (see the template at the bottom of `schema.sql`; it looks up the id by email). Public sign-up should stay disabled. There is no "add user" UI, and email / password changes also happen in the Supabase dashboard.

### Data layer
`src/contexts/DataContext.tsx` loads categories, products (joined with category name), `product_stock`, transactions (joined with product name and recorder's name), `stock_batches` and `profiles`. Rows are fetched in pages of 1000 (`fetchAll`) because Supabase truncates larger responses silently.

It maps database rows to the same frontend shapes the pages already use, so pages need little knowledge of the schema:
- `Product`: `kategori` is the category *name*; `status` from `aktif`; `stokAwal` is always 0; `totalMasuk`/`totalKeluar` come from `product_stock`. Product ids are UUID strings.
- `Transaction`: `id` is display text `TRX-0001` built from the numeric id; `namaBarang` and `userInput` come from joins.
- `StockBatch`: ids are strings of numeric ids (converted back with `Number()` when sent to `catat_transaksi`).
- `User`: `{ id, nama, email, role, status }` — no password exists anywhere in the frontend.

Context API: `products, transactions, users, batches, isLoading, error, refresh, addProduct, updateProduct, deleteProduct, addTransaction, updateUser, toggleUserStatus`.
- **All mutations are async and throw `Error` with a user-readable Indonesian message** (database error codes are translated in `toMessage`). Pages must `await` them inside `try/catch` and show the message in a destructive toast; never assume success.
- After every mutation the context reloads all data (`loadAll`). Fine at this scale; for large data move filtering/pagination to the server (Dashboard, Riwayat and Export currently compute over all loaded transactions).
- `isLoading` is derived (`user present && data not yet loaded for that user`). `DashboardLayout` renders a spinner while loading and an error box with a "Coba Lagi" button if loading failed.
- `updateProduct`/`updateUser`/`deleteProduct` select the affected rows and treat 0 rows as a permission failure (RLS filters silently rather than erroring).

### Domain model and helpers (`src/data/dummyData.ts`)
The file name is historical (kept so imports don't change); it now holds only types and helpers, **no seed data**:
- Types `UserRole`, `User`, `Product`, `Transaction`, `StockBatch`.
- `categories` constant (Indoor / Outdoor / Industrial Lighting) used by the UI selects — **it must match the `categories` table**. Adding a category means inserting it in the database *and* adding it here.
- `getStokAkhir(product)` (= stokAwal + totalMasuk − totalKeluar), `getStokStatus(stokAkhir)` (`'Habis'` at 0, `'Menipis'` below 10, else `'Aman'`), `sortBatchesByTanggal(batches)`. Use these rather than recomputing stock logic ad hoc.

### Dates
Use `todayLocal()` from `@/lib/date` for "today" / current month. **Do not** use `new Date().toISOString().split('T')[0]`: it is UTC, so in Indonesia (WIB, UTC+7) it returns yesterday between 00:00 and 07:00. (Three export filenames in StokBarang / RiwayatTransaksi / ExportLaporan still use `toISOString`; harmless since it only affects the file name.)

### Routing and role-based access
`src/App.tsx` defines all routes. Two wrapper components gate access:
- `ProtectedRoute` — spinner while auth loads; redirects to `/` if not authenticated; if `allowedRoles` is set and the user's role isn't included, redirects to `/dashboard`.
- `PublicRoute` — spinner while auth loads; redirects authenticated users away from `/` (the login page).

Route → role mapping: `kelola-barang`, `barang-masuk`, `barang-keluar` are `admin`-only; `riwayat-transaksi`, `kelola-pengguna` are `manajer`-only; `dashboard`, `stok-barang`, `export-laporan` are shared. The sidebar in `src/components/layout/DashboardLayout.tsx` (`menuItems`) filters nav links by the same roles — **when adding a new route, update both `App.tsx` (route + `allowedRoles`) and `menuItems` (nav entry + `roles`)**. These checks are only UX; the real enforcement is RLS and `catat_transaksi` in the database.

### Page notes
- `Dashboard.tsx`: different stat cards for admin vs manajer; low-stock list uses `getStokStatus`. A new product with 0 stock shows as "Habis".
- `KelolaBarang.tsx`: CRUD for products. Rejects duplicate `kode` (client check plus database constraint); delete asks for confirmation and, if the product has transactions, offers "Nonaktifkan" instead.
- `BarangMasuk.tsx` / `BarangKeluar.tsx`: call `addTransaction`. Barang Keluar makes the admin allocate the quantity across batches manually (total must equal `jumlah`); the oldest batch is only labelled "FIFO" as a suggestion. The database re-validates everything.
- `KelolaPengguna.tsx`: edit name and role, toggle active status. No add-user, no password fields, email is read-only. A manajer cannot change their own role or deactivate themself (the switch/select are disabled; the trigger also protects the last manajer). `UserForm` is defined at module level on purpose — defining it inside the page component makes inputs lose focus on every keystroke.
- `ExportLaporan.tsx`: stock report is computed per selected date range (Masuk/Keluar from transactions in range; Stok Akhir = current stock minus net movement after the end date; Stok Awal = Stok Akhir − Masuk + Keluar). The "Periode" dropdown is only a label; the date range drives the data.
- `StokBarang.tsx`, `RiwayatTransaksi.tsx`, `ExportLaporan.tsx` export through `exportToExcel` / `exportToPdf` from `@/lib/export`. The "Stok Awal" column in StokBarang and the stock report is always 0 now and can be removed.

### UI conventions
- Path alias `@/*` maps to `src/*` (set in `vite.config.ts`, `vitest.config.ts`, and both tsconfig files — keep them in sync if it ever changes).
- Domain-facing strings (page labels, form text, toasts, error messages) are in Indonesian, matching the business domain; keep new UI text consistent with this rather than switching to English.
- Toasts go through `useToast`/`toast` from `@/hooks/use-toast` (shadcn toaster) — the established pattern for feedback on submit/validation and for surfacing database errors; some forms also show inline field errors.
- Status colors use CSS variables via Tailwind arbitrary values: `hsl(var(--success))`, `hsl(var(--warning))`, `hsl(var(--info))`, plus `destructive`/`primary`. Barang Masuk uses success, Barang Keluar uses info.
- TypeScript strictness is intentionally relaxed repo-wide (`strict: false`, `noImplicitAny: false`, `noUnusedLocals/Parameters: false` in `tsconfig.app.json`) and ESLint disables `@typescript-eslint/no-unused-vars` — don't introduce stricter local overrides unless asked.

## Known issues / gotchas
- The browser console shows React Router v7 "future flag" warnings; they are harmless (opt in with `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` on `BrowserRouter` to silence them).
- A stale saved session can produce a one-time `400` on `auth/v1/token?grant_type=refresh_token`; the session is then dropped and the user logs in again.
- Data is not realtime: other users' changes appear after a reload or after the current user's next mutation.
- No automated tests beyond the Lovable example; verify changes by running through: add product → Barang Masuk → Barang Keluar with batch allocation → try deleting a product with transactions → refresh → log in as manajer.

## Planned (not done yet)
- Deployment (Vercel or Netlify): set the two env vars in the host, and add the deployed URL to the Supabase Auth URL settings.
- Server-side filtering/pagination once the number of transactions grows.
- Remove the always-zero "Stok Awal" columns; optionally load categories from the database instead of the constant.