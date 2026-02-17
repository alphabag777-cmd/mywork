# Agent Guide: AlphaBag Investment Hub

This repository contains the AlphaBag Investment Hub, a Web3 platform built with React, Vite, and Firebase.

## 🛠 Build & Development

### Core Commands
- **Install dependencies:** `npm i`
- **Start dev server:** `npm run dev` (Runs on http://localhost:5173)
- **Production build:** `npm run build`
- **Linting:** `npm run lint`

### Testing
- No automated test suite (Vitest/Jest) is currently configured.
- **Manual Verification:** Use `npm run dev` and verify UI changes in the browser.
- **Firebase Migration:** `npm run migrate-firebase` (copies Firestore data between environments).

---

## 🎨 Code Style & Conventions

### ⚛️ React & Components
- **Functional Components:** Use arrow functions with explicit types.
- **Naming:** `PascalCase` for files and components (e.g., `StakingCard.tsx`).
- **UI Components:** Built with `shadcn/ui` (Radix UI primitives + Tailwind).
  - Base UI components are in `src/components/ui/`.
  - Feature components are in `src/components/`.
- **Styling:** Use **Tailwind CSS** utility classes exclusively. Avoid CSS files.

### TypeScript & Types
- **Strictness:** Maintain strict typing. Avoid `any` unless absolutely necessary (e.g., legacy Firebase data mapping).
- **Interfaces:** Define interfaces for data models (see `src/lib/users.ts` for reference).
- **Hooks:** Custom hooks use `useName` convention and are stored in `src/hooks/`.

### 📂 File Structure & Imports
- **Path Aliases:** Use `@/` to refer to the `src/` directory (e.g., `import { Button } from "@/components/ui/button"`).
- **Import Order:**
  1. React/External libraries
  2. UI Components (`@/components/ui/`)
  3. Feature Components (`@/components/`)
  4. Hooks (`@/hooks/`)
  5. Libs/Utils (`@/lib/`)
  6. Styles/Types

### 💾 Data Management (Firebase)
- **Firestore:** CRUD operations reside in `src/lib/`. Each collection has a corresponding file (e.g., `users.ts`, `referrals.ts`).
- **Convention:** Use `toFirestore` and `fromFirestore` mapper functions for consistency.
- **Timestamps:** Store as numbers (ms) or Firestore `Timestamp`. Convert to numbers for UI.

### ⛓ Web3 & Blockchain (Wagmi/Viem)
- Use **Wagmi** hooks for all blockchain interactions (`useAccount`, `useReadContract`, `useWriteContract`).
- **Viem:** Use for parsing units (`parseUnits`) and formatting (`formatUnits`).
- Contract addresses and ABIs are managed in `src/lib/contract.ts`.

### 🚨 Error Handling
- **Firebase/Async:** Wrap async operations in `try-catch`.
- **UI Feedback:** Use the `sonner` toast library for user notifications (`toast.error()`, `toast.success()`).
- **Logging:** Use `console.error` with descriptive messages for failed background tasks.

### 🌐 Internationalization (i18n)
- Managed via `src/lib/i18n/`.
- Use the `useLanguage` hook to access the `t` object for translations.
- Key-value pairs are defined in `translations.ts`.

---

## 📏 Rules
- **Formatting:** ESLint is configured. Run `npm run lint` before committing.
- **Components:** Before creating a new UI component, check `src/components/ui/` to see if a primitive already exists.
- **No Direct State Mutation:** Always use React state/context or store updates correctly.
