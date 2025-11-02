# 🩸 Bloodchain

[](LICENSE)

> A decentralized platform connecting blood donors and patients.

-----

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart)
- [Tech Stack](#tech-stack)
- [System Design](#system-design)
- [Documentation](#documentation)
- [Community & Contributing](#community--contributing)
- [License](#license)

-----

## ✨ Features

> 🚧 This section is under active development. Stay tuned for updates\!

-----

## 📋 Prerequisites

Before you begin, ensure you have the following tools installed on your system:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) (v18 or later)
- [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for running the PostgreSQL database)

-----

## 🚀 Quickstart

Follow these steps to get your local development environment up and running.

```bash
# 1. Clone the repository
git clone https://github.com/aryankumarofficial/bloodchain.git
cd bloodchain

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
# (Copy the example file and then fill in your keys)
cp .env.example .env.local

# 4. start the docker desktop
docker desktop start

# 5. buid the container
docker compose up --buid

# 6. Set up and migrate the database
# (This requires Docker Desktop to be running)
npx prisma migrate dev

# 7. Generate the Prisma Client
npx prisma generate

# 8. Start the development server
pnpm dev

# Your app should now be running at http://localhost:3000

# 9. stop the docker services after work donw
docker compose down -v
```

-----

## 🛠️ Tech Stack

This project uses a modern, type-safe stack:

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend:** Next.js API Routes
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **State Management:**
  - **Client State:** [Redux Toolkit](https://redux-toolkit.js.org/) (for auth)
  - **Server State:** [TanStack Query](https://tanstack.com/query/latest)
- **UI:** [React 19](https://react.dev/) & [TailwindCSS](https://tailwindcss.com/)
- **Form Handling:** [React Hook Form](https://react-hook-form.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Email Service:** [Nodemailer](https://nodemailer.com/) (with Gmail SMTP)
- **Deployment:** [Vercel](https://vercel.com/)

-----

## 🏗️ System Design

The following diagram illustrates the overall architecture of **Bloodchain**:

*(Diagram or description to be added)*

-----

## 📚 Documentation

> This project's documentation is actively being developed alongside the codebase.

- [API Reference](docs/API.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Component Docs](docs/COMPONENTS.md)
- [Contributing Guide](docs/CONTRIBUTING.md)
- [Roadmap](docs/ROADMAP.md)

-----

## 🤝 Community & Contributing

We welcome contributions\! Please read our [Contributing Guide](docs/CONTRIBUTING.md) and [Roadmap](docs/ROADMAP.md) for
details on how to get started.

- [Open Issues](https://github.com/aryankumarofficial/bloodchain/issues)
- [Discussions](https://github.com/aryankumarofficial/bloodchain/discussions)

-----

## 📜 License

This project is licensed under the MIT License. See [LICENSE](LICENSE.md) for details.