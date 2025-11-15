# Saigon Rovers Basketball Club Management

## 🧑‍💻 Technology Stack

- 🚀 [Next.js](https://nextjs.org/)

  - 🧰 [Drizzle](https://orm.drizzle.team/) as the ORM for migrations and database access.
  - 🔍 [Zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/) for schema validation.
  - 💾 [Neon](https://vercel.com/marketplace/neon) for PostgresSQL database interaction.
  - 🔑 Authentication with [Better Auth](https://www.better-auth.com).
  - 📩 [Resend](https://resend.com/) for email confirmation.
  - 🌊 [Winston](https://github.com/winstonjs/winston) for server logging.
  - ⏰ [date-fns](https://date-fns.org/) for datetime manipulation.
  - 💃 Using various parts of a modern frontend stack:
    - [Charkra UI](https://chakra-ui.com/) for component library.
    - [React Hook Form](https://react-hook-form.com/) for form handling.
    - [nuqs](https://github.com/47ng/nuqs) for filters state management.

- 🔒 Secure password hashing by default.
- 🚢 [Vercel](http://vercel.com/) for deployment.
- 🏭 CI/CD based on GitHub Actions.

## Backend

Ensure that PostgresSQL (latest version) is running on your local machine, start it via Homebrew:

```bash
brew services start postgresql@18
```

Generate schema with name

```bash
pnpm run db:generate --name=<schema_name>
```

Then migrate the database:

```bash
pnpm run db:migrate
```

View the databases directly in admin panels:

```bash
pnpm db:studio
```

Then open your browser at https://local.drizzle.studio/.

## Frontend

Install necessary pnpm packages:

```bash
pnpm install
```

And start the live server with the following script:

```bash
pnpm dev
```

Then open your browser at http://localhost:3000/.

---

Update with refresh cause errors

- Unexpected Fiber popped.
- Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported.
