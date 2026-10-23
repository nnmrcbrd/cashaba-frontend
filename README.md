# Casha-Ba frontend

For the separate Docker image, Nginx and GitHub Actions workflow, see
[frontend Docker deployment](DOCKER_DEPLOYMENT.md).

The frontend is a Next.js 16 application for onboarding, wallets, transactions, obligations, debts, budgets, reports, AI assistance, settings, and administration.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Start the backend on port 8000.
4. Run `npm run dev` and open `http://localhost:3000`.

```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

## Commands

- `npm run dev` starts development mode.
- `npm run build` performs the production build and TypeScript validation.
- `npm run lint` runs ESLint.
- `npm test` runs the frontend utility tests.

Authentication keeps the access token in memory and rotates the refresh token through an HTTP-only backend cookie. The browser therefore needs the frontend and backend origins configured consistently.

See the repository-level README for architecture, financial rules, testing, and the demonstration checklist.

## Mobile and installation

For the native Android APK, Capacitor setup, and build commands, see [Android app](docs/ANDROID.md).

Run `npm run mobile` to open the built APK in an Android phone window on your laptop. Run `npm run android:run` after code changes to rebuild and open the updated app. `npm run dev` runs the website.

On phones and tablets, the user screen has a centered bottom bar with Home, Money, Planning, Intelligence, and More. Each section opens its links in a centered sheet above the bar; the admin screen uses the same sheet pattern. The app includes an installable web manifest, 192px and 512px icons, and a service worker that shows a reconnect screen when navigation fails offline. Financial account data is never cached for offline use; recording or viewing transactions still requires a connection to the API. Install from the browser's **Add to Home screen** or **Install app** action on HTTPS (or localhost during development).
