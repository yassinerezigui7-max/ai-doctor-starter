# Client Onboarding Intake — internal notes

Private onboarding form for signed clients, at `/intake-setup-ai-system`.

## Formspree endpoint

- **This form:** `https://formspree.io/f/mojgalqa` (Client Onboarding Intake only)
- Do NOT reuse for other forms. The other two live forms use different IDs:
  - Diagnostic intake (homepage modal): `xjgqojpz`
  - VIP membership intake (`/vip-intake`): `mojorlez`
- Email subject is set at submit time via the hidden `_subject` field:
  `New cliniqboost client intake: {legal_name}` — interpolated in JS from the
  "Legal business name" field just before the fetch() call.
- File uploads: the form uses a **cloud-link field** (`db_csv_link`) instead of
  a file input, because Formspree's free tier does not accept file uploads.
  If the account is upgraded to a plan with file upload support, replace the
  `db_csv_link` URL input with `<input type="file" name="db_csv">` and add
  `enctype="multipart/form-data"` to the form tag.

## Privacy / routing

- **The URL is private.** It is not linked from any page, nav, footer, or
  sitemap. Share it manually with signed clients only.
- Page carries `<meta name="robots" content="noindex, nofollow">`.
- There is intentionally **no robots.txt** in this site. Do not add a
  `Disallow:` line for this path — robots.txt is publicly readable and would
  reveal the private URL. The noindex meta tag is the correct mechanism.
- Clean URL via `_redirects`: `/intake-setup-ai-system → /intake-setup-ai-system.html 200`

## Field names (as they arrive in the Formspree email)

**Section 1 — Clinic Basics:** `legal_name`*, `dba_name`, `contact_name_role`*,
`contact_email`*, `contact_mobile`*, `clinic_phone`*, `addr_street`*,
`addr_city`*, `addr_region`*, `addr_country`*, `addr_postal`*, `timezone`*,
`hours_{mon..sun}_open`, `hours_{mon..sun}_close`, `hours_{mon..sun}_closed`,
`quiet_start` (default 21:00), `quiet_end` (default 08:00)

**Section 2 — Services & Positioning:** `services_list`*, `hero_service`*,
`booking_link`*, `sms_voice`*, `banned_phrases`

**Section 3 — Software & Integrations:** `booking_software`*, `sms_provider`,
`meta_access`*, `google_access`*, `runs_ads`, `ad_spend`

**Section 4 — Patient Database:** `db_size`, `csv_export`*, `db_csv_link`

**Section 5 — Compliance:** `consent_sms`* (checkbox, submits "Confirmed"),
`msa_signed`* (checkbox, submits "Confirmed")

**Section 6:** `extra_notes`

Hidden: `form_type` = "Client Onboarding Intake", `_subject` (see above).
(* = required, enforced client-side)

## Updating the legal checkbox text

If the Master Services Agreement is revised, edit the two `.setup-check`
labels in Section 5 of `intake-setup-ai-system.html` (search for
"Section 4.2"). Keep the MSA section reference in sync with the actual
agreement. The checkbox `value` stays "Confirmed" — only the visible
label text changes.

## Draft autosave

Answers autosave to localStorage under `cliniqboost_client_onboarding_v1`
on every change, restore on page load, and clear on successful submission.
