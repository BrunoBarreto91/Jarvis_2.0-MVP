import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tasks table for Jarvis 2.0
 * Stores all tasks with metadata for Life Management (Work, Personal, Health, Study)
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  frente: mysqlEnum("frente", ["trabalho", "pessoal", "saude", "estudo"]).notNull(),
  // canal: mysqlEnum("canal", ["instagram", "mercado_livre", "shopee", "tiktok_shop"]).notNull(),
  // Field 'canal' deprecated in Jarvis 2.0 as it was specific to e-commerce. Kept commented for reference or future migration needs.
  local: varchar("local", { length: 64 }), // Replacement for canal, generic location context
  tipo: mysqlEnum("tipo", ["foco_profundo", "manutencao_vital", "rotina", "urgente"]).notNull(),
  status: mysqlEnum("status", ["todo", "doing", "blocked", "done"]).default("todo").notNull(),
  prazo: timestamp("prazo"),
  prioridade: mysqlEnum("prioridade", ["baixa", "media", "alta"]).default("media").notNull(),
  esforco: mysqlEnum("esforco", ["baixo", "medio", "alto"]).default("medio").notNull(),
  bloqueador: text("bloqueador"),
  notas: text("notas"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  completadoEm: timestamp("completadoEm"),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Logs table for task history
 * Tracks status changes and metadata updates for audit trail
 */
export const taskLogs = mysqlTable("task_logs", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id),
  statusAnterior: mysqlEnum("statusAnterior", ["todo", "doing", "blocked", "done"]),
  statusNovo: mysqlEnum("statusNovo", ["todo", "doing", "blocked", "done"]).notNull(),
  mudanca: varchar("mudanca", { length: 255 }),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

export type TaskLog = typeof taskLogs.$inferSelect;
export type InsertTaskLog = typeof taskLogs.$inferInsert;
