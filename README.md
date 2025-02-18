# Saigon Rovers Basketball Club Management

## 🧑‍💻 Technology Stack

- 🚀 [Next.js](https://nextjs.org/)

  - 🧰 [Drizzle](https://orm.drizzle.team/) as the ORM for migrations and database access.
  - 🔍 [Zod](https://zod.dev/) for schema validation.
  - 💾 [Neon](https://vercel.com/marketplace/neon) for PostgresSQL database interaction.
  - 🔑 [NextAuth.js](https://next-auth.js.org/) for authentication via GitHub (OAuth).
  - 💃 Using TypeScript, hooks, [Chakra](https://chakra-ui.com/) and other parts of a modern frontend stack.

- 🔒 Secure password hashing by default.
- 🚢 [Vercel](http://vercel.com/) for deployment
- 🏭 CI/CD based on GitHub Actions.

> [!NOTE]  
> Before you begin, ensure that you have [`pnpm`](https://pnpm.io/) package manager on your system.

## Backend

Ensure that PostgresSQL (latest version) is running on your local machine, start it via Homebrew:

```bash
brew services start postgresql@17
```

View the databases directly in admin panels:

```bash
pnpm db:studio
```

Then open your browser at https://local.drizzle.studio/.

## Frontend

Install necessary npm packages:

```bash
pnpm install
```

And start the live server with the following script:

```bash
pnpm dev
```

Then open your browser at http://localhost:3000/.
