# Mobius — student academic workspace

Vite frontend deployed from this repository to the existing Vercel project.
Production: https://mobius-pi.vercel.app/

Use Node.js 22 or newer. Run `npm ci`, then `npm start` for local development.
Build with `npm run build`; Vercel serves `dist/`.
Run service checks with `node --test tests/quiz-service.test.mjs`.

## Student profile and term enrollment

After login, **My profile & subjects** lists published terms 1–8. For Terms 3–8, students select subjects,
choose a configured section for each one, save a draft, then review and lock the
term. Locked choices are read-only to students; admins correct them in Supabase.
Terms 1–2 inherit the approved student profile's home section.

For real student login and enrollment, set these build-time environment variables
in your Vercel project and redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (a publishable client key, never a secret/service key)

The matching term-enrollment migration has already been applied to the connected
Mobius database. The college roster, terms, subjects and their sections must be
loaded before students can use the real enrollment form. Email OTP registration
remains pending SMTP setup; existing approved accounts can use password login.
The live overview links to Operations Research Quiz 1 entry. Live score and
performance navigation uses the Supabase-backed Quiz 1 screen described below.
The explicit demo workspace retains sample data.

Without environment variables, student login reports setup is pending. The
explicit **Use demo student account** button opens a browser-local demonstration
with clearly labelled example subjects. Its saved choices and locks are demo
state, not the database's access controls.

## Registration and profile details

Registration collects full name, college email ID (@iimu.ac.in), roll number,
programme, batch, and home section (used for Terms 1–2). The initial available
batch is MBA 2026–28; other programmes show no available batches until configured.
The form remains a verification-setup placeholder and does not create accounts
or persist registration submissions. OTP/password setup remains separate work.

My profile & subjects contains two accessible tabs: **Profile details** displays
the six approved profile fields, including programme and batch read through
existing database relationships; **Term & Subjects** displays core subjects and preserves the Term 3–8 subject
and section draft/locking workflow. Profile fields are read-only.

## Operations Research Quiz 1

Approved, authenticated students can open **Submit scores**, or use
**Profile & Subjects → Term & Subjects → Term 2 → Enter Operations Research
Quiz 1 marks**. This release supports that quiz only.

The form resolves the student's batch, Term 2, subject code `OR`, and assessment
comparison key `quiz_1`. It reads the maximum and weight from Supabase (currently
15 marks and 15%). Blank values remain unsubmitted; zero is valid. Scores may
be corrected with Update marks. Repeat submissions upsert the existing enrollment
and assessment pair, rather than creating duplicate scores.

Existing Supabase row-level policies restrict score reads and writes to the
student's own enrollment. Database triggers validate the subject, score range
and any submission deadline. No schema migration is needed for this release.

Comparisons use the existing `get_my_performance` RPC after the student submits
their own Quiz 1 score. Rank and percentile require at least five submissions
per comparison cohort. Missing marks are excluded. Percentile counts results at or below the student's
score, so all students tied for highest receive 100. Tied students display
Joint rank; competition ranks skip tied positions (1, 1, 3). Cross-
section comparisons use raw scores without normalization.

All 71 Section C roster students are enrolled in this subject. Enrollment alone
does not activate a login: each student still needs a linked approved Supabase
Auth account. This change does not create accounts or insert student marks.

`tests/quiz-preview.html` is an isolated browser fixture with mocked data; it
never writes to Supabase and is not included in the production Vite build.
