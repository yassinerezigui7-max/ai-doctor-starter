# Connecting the order form to Google Sheets

Orders travel: **browser → `/api/order` (this app) → Apps Script Web App → your sheet**.
The browser never sees the Apps Script URL, so there are no CORS problems and the
endpoint cannot be scraped from the page source.

Until you finish these steps the site still works: with `NEXT_PUBLIC_ORDER_ENDPOINT`
empty the form runs in **mock mode** (simulated 900 ms request, always succeeds,
payload logged to the browser console).

---

## Steps

1. **Create the spreadsheet.** Go to <https://sheets.new>, name it something like
   `Commandes Casquette`. Leave it empty — the script creates and formats the
   `Orders` tab on the first order.

2. **Open the script editor.** In that sheet: **Extensions ▸ Apps Script**.
   A project opens with an empty `Code.gs`.

3. **Paste the code.** Delete everything in `Code.gs`, then paste the entire
   contents of [`apps-script/Code.gs`](apps-script/Code.gs) from this repo.

4. **Set your token.** On line 2, replace `CHANGE_ME` with a long random string —
   this is the shared secret that stops strangers writing to your sheet:

   ```javascript
   const TOKEN = 'k7Rt-92xQm-vB4nL-p8Zw';   // yours, not this one
   ```

   Save (**Ctrl/Cmd + S**).

5. **Deploy as a Web app.** Click **Deploy ▸ New deployment**, then:
   - press the gear next to *Select type* and choose **Web app**
   - *Description*: `Casquette orders v1`
   - **Execute as: Me** (your account owns the write)
   - **Who has access: Anyone** ← required; "Anyone with Google account" will fail,
     because our server calls it without signing in. Your token is what protects it.
   - **Deploy**, then **Authorize access** and accept the Google warning screen
     ("unverified app" → *Advanced* → *Go to …*). This is your own script.

6. **Copy the Web app URL.** It ends in `/exec`, like
   `https://script.google.com/macros/s/AKfy…long…/exec`.
   The `/dev` URL will **not** work — it requires a login.

7. **Put both values in `.env.local`** at the project root (copy `.env.example`
   if you haven't yet):

   ```bash
   NEXT_PUBLIC_ORDER_ENDPOINT=/api/order
   ORDER_ENDPOINT=https://script.google.com/macros/s/AKfy…/exec
   ORDER_TOKEN=k7Rt-92xQm-vB4nL-p8Zw
   ```

   `ORDER_TOKEN` must match line 2 of `Code.gs` exactly.
   Restart `npm run dev` — env vars are only read at startup.
   On your host (Vercel, etc.) add the same three variables in the dashboard.

8. **Send a test order.** Open the site, fill the form, submit. You should see the
   success modal with an order number like `CAP-260804-A2B3C4`.

9. **Verify the row.** Back in the sheet, the `Orders` tab now has a bold frozen
   header and one row, in this exact column order:

   | Timestamp | Order ID | Name | Phone | Wilaya | Commune | Color | Quantity | Delivery Type | Shipping Price | Total | Status |
   |---|---|---|---|---|---|---|---|---|---|---|---|
   | 2026-08-04T14:22:07+01:00 | CAP-260804-A2B3C4 | Yacine Benali | 0550123456 | 16 — Alger | Hydra | blue | 1 | home | 400 | 2900 | New |

   Check the phone kept its leading zero (`0550123456`, not `550123456`).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Every order fails; server log shows `HTTP 401`, `content-type: text/html`, and a GET on the `/exec` URL redirects to `accounts.google.com/signin` | **"Who has access" is not `Anyone`.** Google demands a login before it will run the script, and the server calls it anonymously. This is the single most common cause. | Apps Script ▸ **Deploy ▸ Manage deployments ▸ ✏️ Edit ▸ Who has access: `Anyone`** ▸ Deploy. Not "Anyone with a Google account" — that also fails. |
| Error modal on every order; server logs `upstream` | Token mismatch — the script returned `unauthorized` | `ORDER_TOKEN` in `.env.local` must be character-for-character identical to `TOKEN` in `Code.gs`. Restart the dev server after editing. |
| Phone shows as `550123456` (leading zero gone) | The leading apostrophe in `appendRow` was removed, so Sheets parsed it as a number | Restore `"'" + body.phone` in `Code.gs`, then redeploy. Existing rows: format the column as *Plain text* and retype. |
| Nothing appears in the sheet at all | You edited the script but did not redeploy — each version gets a **new** `/exec` URL | **Deploy ▸ Manage deployments ▸ ✏️ Edit ▸ Version: New version ▸ Deploy**, then update `ORDER_ENDPOINT` if the URL changed. |
| Orders work locally but not in production | Env vars only exist on your machine | Add all three variables in your host's dashboard and redeploy. |
| `Who has access` reset to restricted | Google sometimes resets this on redeploy | Re-check it is **Anyone** in Manage deployments. |
| Two rows for one order | Shouldn't happen — the script skips duplicate Order IDs | Confirm you didn't remove the `ids.indexOf(body.orderId)` guard. |
| 429 in the browser console | The app's own rate limit: 5 orders per 10 min per IP | Normal protection. Wait, or raise `MAX_PER_WINDOW` in `src/app/api/order/route.ts`. |

## Notes

- **Duplicates are impossible by design.** The order ID is generated once per form
  session and reused across retries; the script refuses to append an ID it already
  has. A customer mashing the button, or a queued order sending twice, still yields
  exactly one row.
- **Money is computed on the server**, never trusted from the browser. Editing
  prices in devtools changes nothing that reaches your sheet.
- **Failed orders are not lost.** If the network dies mid-submit, the order is
  queued in the customer's browser and sent automatically when they come back
  online.
