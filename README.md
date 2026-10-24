# BatchLens frontend — Vercel deployment

Original frontend recovered from your ChatGPT Site.

1. Extract this ZIP.
2. Create a GitHub repository named batchlens-academic-performance.
3. Upload the CONTENTS of the extracted folder. Keep src as a folder.
   package.json, index.html and vercel.json should be at repository root.
4. Visit https://vercel.com/new and connect GitHub.
5. Import the repository. Select Vite. Root directory: ./
6. Build command: npm run build. Output directory: dist.
7. Click Deploy. No environment variables are needed for this prototype.

Local development: install a current Node.js LTS, then run npm install and npm start.
Build locally with npm run build.

This is a frontend prototype. Login/account state and scores use browser storage;
batch statistics are sample values. Real authentication and a shared database
are needed before using it for actual student records. The private access gate
provided by ChatGPT Sites is not included in this export.

## Student profile and term enrollment

After login, **My profile & subjects** lists terms 3–8. Students select subjects,
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
The overview and score/performance screens remain prototypes and are not yet
connected to live student data.

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
existing database relationships; **Term subjects** preserves the term subject
and section draft/locking workflow. Profile fields are read-only.
