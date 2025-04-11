# Saigon Rovers Basketball Club Management

## 🧑‍💻 Technology Stack

- 🚀 [Next.js](https://nextjs.org/)

  - 🧰 [Drizzle](https://orm.drizzle.team/) as the ORM for migrations and database access.
  - 🔍 [Zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/) for schema validation.
  - 💾 [Neon](https://vercel.com/marketplace/neon) for PostgresSQL database interaction.
  - 🔑 Authentication using email/password with [Jose](https://www.npmjs.com/package/jose) stateless session.
  - 📩 [Resend](https://resend.com/) for email confirmation.
  - 🌊 [Winston](https://github.com/winstonjs/winston) for server logging.
  - 💃 Using TypeScript, hooks, [Chakra](https://chakra-ui.com/) and other parts of a modern frontend stack.

- 🔒 Secure password hashing by default.
- 🚢 [Vercel](http://vercel.com/) for deployment.
- 🏭 CI/CD based on GitHub Actions.

## Folder structure

```
.
├── public
└── src
    ├── app
    │   ├── (auth)      # Authentication-related routes (Auth.js integration)
    │   │   ├── _components
    │   │   ├── _helpers
    │   │   └── login
    │   ├── (protected)
    │   │   └── <protected_pages>
    ├── components      # Reuseable UI components
    │   └── ui          # Common UI elements (buttons, modals, etc)
    ├── drizzle
    │   ├── migrations
    │   │   └── meta
    │   └── schema
    ├── features        # Feature-based modules
    │   └── (name)
    │       ├── actions # Server actions
    │       ├── db      # Database queries
    │       │   └── cache
    │       ├── permissions
    │       └── schemas
    ├── hooks           # React hooks in client components
    ├── lib             # Helper utilities (data cache)
    ├── utils           # Reusable models
```

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
