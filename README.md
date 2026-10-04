# Abu Khater Menu (Web Ordering Application)

A modern, production-grade digital ordering application for Abu Khater Restaurant, built with React, Vite, Tailwind CSS, and Supabase.

---

## 1. Architecture Overview

- **Primary Backend & Single Source of Truth:** **Supabase** (`https://htpnxizfqmnnkhemvmdz.supabase.co`).
- **Realtime Kitchen & Dispatch Integration:** Directly synced with **Abu Khater Delivery / Operations Dashboard** (`AbuKhater_delivery` repository).
- **Legacy Systems Note:** n8n workflows and direct Google Sheets sync are legacy and have been completely replaced by direct Supabase relational database interactions and RPCs.
- **Image Assets:** Google Drive URLs stored in `menu_items.image_url` are dynamically transformed into optimized high-res thumbnails via `src/core/utils/googleDrive.js`.

---

## 2. Core Data Flow & Supabase Tables

All operations interface directly with Supabase relational schema:

### Menu & Catalog
- `categories`: Menu categories hierarchy and display ordering.
- `menu_items`: Canonical base products (UUID primary keys).
- `menu_item_variants`: Relational variants (e.g. Weight: 1 KG, ½ KG, ¼ KG, ⅛ KG; or Sandwich sizes).
- `menu_item_option_groups` & `menu_item_options`: Option choices (e.g. Cooking styles, Sauces, Add-ons).

### Orders & Checkout
- `orders`: Master orders record (customer phone, delivery zone, total amount, payment status, status tracking).
- `order_items`: Relational line items linked via `order_id` and `product_id`, storing quantity, unit price, and complete immutable item snapshots inside `notes`.
- `create_order` RPC: Atomically creates orders and order line items. Falls back to direct two-step insert if RPC is unavailable.

### Settings & Operations
- `restaurant_settings`: Active operation settings (working hours, delivery fees, minimum orders).
- `delivery_zones`: Delivery locations and zone-specific rates.
- `shifts` & `staff_roles`: Operational shifts and driver assignments.

---

## 3. Commercial Pricing Engine (Model A)

Pricing and selection are governed by `src/core/utils/pricingEngine.js`:
- **Weight-Based Products (`WEIGHT_BASED`):** Uses explicit commercial pricing per weight variant (1 KG, ½ KG, ¼ KG, ⅛ KG) matching physical menu specifications.
- **Portion / Pieces (`PORTION`):** Clear single-portion or piece pricing.
- **Standard Quantity (`STANDARD_QTY`):** Simple base price multiplied by quantity.
- **Options & Variants (`COMPLEX_VARIANTS`):** Add-ons and modifiers dynamically computed and sealed into the order line snapshot.

---

## 4. Documentation & Archives

- `ARCHITECTURE.md`: High-level Supabase architecture and security patterns.
- `docs/archive/`: Historical migration logs, legacy task lists, and initial planning documents:
  - `docs/archive/plan.md`
  - `docs/archive/PROJECT_CONTEXT.md`
  - `docs/archive/TASKS.md`
  - `docs/archive/ARCHITECTURE_MIGRATION_REPORT.md`

---

## 5. Development & Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```
