This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## LXD Attendance — corrected client bundle

- This bundle contains only the Next.js client. NestJS source, Prisma source, server tests, and server build output were removed from the client project so they cannot pollute the Next.js TypeScript build.
- Admin and student authentication pages are independent routes; cross-login tabs are intentionally removed.
- First-time administrators are directed to **Create Company Profile** from `/admin/login`.
- Cohort duration is calculated by the backend from `startDate` and `endDate`; the create/edit UI no longer asks for 3 or 6 months.
- Attendance and report tables use pagination (7 rows for attendance/session tables and 10 rows for reports).
- Attendance/report exports provide an Excel-compatible `.xls` workbook with a styled header and a browser-native **Export PDF** print flow. The PDF flow prints the full dataset rather than only the visible page.
- The UI uses responsive containers, two-column mobile student metric cards, rounded surfaces, smooth scrolling, hover/press transitions, and reduced-motion support.

### Local run

```bash
npm install
npm run dev
```

### Production check

```bash
npm install
npm run build
npm start
```

Set `NEXT_PUBLIC_GRAPHQL_URL` to the running GraphQL API before production use.
