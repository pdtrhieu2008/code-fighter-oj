This is a [Next.js](https://nextjs.org) application for competitive-programming practice and academy workflows.

## Development

Requirements: Node.js 24, pnpm 12, and PostgreSQL. Copy `.env.example` to `.env` and configure `DATABASE_URL` and `AUTH_SECRET` before starting the app.

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Open http://localhost:3000.

## Tests and checks

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

## Online judge

Custom runs and submissions require `JUDGE0_API_URL` to point to a reachable Judge0 service. The Next.js server does not execute source code and does not fabricate a verdict when Judge0 is unavailable; endpoints return a service error instead. A Judge0 deployment must enforce isolated execution, network restrictions, CPU/memory/process limits, filesystem restrictions, and output caps. The API currently waits synchronously for Judge0; Redis-backed asynchronous workers and submission polling remain future work. See `docs/DEPLOYMENT_GUIDE.md` and `docs/SECURITY_MODEL.md`.


The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
