import {config} from  "dotenv";
import { defineConfig, env } from "prisma/config";
import path from "node:path";

config({
    path: path.resolve(__dirname, ".",".env.local"),
})

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error(`Missing DB URL: ${dbUrl}`);
}

export default defineConfig({
    schema: "./prisma/schema.prisma",
    migrations: {
        path: path.join(process.cwd(), "prisma", "migrations"),
        seed: "pnpm exec tsx prisma/db-seed.ts"
    },
    datasource: {
        url: dbUrl
    }
});