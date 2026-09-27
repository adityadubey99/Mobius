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
