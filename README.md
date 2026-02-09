# AlphaBag Investment Hub

## Project Overview

An investment platform for USDT tokens where users can invest their tokens and earn rewards with flexible investment options.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Build the project for production:

```sh
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## Migrating Firebase data to another project

To copy all Firestore data from one Firebase project to another:

1. **Create the destination project** in [Firebase Console](https://console.firebase.google.com) and enable Firestore.
2. **Set the destination config** in `scripts/migrate-firebase.mjs`: edit `DEST_CONFIG` with your new project’s config (Project Settings → Your apps → SDK setup). Optionally use env vars: `FIREBASE_SOURCE_CONFIG` and `FIREBASE_DEST_CONFIG` (JSON strings).
3. **Run the migration** from the project root:
   ```sh
   npm run migrate-firebase
   # or: node scripts/migrate-firebase.mjs
   ```

The script copies every document in these collections (same names in the destination): `users`, `user_investments`, `investment_plans`, `user_stakes`, `staking_plans`, `userReferralCodes`, `sbag_positions`, `sell_delegations`, `nodePurchases`, `referrals`, `nodes`, `referral_activities`, `notices`, `ad_images`, `user_performance_overrides`. Document IDs are preserved. After migration, point the app at the new project by updating `src/lib/firebase.ts` with the new config.
