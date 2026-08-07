# Saigon Rovers Basketball Club Management

A private web portal for a basketball club: roster, training, attendance, matches, performance testing, and assets, all behind role-based access. This page covers the technology stack and how to run the app and its tests locally. For the system design see [ARCHITECTURE.md](ARCHITECTURE.md); for naming and folder conventions see [DEVELOPMENT.md](DEVELOPMENT.md).

## 🧑‍💻 Technology stack

- 🚀 [Next.js](https://nextjs.org/)
- 🧰 [Drizzle](https://orm.drizzle.team/) as the ORM for migrations and database access
- 💾 [Neon](https://vercel.com/marketplace/neon) for PostgreSQL database interaction
- 🔑 [Better Auth](https://www.better-auth.com) for authentication
- 📩 [Resend](https://resend.com/) for email confirmation
- 🗂️ [Vercel Blob](https://vercel.com/docs/vercel-blob) for file storage
- ⏰ [date-fns](https://date-fns.org/) for datetime manipulation
- PDF generation with:
  - [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation
  - [js-base64](https://www.npmjs.com/package/js-base64) for base64 encoding and decoding
- 💃 Using various parts of a modern frontend stack:
  - [Chakra UI](https://chakra-ui.com/) for component library
  - [zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/) for schema validation
  - [es-toolkit](https://es-toolkit.com/) for utility functions
  - [nuqs](https://github.com/47ng/nuqs) for filters state management
  - [SWR](https://swr.vercel.app/) for data fetching and caching
- 🧪 Testing:
  - [Vitest](https://vitest.dev/) for unit and integration tests
  - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing
  - [Axe](https://github.com/nickcolley/jest-axe) for accessibility testing
  - [Playwright](https://playwright.dev/) for end-to-end testing
- 🚢 [Vercel](http://vercel.com/) for deployment
- 🏭 CI/CD with GitHub Actions

## ✨ How to start

Install the pnpm packages:

```bash
pnpm install
```

And start the live server with the following script:

```bash
pnpm dev
```

Then open the app at [localhost:3000](http://localhost:3000/).

### 📦 Package analyzer

```bash
pnpm analyze
```

Then open the report at [localhost:4000](http://localhost:4000/).

## 🧪 Testing

Run all tests with:

```bash
pnpm test
```

To check coverage report in Vitest UI, run:

```bash
pnpm test:ui
```

Run all end-to-end tests with:

```bash
pnpm e2e
```

To open Playwright Test Runner UI, run:

```bash
pnpm e2e:ui
```

Note: run the `e2e/setup/auth.ts` project first to generate auth state for a role before running tests that require authentication.
