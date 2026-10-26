# Saigon Rovers Basketball Club Management

A private web portal for a basketball club: roster, training, attendance, matches, performance testing, and assets, all behind role-based access. This page covers the technology stack and how to run the app and its tests locally.

For the system design see the [Architecture docs page](content/docs/project/architecture.mdx) (served at `/docs/project/architecture`); for naming and folder conventions see [DEVELOPMENT.md](DEVELOPMENT.md).

## 🧑‍💻 Technology stack

- 🚀 Framework: [Next.js](https://nextjs.org/)
- 🗄️ Backend:
  - [Drizzle](https://orm.drizzle.team/) as the ORM for migrations and database access
  - [Neon](https://vercel.com/marketplace/neon) for PostgreSQL database interaction
  - [Better Auth](https://www.better-auth.com) for authentication
  - [Resend](https://resend.com/) for email confirmation
  - [Vercel Blob](https://vercel.com/docs/vercel-blob) for file storage
- 💃 Frontend:
  - [Chakra UI](https://chakra-ui.com/) for component library
  - [Chakra UI Charts](https://chakra-ui.com/docs/charts/installation) with [Recharts](https://recharts.org/) for analytics charts
  - [Tiptap](https://tiptap.dev/) for the rich text editor
  - [Lucide](https://lucide.dev/) for icons
  - [zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/) for schema validation
  - [nuqs](https://github.com/47ng/nuqs) for filters state management
  - [SWR](https://swr.vercel.app/) for data fetching and caching
- 🌎 Internationalization: [next-intl](https://next-intl.dev/) for English and Vietnamese translations
- 📄 PDF generation:
  - [pdf-lib](https://pdf-lib.js.org/) and [@pdf-lib/fontkit](https://github.com/Hopding/fontkit) for PDF manipulation and custom fonts
  - [Puppeteer](https://pptr.dev/) with [@sparticuz/chromium-min](https://github.com/Sparticuz/chromium) for rendering analytics reports
  - [js-base64](https://www.npmjs.com/package/js-base64) for base64 encoding and decoding
- 🧰 Utilities:
  - [date-fns](https://date-fns.org/) for datetime manipulation
  - [es-toolkit](https://es-toolkit.com/) for utility functions
- 📚 Documentation: [Fumadocs](https://fumadocs.dev/) for the documentation site, with [Mermaid](https://mermaid.js.org/) diagrams
- 🧪 Testing:
  - [Vitest](https://vitest.dev/) for unit and integration tests
  - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing
  - [Axe](https://github.com/nickcolley/jest-axe) for accessibility testing
  - [Playwright](https://playwright.dev/) for end-to-end testing
- 🚢 Deployment:
  - [Vercel](http://vercel.com/) for hosting, with [Analytics](https://vercel.com/docs/analytics) and [Speed Insights](https://vercel.com/docs/speed-insights)
  - CI/CD with GitHub Actions

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
