# Expy

Expy is a personal finance and expense tracking frontend application built with React, Vite, TypeScript, and Tailwind CSS. It provides a mobile-first interface for tracking balances, expenses, savings, accounts, custom wallets, subscriptions, and user preferences.

The current project is an advanced frontend prototype. Data is stored locally in the browser through `localStorage`, and some administrative workflows use frontend mock data. A production backend, database, secured authentication service, and payment gateway integration are not yet included in this repository.

## Features

- Local login, signup, onboarding, and account recovery flows
- Dashboard with balance cards, spending summaries, budget indicators, warnings, charts, and recent expenses
- Transaction history with search and filters
- Savings management with lock/unlock behavior and wishlist tracking
- Account management with account types, card themes, credit card fields, subscriptions, and transfers
- Custom wallet management for separate purpose-based balances
- Premium plan interface with mock payment submission and review workflow
- Contact form and mock support inbox
- Settings for appearance, dark mode, accent color, currency, budgets, notifications, categories, profile, and account controls
- Mobile-first layout with reusable UI components, drawers, dialogs, alerts, and toast feedback

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Radix UI primitives
- Lucide React icons
- Motion animations
- Recharts
- Sonner toast notifications

## Project Structure

```text
src/
  app/
    App.tsx
    components/
    utils/
  styles/
```

- `src/app/App.tsx` contains the main application state, tab navigation, onboarding flow, and screen switching.
- `src/app/components` contains feature screens and reusable UI components.
- `src/app/utils` contains local data handling, finance calculations, currency helpers, mock server utilities, notifications, premium logic, and theme helpers.
- `src/styles` contains the Tailwind entry file, theme variables, and global component classes.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your local values as needed:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_ENABLE_DEMO_ACCOUNT=false
VITE_DEMO_PASSWORD=
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID used by the frontend Google sign-in flow. |
| `VITE_ENABLE_DEMO_ACCOUNT` | Enables local demo account creation during development when set to `true`. |
| `VITE_DEMO_PASSWORD` | Password used for the local demo account when demo account creation is enabled. |

Only variables prefixed with `VITE_` are exposed to the frontend bundle. Do not place private secrets, client secrets, database URLs, service role keys, or payment secret keys in Vite environment variables.

## Security Notes

- `.env` is ignored and should not be committed.
- Google OAuth client IDs are public-facing identifiers, but they are still configured through environment variables to avoid hardcoding project-specific values.
- Google client secret JSON files must not be committed.
- Demo account seeding is development-only and opt-in.
- Mock admin tools are disabled in production builds.
- The current authentication and persistence model is frontend-only and should not be treated as production security.

## Current Limitations

- No backend API is currently included.
- No database persistence is currently included.
- Authentication is handled locally in the browser.
- Premium payment and admin review flows are mock frontend workflows.
- Automated tests are not yet configured.

## Scripts

```bash
npm run dev
npm run build
```
