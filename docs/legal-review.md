# Legal review notes

**The texts in `/imprint` and `/privacy`, the cookie modal wording and the consent flow are drafts. They are not legal advice and must be reviewed by a qualified lawyer (data protection, e-commerce and, for the US, food and supplement advertising) before launch.**

The pages carry a visible "Legal · draft" marker and a draft notice with a `[[TODO]]`, so the production build fails until you remove them after review.

## What the drafts cover

| Topic | Where |
|---|---|
| Operator identity | `OperatorInfo.astro`, used in the imprint, privacy policy and footer |
| Contact, responsibility for content, liability, trademark | `/imprint` |
| GDPR controller, purposes, legal bases, recipients | `/privacy` sections 1, 2, 3, 6, 8 |
| MailerLite as processor, double opt-in, third-country transfers | `/privacy` sections 6, 7, 9 |
| Retention, data subject rights, withdrawal of consent, supervisory authority | `/privacy` sections 10, 11 |
| Cookies and local storage | `/privacy` section 5, cookie modal |

## Open data (all marked `[[TODO: …]]`)

Register entry, VAT ID, contact email, phone or second fast contact channel, consumer dispute resolution statement, hosting provider and its data processing agreement, server log retention, current MailerLite contracting entity, whether MailerLite open and click tracking is on, the transfer mechanism in MailerLite's DPA, the competent supervisory authority and its contact details, US state privacy disclosures, date of last update. None of these were invented.

## Points to raise with your lawyer

1. **Operator change.** You plan a US LLC and to relocate. The imprint duties, the GDPR controller, the EU representative question (Art. 27 GDPR, if the controller sits outside the EU but targets EU residents) and the competent authority all depend on that. Only `OperatorInfo.astro` needs editing, but the surrounding text may change.
2. **Imprint format.** The drafts follow the German model (name, address, email, second contact channel, VAT ID and register if any). Confirm what is required in your setup.
3. **Is a cookie banner needed at all today?** The site sets no cookies and uses no analytics. The only browser storage is the consent record, which is strictly necessary. A banner is arguably not required now. It is built because you asked for the mechanism and it is ready for later tools.
4. **MailerLite.** Verify the DPA, the contracting entity, the transfer mechanism and any tracking. The browser sends the address straight to MailerLite, so MailerLite sees the visitor's IP address.
5. **Consent record.** MailerLite keeps sign-up and confirmation data. Check that it is enough to prove double opt-in.
6. **Marketing emails to US recipients (CAN-SPAM).** Commercial emails need a valid physical postal address and a working unsubscribe. Set both in MailerLite. The operator address is currently a personal address.
7. **Age gate.** "18+" rests on a checkbox in the consent line. Decide if that is enough for your risk view.
8. **Advertising claims (FTC, FDA, EU Regulation 1924/2006).** Several sentences in the design read as body, taste or ingredient-benefit claims. They are flagged with `data-copy-review` and listed in `docs/plan.md`, section 2.1. The pouch artwork also carries such text. The footer disclaimer ("These statements have not been evaluated by the Food and Drug Administration…") is a structure/function disclaimer and does not fix an unsubstantiated claim.
9. **Supplement Facts panel.** The numbers are from the design and unverified. It must match the real label. It does not match the "five ingredients" copy or the "1 to 3 a day" wording. Iodine is shown in mg and selenium has no percent value.
10. **Offer terms.** "Valid for confirmed double opt-in subscribers, while the first batch lasts, USA only" and the founding-number promise need proper terms once the offer is real.
11. **"Not available in the EU"** together with an EU-based operator and EU visitors: confirm how you handle EU sign-ups.
12. **Trademark.** The site uses ™. Registration status and the "trademark by [operator]" wording should be checked, especially after an operator change.
