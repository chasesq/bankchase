import { NextResponse } from "next/server"
import { Client, Messaging } from "node-appwrite"
import { z } from "zod"

export const runtime = "nodejs"

const messageSchema = z.object({
  channel: z.enum(["email", "sms", "push"]),
  messageId: z.string().trim().min(1).max(36),
  subject: z.string().trim().min(1).max(255).optional(),
  content: z.string().trim().min(1).max(200_000),
  topics: z.array(z.string().trim().min(1)).max(100).optional(),
  users: z.array(z.string().trim().min(1)).max(100).optional(),
  targets: z.array(z.string().trim().min(1)).max(100).optional(),
  scheduledAt: z.string().datetime().optional(),
  draft: z.boolean().optional(),
  html: z.boolean().optional(),
  from: z.string().trim().min(1).max(255).optional(),
})

function getMessaging() {
  const endpoint = process.env.APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1"
  const projectId = process.env.APPWRITE_PROJECT_ID ?? "6ac3f4ef00218fa22307"
  const apiKey = process.env.APPWRITE_API_KEY ?? process.env.Appwrite_API_key
  if (!apiKey) throw new Error("APPWRITE_API_KEY is not configured")

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
  return new Messaging(client)
}

export async function POST(request: Request) {
  try {
    const parsed = messageSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid message payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const input = parsed.data
    const recipients = [input.topics, input.users, input.targets].filter(Boolean).reduce((total, values) => total + (values?.length ?? 0), 0)
    if (recipients > 100) {
      return NextResponse.json({ ok: false, error: "A message can target at most 100 recipients" }, { status: 400 })
    }

    const messaging = getMessaging()
    const common = {
      messageId: input.messageId,
      content: input.content,
      topics: input.topics,
      users: input.users,
      targets: input.targets,
      scheduledAt: input.scheduledAt,
      draft: input.draft,
    }

    const result = input.channel === "email"
      ? await messaging.createEmail({ ...common, subject: input.subject ?? "BankChase notification", html: input.html })
      : input.channel === "sms"
        ? await messaging.createSms(common)
        : await messaging.createPush({ ...common, title: input.subject ?? "BankChase notification", body: input.content })

    return NextResponse.json({ ok: true, message: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send Appwrite message"
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
