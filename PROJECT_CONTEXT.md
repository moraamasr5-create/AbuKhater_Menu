# Project context — Abu Khater food delivery

Use this document as **system context** for the restaurant ordering web app and its integrations.

## What this system is

A **food delivery / pickup ordering** flow: customers browse a menu, build a cart, enter delivery or pickup details, pay (or reserve) with proof screenshots, and orders are processed through automation.

## Main parts

| Part | Role |
|------|------|
| **React SPA (this repo)** | Customer-facing menu and checkout (`Vite`, `React`, `React Router`). Cart persisted in `localStorage`. |
| **n8n** | Automation hub: receives webhooks from the app (menu, submit order, reservation), orchestrates downstream steps (e.g. sheets, notifications). Base URL and paths live in `src/services/api.js` (`/menu-api`, `/submit-order`, `/reservation`). |
| **Telegram** | Operational notifications (new orders, reservations, alerts). Configured inside n8n workflows, not in the frontend. |
| **Google Drive** | Menu item images: URLs may point at Drive; the app normalizes some Drive links to thumbnail URLs in `n8nService.mapSingleItem()` in `src/services/api.js`. |

There is **no dedicated backend server** in this repository; the browser talks **directly** to n8n webhook URLs over HTTPS.

## Product goals

1. **Fast order processing** — Minimize steps and latency from “confirm payment” to n8n receiving a complete, parseable payload. Avoid duplicate or conflicting webhook calls for the same order.
2. **Stable image sending** — Menu images should load reliably (Drive thumbnails / consistent URL shape); payment or reservation proof images are sent as part of JSON payloads—watch n8n/body size limits and logging of sensitive data.
3. **Easy updates** — Menu and business rules should be updatable **without** redeploying the app when possible (menu from n8n/API); keep webhook contracts documented here or in payload notes when they change.

## Data flow (short)

- **Menu:** App → `POST` menu webhook → normalized items in UI; local fallback in `src/utils/data.js` if remote fails.
- **Order:** App → `POST` submit-order webhook with customer, items, totals, payment screenshot (base64 when applicable).
- **Reservation:** App → `POST` reservation webhook with booking fields and payment proof.

## Conventions for agents / developers

- Prefer **one canonical order payload** and a single submit path unless n8n explicitly requires a legacy duplicate.
- Distinguish **test** vs **production** n8n webhooks (`webhook-test` vs production paths) before go-live.
- Do not log full payment screenshots or PII in client `console` in production builds.
- **RTL / Arabic** UI is first-class (`index.html` `dir="rtl"`).

## Related files in repo

- `src/services/api.js` — n8n client (`n8nService`)
- `src/context/CartContext.jsx` — cart, delivery, customer/payment state
- `src/pages/*.jsx` — checkout steps
- `jsonfile/` — sample n8n/workflow JSON (reference only, not bundled)

---

*Last updated: system context for automation + Telegram + Drive goals.*
