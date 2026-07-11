# Testing notes

## Client Onboarding Intake (`/intake-setup-ai-system`)

### Test locally

1. Serve the `cliniqboost/` folder (any static server) and open
   `http://localhost:5173/intake-setup-ai-system.html`.
2. Check the sticky progress bar reads "Section 1 of 6" and advances as you
   scroll down through the six cards.
3. Type into a few fields, close the tab, reopen — values must be restored
   (localStorage key `cliniqboost_client_onboarding_v1`).
4. Click Submit with the form empty — the page must scroll to the first
   invalid field and show yellow inline warnings (never red, never alert()).
5. Business hours: ticking "Closed" on a day must disable its two time
   inputs; a day with neither times nor "Closed" must block submission.
6. Tick both compliance checkboxes, fill all required fields, submit.
7. Test mobile: narrow the window under 768px — fields stack to one column,
   no horizontal scroll.

### Verify Formspree delivery

1. Fill the form with a recognizable test value, e.g. legal name
   "TEST — DELETE ME", and submit on the live site (Formspree may block
   localhost submissions depending on form settings).
2. The success screen must show the clinic name you typed.
3. Check the inbox connected to Formspree form `mojgalqa` for an email with
   subject `New cliniqboost client intake: TEST — DELETE ME`.
4. Confirm every section's fields appear in the email body, and that
   `consent_sms` and `msa_signed` both read "Confirmed".
5. Delete the test submission in the Formspree dashboard afterwards to keep
   submission counts clean (free tier has a monthly cap).
