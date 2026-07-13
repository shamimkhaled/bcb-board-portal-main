import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";

const root = process.cwd();
const prismaDir = path.join(root, "prisma");
const requestedDb = process.env.INIT_DB_PATH;
const dbPath = requestedDb ? path.resolve(root, requestedDb) : path.join(prismaDir, "dev.db");

if (requestedDb && !/qa|test/i.test(dbPath)) {
  throw new Error("Refusing custom database initialization: path must contain qa or test.");
}

if (!existsSync(prismaDir)) {
  mkdirSync(prismaDir, { recursive: true });
}

const SQL = await initSqlJs({
  locateFile: (file) => path.join(root, "node_modules", "sql.js", "dist", file)
});

const schemaSql = execFileSync(
  process.execPath,
  [
    path.join(root, "node_modules", "prisma", "build", "index.js"),
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    path.join("prisma", "schema.prisma"),
    "--script"
  ],
  {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  }
);

const db = new SQL.Database();
db.run(schemaSql);
writeFileSync(dbPath, Buffer.from(db.export()));

console.log(`Created ${path.relative(root, dbPath)} from Prisma schema.`);
