import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
import { serial } from "drizzle-orm/pg-core"

export const onboardingProgress = pgTable("onboarding_progress", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  stepId: text("stepId").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const workflowRun = pgTable("workflow_run", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  workflowName: text("workflowName").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  error: text("error"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const workflowStep = pgTable("workflow_step", {
  id: serial("id").primaryKey(),
  workflowRunId: text("workflowRunId").notNull(),
  stepName: text("stepName").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  duration: text("duration"), // milliseconds as string
  error: text("error"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  email: text("email").notNull(),
  type: text("type").notNull(), // onboarding, completion, notification, etc.
  subject: text("subject").notNull(),
  messageId: text("messageId"),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  error: text("error"),
  workflowRunId: text("workflowRunId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  sentAt: timestamp("sentAt"),
})

// --- Transfer & Payment tables -------------------------------------------------
import { decimal, integer, index } from "drizzle-orm/pg-core"

export const bankAccount = pgTable("bank_account", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountName: text("accountName").notNull(),
  accountNumber: text("accountNumber").notNull(),
  routingNumber: text("routingNumber").notNull(),
  bankName: text("bankName").notNull(),
  accountType: text("accountType").notNull().default("checking"), // checking, savings
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  isDefault: boolean("isDefault").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("bank_account_user_id_idx").on(table.userId),
}))

export const transfer = pgTable("transfer", {
  id: text("id").primaryKey(),
  senderId: text("senderId").notNull().references(() => user.id, { onDelete: 'cascade' }),
  senderAccountId: text("senderAccountId").notNull().references(() => bankAccount.id),
  receiverId: text("receiverId").references(() => user.id, { onDelete: 'set null' }),
  receiverAccountId: text("receiverAccountId").notNull().references(() => bankAccount.id),
  recipientEmail: text("recipientEmail"), // For Zelle transfers to external email
  recipientName: text("recipientName"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  description: text("description"),
  transferType: text("transferType").notNull(), // zelle, bank_transfer, internal
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, cancelled
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  senderIdIdx: index("transfer_sender_id_idx").on(table.senderId),
  receiverIdIdx: index("transfer_receiver_id_idx").on(table.receiverId),
  statusIdx: index("transfer_status_idx").on(table.status),
  createdAtIdx: index("transfer_created_at_idx").on(table.createdAt),
}))

export const notification = pgTable("notification", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // transfer_received, transfer_sent, transfer_failed, balance_alert
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedTransferId: text("relatedTransferId").references(() => transfer.id, { onDelete: 'set null' }),
  isRead: boolean("isRead").notNull().default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("notification_user_id_idx").on(table.userId),
  isReadIdx: index("notification_is_read_idx").on(table.isRead),
}))

export const zelleRecipient = pgTable("zelle_recipient", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  displayName: text("displayName").notNull(),
  isVerified: boolean("isVerified").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("zelle_recipient_user_id_idx").on(table.userId),
}))
