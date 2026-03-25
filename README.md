# Saigon Rovers Basketball Club Management

## 🧑‍💻 Technology Stack

- 🚀 [Next.js](https://nextjs.org/)
- 🧰 [Drizzle](https://orm.drizzle.team/) as the ORM for migrations and database access.
- 💾 [Neon](https://vercel.com/marketplace/neon) for PostgresSQL database interaction.
- 🔑 [Better Auth](https://www.better-auth.com) for authentication.
- 📩 [Resend](https://resend.com/) for email confirmation.
- ⏰ [date-fns](https://date-fns.org/) for datetime manipulation.
- 💃 Using various parts of a modern frontend stack:
  - [Chakra UI](https://chakra-ui.com/) for component library.
  - [zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/) for schema validation.
  - [nuqs](https://github.com/47ng/nuqs) for filters state management.
  - [SWR](https://swr.vercel.app/) for data fetching and caching.
- 🧪 Testing:
  - [Vitest](https://vitest.dev/) for unit and integration tests.
  - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.
  - [Axe](https://github.com/nickcolley/jest-axe) for accessibility testing.
  - [Playwright](https://playwright.dev/) for end-to-end testing.
- 🚢 [Vercel](http://vercel.com/) for deployment.
- 🏭 CI/CD with GitHub Actions.

## ✨ How to start

Install necessary pnpm packages:

```bash
pnpm install
```

And start the live server with the following script:

```bash
pnpm dev
```

Then open browser at http://localhost:3000/.

### 📦 Package Analyzer

```bash
pnpm analyze
```

Then open browser at http://localhost:4000/.

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

Notice that run `e2e/setup/auth.ts` test first to generate auth state for specific role before running other tests that require authentication.
