import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prefer DIRECT_URL (non-pooled). Falls back to DATABASE_URL for non-migration
  // commands (generate, studio). Migration scripts (db:push, db:migrate) enforce
  // DIRECT_URL via their own guards in package.json.
  datasource: {
    url: (() => {
      const direct = process.env["DIRECT_URL"];
      if (direct) return direct;
      const fallback = process.env["DATABASE_URL"];
      if (fallback) {
        console.warn(
          "⚠ DIRECT_URL not set — falling back to DATABASE_URL. Migrations may fail over PgBouncer."
        );
        return fallback;
      }
      return undefined; // Let Prisma handle missing URL (generate doesn't need it)
    })(),
  },
});
