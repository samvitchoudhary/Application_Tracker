import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", [
  "Applied",
  "OA/Assessment",
  "Interviewing",
  "Offer",
  "Rejected",
]);

export const priorityEnum = pgEnum("priority", ["High", "Medium", "Low"]);

export const cycles = pgTable(
  "cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("cycles_user_id_idx").on(table.userId)]
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => cycles.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    locations: text("locations"),
    link: text("link"),
    dateApplied: date("date_applied").notNull().defaultNow(),
    status: statusEnum("status").notNull().default("Applied"),
    priority: priorityEnum("priority").notNull().default("Medium"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("applications_user_id_idx").on(table.userId),
    index("applications_user_id_cycle_id_idx").on(table.userId, table.cycleId),
  ]
);

export const cyclesRelations = relations(cycles, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  cycle: one(cycles, {
    fields: [applications.cycleId],
    references: [cycles.id],
  }),
}));

export type Cycle = typeof cycles.$inferSelect;
export type NewCycle = typeof cycles.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
