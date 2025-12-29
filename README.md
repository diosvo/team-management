# Saigon Rovers Basketball Club Management

## 🧑‍💻 Technology Stack

- 🚀 [Next.js](https://nextjs.org/)
- 🧰 [Drizzle](https://orm.drizzle.team/) as the ORM for migrations and database access.
- 🔍 [zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/) for schema validation.
- 💾 [Neon](https://vercel.com/marketplace/neon) for PostgresSQL database interaction.
- 🔑 [Better Auth](https://www.better-auth.com) for authentication.
- 📩 [Resend](https://resend.com/) for email confirmation.
- 🌊 [Winston](https://github.com/winstonjs/winston) for server logging.
- ⏰ [date-fns](https://date-fns.org/) for datetime manipulation.
- 💃 Using various parts of a modern frontend stack:
  - [Chakra UI](https://chakra-ui.com/) for component library.
  - [nuqs](https://github.com/47ng/nuqs) for filters state management.
- 🧪 Testing:
  - [Vitest](https://vitest.dev/) for unit and integration tests.
  - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.
  - [Axe](https://github.com/nickcolley/jest-axe) for accessibility testing.
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
