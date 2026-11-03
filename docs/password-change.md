# Student password change

## Proposed student flow

1. Sign in with the existing college email and current password.
2. Students without the password-change onboarding marker land on My profile & subjects → Password. This reminder is advisory; the normal navigation remains available.
3. Enter Current password, New password (at least eight characters), and Confirm new password. Eye buttons reveal only typed input. The current-password field starts empty with a masked placeholder; an existing password cannot be retrieved from Supabase. Click Change password beside it to reveal the new-password and confirmation fields, then Save new password.
4. Change password validates the fields, verifies the current password against the signed-in account's email, then calls Supabase Auth `updateUser` for that account.
5. After success, typed inputs are cleared and Back to profile details returns to the normal workspace. The new password is used for subsequent sign-ins.
6. The Password tab remains beside Profile details and Term & Subjects for future use. There is no separate sidebar password page.

## Scope and security

- Uses existing student Auth accounts and the existing public Supabase client; no admin API key, schema migration, or RLS change.
- Does not embed the shared password or write passwords into localStorage, profile tables, logs, analytics, or metadata.
- Verifies the current account with `getUser`, reauthenticates using its server-returned email, checks identity, and sends the new/current password directly to Supabase Auth. The reauthentication refreshes the login before the update.
- The `mobius_password_changed_at` user-metadata field is a cosmetic onboarding marker only. It grants no access and is not used by RLS or authorization. Existing metadata is retained by Supabase's metadata merge.
- Server password policies and Auth errors are respected. Wrong current password, a mismatch, a reused password, a signed-out session, an identity mismatch, and update failures never show success.
- No student credentials are changed by this release. Each student submits their own choice in the app.
- Password recovery by email is a separate flow; the existing login page's recovery link is outside this change.

## Files

- `src/password-service.js`: validation, current-password verification, account identity checks, and Auth update.
- `src/password-settings.js`: signed-in form, accessible field labels/toggles, errors, busy state and success view.
- `src/app.js`: initial profile-tab selection and onboarding state. `src/enrollment.js` adds the third tab and three-tab keyboard navigation.
- `src/styles.css`: form, eye buttons and mobile layout.
- `tests/password-service.test.mjs`, `tests/password-preview.html`, `tests/password-sizes.html`: automated and browser fixtures.

## Validation

- 19 automated tests pass (8 password tests and 11 existing score-entry tests).
- Production build passes.
- Browser checks with mocked Auth cover profile and subject tabs, three-tab keyboard navigation, expanding the password editor, success, and returning to Profile details. Earlier form checks covered mismatch, incorrect current password and cleared inputs.
- A real student password has not been changed as part of testing. The live Auth update and new-password sign-in should be checked by the account holder after release.
