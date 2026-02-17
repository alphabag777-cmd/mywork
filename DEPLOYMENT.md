# Deployment Guide

This project is built with React + Vite + Firebase and is ready for deployment on platforms like Netlify, Vercel, or Firebase Hosting.

## 1. Build Output
The production build is output to the `dist` folder.
- Run `npm run build` to generate the production files.
- The `dist` folder contains everything needed to serve the application.

## 2. Environment Variables
You MUST set these environment variables in your deployment platform settings (Netlify, Vercel, etc.). Do not commit `.env` files with real keys to public repositories.

| Variable Name | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Your Firebase Project API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID (optional) |

## 3. Netlify Deployment (Recommended for SPAs)
Since this is a Single Page Application (SPA) using React Router, we need to handle client-side routing.
A `public/_redirects` file has been created to redirect all traffic to `/index.html`:
```
/* /index.html 200
```
This file will be automatically included in the `dist` folder during build.

### Steps to Deploy to Netlify:
1.  Push your code to GitHub/GitLab.
2.  Log in to Netlify and click "New site from Git".
3.  Select your repository.
4.  **Build Command:** `npm run build`
5.  **Publish Directory:** `dist`
6.  **Environment Variables:** Add the variables listed above in "Site settings > Build & deploy > Environment".
7.  Click "Deploy site".

## 4. Vercel Deployment
Vercel handles most SPA routing automatically, but you can add a `vercel.json` if needed.
1.  Import project from Git.
2.  Set Build Command: `npm run build`
3.  Set Output Directory: `dist`
4.  Add Environment Variables in Project Settings.

## 5. Firebase Hosting
If you prefer Firebase Hosting:
1.  Install Firebase CLI: `npm install -g firebase-tools`
2.  Login: `firebase login`
3.  Initialize: `firebase init` (Select Hosting)
4.  Public directory: `dist`
5.  Configure as single-page app: Yes
6.  Deploy: `npm run build && firebase deploy`
