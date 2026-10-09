# BSRverifier — setup and deployment guide

A Next.js 16 / TypeScript / MongoDB application for certificate record lookup. The downloadable project contains every required source file. It is a working starter and is labelled a prototype; it is not connected to existing government education databases.

## 1. What the app does

- `/`: home page, Food Basket of the Nation concept image, and a **Verify my certificate** button opening a dialog.
- `/login`: administrator login. On a domain such as `https://bsrverifier.vercel.app`, the full address is `https://bsrverifier.vercel.app/login`.
- `/admin`: protected dashboard to enter and update records, search by certificate number, and view records 20 at a time.
- Public lookup requires only a certificate number. It shows candidate name, exam number, exam center, date of birth, verification status, exam date and certificate issue date. Certificate type and institution are included so records from different educational levels are distinguishable.
- A found record may be **Verified** or **Not verified**. The status is explicitly selected by the admin; finding a record does not automatically verify it.
- The starter supports manual entry, not CSV/Excel bulk import or certificate scan upload.

## 2. Tools to install

Install Node.js 22 or 24 LTS, VS Code and Git. Check in a new VS Code PowerShell terminal:

```powershell
node --version
npm --version
git --version
```

Next.js requires Node.js 20.9 or newer. Node 22/24 is preferable for this project.

### Fast path: use the completed project

Extract `BSRverifier-project.zip`. Open the inner `bsrverifier` folder in VS Code. This folder must directly contain `package.json`, `app`, `lib`, and `components`.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Continue with step 3. The lockfile preserves the dependency versions used during validation.

### Learn how to create the Next.js project yourself

If starting from a blank folder, run:

```powershell
npx create-next-app@latest bsrverifier --typescript --eslint --app --no-tailwind --no-src-dir --import-alias "@/*" --use-npm
cd bsrverifier
npm install mongoose bcryptjs jose zod dotenv
npm install -D tsx
```

Choose **No** to React Compiler if asked. Copy the `app`, `components`, `lib`, `scripts`, `public` folders and configuration files from the provided project over the generated starter, replacing its demo `app` files. Use the provided `package.json` and `package-lock.json`, then run `npm ci`. Do not mix the scaffold's demo CSS/page with this project's files. Creating a separate scaffold is optional; the ZIP is already a complete Next.js project.

## 3. Create MongoDB Atlas database

1. Open https://www.mongodb.com/cloud/atlas and sign in.
2. Create a project named `BSRverifier` and a cluster appropriate to your needs.
3. Under **Database Access**, create a database user, separate from your Atlas account. Grant `readWrite` for database `bsrverifier`.
4. Under **Network Access**, allow your current public IP for local development.
5. Select the cluster's **Connect → Drivers → Node.js** option. Copy its `mongodb+srv://...` connection string.
6. Replace the username/password placeholders and set the database name after the hostname to `bsrverifier`:

```dotenv
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/bsrverifier?retryWrites=true&w=majority
```

If your password contains reserved URL characters, URL-encode the password portion. Never paste the real database URI into chat or commit it to GitHub. Atlas will create the database and collections on first use.

For Vercel, Atlas must allow the deployment's outbound connections. Use a fixed-egress/network integration if available. Standard serverless deployments can have changing outbound IPs; Atlas `0.0.0.0/0` allows any source IP and therefore broadens access. Use that only deliberately, with strong database credentials and least privilege, rather than assuming your laptop IP will work in production.

## 4. Configure `.env.local`

Edit the `.env.local` file copied from `.env.example`:

```dotenv
MONGODB_URI=your-real-atlas-uri
SESSION_SECRET=your-generated-random-secret
APP_URL=http://localhost:3000
SUPER_ADMIN_NAME=Your Admin Name
SUPER_ADMIN_EMAIL=your-admin-email@example.com
SUPER_ADMIN_PASSWORD=your-strong-private-password
```

Generate a session secret in the VS Code terminal:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output into `SESSION_SECRET`. Use a unique admin password of at least 12 characters (up to 128). These values are server-only; do not add `NEXT_PUBLIC_` prefixes.

`APP_URL` must match the origin you open in the browser. If you use `http://127.0.0.1:3000`, update it accordingly. Restart the dev server after changing environment variables.

## 5. Create the super admin

```powershell
npm run create-super-admin
```

The script connects to Atlas, creates indexes, hashes the password with bcrypt, and creates a superadmin account. It refuses to overwrite an existing admin. Running it locally against the production Atlas URI creates the account that the deployed app can use too.

Remove `SUPER_ADMIN_PASSWORD` from `.env.local` after successful creation. Keep the password in your password manager. The app itself only needs `MONGODB_URI`, `SESSION_SECRET`, and `APP_URL`; the other settings are for this one-time script. There is no public signup or default admin password.

To revoke all sessions for an account in an operational incident, increase its `sessionVersion` in MongoDB. Setting `active` to false disables access. Signing out also increments `sessionVersion`, ending that account's other active sessions.

## 6. Run locally

```powershell
npm run dev
```

Open http://localhost:3000. Visit http://localhost:3000/login and sign in.

Enter a synthetic test record first:

| Field               | Example                          |
| ------------------- | -------------------------------- |
| Certificate number  | BSR-2026-001234                  |
| Candidate name      | Demo Candidate                   |
| Institution         | Demo Primary School              |
| Exam number         | DEMO-001                         |
| Exam center         | Demo Exam Center                 |
| Date of birth       | 2005-02-14                       |
| Date of exam        | 2025-06-20                       |
| Date issued         | 2025-09-10                       |
| Certificate type    | First School Leaving Certificate |
| Is result verified? | Yes                              |

Save it, return to `/`, select **Verify my certificate**, and enter `BSR-2026-001234`. The matching record should appear. Certificate numbers are normalized to uppercase and are unique; use 6–64 letters, digits, slashes or hyphens.

## 7. Check before deployment

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

Then test the complete flow against your database:

1. `/admin` redirects to `/login` when signed out.
2. Incorrect passwords fail; correct credentials open the dashboard.
3. A record can be created and a duplicate number is rejected.
4. Lookup works with both uppercase and lowercase input.
5. **No** displays **Not verified**, even though a record exists.
6. Edit the record to **Yes**, and check that public lookup reflects it.
7. Unknown numbers show **No record found**, without claiming a certificate is fake.
8. Invalid dates and reversed date chronology are rejected.
9. Signing out prevents access to `/admin` and protected API routes.
10. Test the home page, dialog and dashboard on a phone.

Build/type checks do not establish that an Atlas account is configured correctly. Until you supply Atlas credentials, end-to-end database login and record persistence remain untested.

## 8. Push to GitHub

On https://github.com, create an empty **private** repository named `bsrverifier`. Do not initialize it with another README.

In the project terminal:

```powershell
git init
git add .
git status
```

Confirm `.env.local` is not listed. Then:

```powershell
git commit -m "Build BSRverifier certificate verification app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bsrverifier.git
git push -u origin main
```

Replace `YOUR_USERNAME`. Complete GitHub's normal authentication prompt. If Git asks for author information, set your own name and email with `git config user.name` and `git config user.email`, then retry the commit. If `origin` already exists, inspect it with `git remote -v` and use `git remote set-url origin ...` to correct it.

## 9. Deploy on Vercel

1. Open https://vercel.com and sign in with GitHub.
2. Select **Add New → Project**, import `bsrverifier`, and choose **Next.js**.
3. The root directory must be the folder containing `package.json`. If you pushed the outer folder, set root to `bsrverifier`.
4. Add these server-side environment variables before deploying:

| Variable         | Production value                                               |
| ---------------- | -------------------------------------------------------------- |
| `MONGODB_URI`    | Your production Atlas connection string                        |
| `SESSION_SECRET` | A strong random secret, at least 32 characters                 |
| `APP_URL`        | The exact public origin, e.g. `https://bsrverifier.vercel.app` |

5. Ensure Atlas network access permits Vercel connections.
6. Select **Deploy**. If Vercel assigns a different project URL, update `APP_URL` to that actual URL and **redeploy**.
7. Open the deployed URL and test `/login`, adding/editing a synthetic record and public lookup.

Do not add `SUPER_ADMIN_PASSWORD` to Vercel. Create the account with the local script connected to the same production database.

Configure Preview environments separately with a preview database, a different secret and their matching `APP_URL`. A preview URL whose origin differs from `APP_URL` will intentionally reject login and lookup POST requests. Production aliases/custom domains likewise require an intentional canonical origin; redirect alternate domains to that origin.

Future updates:

```powershell
git add .
git commit -m "Describe the change"
git push
```

Vercel's GitHub integration builds deployments from repository updates. Changing environment variables requires a new deployment.

## 10. File map and how it works

| Location                                         | Purpose                                              |
| ------------------------------------------------ | ---------------------------------------------------- |
| `app/page.tsx`                                   | Public homepage                                      |
| `public/food-basket.png`                         | Generated agricultural hero concept                  |
| `components/Verifier.tsx`                        | Lookup dialog, error states and candidate details    |
| `app/login/page.tsx`, `components/Login.tsx`     | Login page and form                                  |
| `app/admin/page.tsx`, `components/Dashboard.tsx` | Protected dashboard and record editor                |
| `lib/db.ts`                                      | Reuses MongoDB connection between requests           |
| `lib/models.ts`                                  | Admin, certificate and rate-limit schemas            |
| `lib/auth.ts`                                    | Signed 8-hour session and active-admin check         |
| `lib/validation.ts`                              | Record validation and public field allowlist         |
| `lib/http.ts`                                    | Same-origin requests and database-backed rate limits |
| `app/api/verify/route.ts`                        | Public exact-number lookup                           |
| `app/api/auth/*/route.ts`                        | Sign in and sign out                                 |
| `app/api/admin/certificates/route.ts`            | Protected list/create APIs                           |
| `app/api/admin/certificates/[id]/route.ts`       | Protected update API                                 |
| `scripts/create-super-admin.ts`                  | One-time admin creation and index setup              |

The verifier does not query school systems. It matches the number against MongoDB and reports the saved administrator decision. Names and dates cannot be trusted unless records are sourced from the issuing institutions.

## 11. Deployment scope and student information

This starter implements the requested public display of date of birth and other candidate details. Anyone who knows a certificate number can see those details. Use synthetic records during development; before live use, establish the issuing authority's approval for branding, record access and public disclosure. Consider displaying less personal data if the intended verification purpose does not require it.

Rate limiting reduces repeated attempts, but a certificate number is not a password. Use non-sequential, difficult-to-guess certificate numbers where possible. Production government use should add operational backups, monitoring, MFA, admin recovery and a durable change audit trail. This starter records creator/updater IDs and timestamps but does not keep a full historical audit log.

The hero image is an AI-generated agricultural concept, not a verified photograph of the Benue Food Basket monument. Replace `public/food-basket.png` with an approved image when available. Update its alt text and caption if it becomes an actual landmark photo. Prompt used: “Conceptual representation of Food Basket of the Nation: woven basket of yams, cassava, maize, oranges and fresh produce before lush farmland in warm morning light; landscape natural photography; no text, logos, seals or people.” Created with the built-in ImageGen tool.

## 12. Troubleshooting

- **Request origin is not allowed:** match `APP_URL` to the browser origin and restart/redeploy.
- **Unable to sign in / verification unavailable:** check MongoDB URI, encoded password, Atlas network rules, cluster availability and `SESSION_SECRET` in server logs/configuration. Client errors intentionally do not expose database credentials.
- **Page loads but database features fail on Vercel:** your laptop IP allowlist does not permit Vercel's connections.
- **Too many attempts:** login IP limits are 20 requests/15 minutes and account limits 8/15 minutes; public lookup is 30 requests/10 minutes. Local development shares a single IP bucket. Wait for the next window; do not disable rate limits in production.
- **Date validation:** dates must be real, not in the future, and birth ≤ exam ≤ issue.
- **Admin already exists:** the creation script does not reset passwords. Use an explicit, separately reviewed account recovery procedure.

Official references: https://nextjs.org/docs/app/getting-started/installation · https://www.mongodb.com/docs/atlas/connect-to-database-deployment/ · https://vercel.com/docs/git/vercel-for-github · https://vercel.com/docs/environment-variables/managing-environment-variables

## Validation performed on the supplied project

Production build, ESLint and TypeScript checks passed. Five validation/session tests passed. Eight HTTP smoke checks passed for home/login responses, admin redirect, unauthorized list/create/update requests, and rejected foreign-origin lookup/login requests. Production npm audit reported zero vulnerabilities at build time. Automated browser visual checks could not run because a browser binary was unavailable. Atlas-backed login, persistence, duplicate enforcement and rate-limit behavior require your real database configuration and remain to be tested.
