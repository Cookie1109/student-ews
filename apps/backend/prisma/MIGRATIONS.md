# Prisma migrations

Run Prisma commands from `apps/backend`, or use `npm run db:deploy` /
`npm run db:migrate` at the monorepo root. The schema and migration files were
moved without changes; splitting the applications does not require a migration.

`20260907000000_swe_baseline` is the baseline for the schema migrated from the SWE Go backend.

- New database: run `npx prisma migrate deploy`.
- Existing database that already has the SWE tables: back it up, verify it matches `schema.prisma`, then run `npx prisma migrate resolve --applied 20260907000000_swe_baseline` once. Do not run the baseline SQL against an existing populated schema.
- After the baseline is registered, create every schema change with `npx prisma migrate dev --name <change>` and deploy it with `npx prisma migrate deploy`.
