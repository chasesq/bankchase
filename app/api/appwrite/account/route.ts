import { NextResponse } from "next/server"
import { Account, Client } from "appwrite"

export const runtime = "nodejs"

function getAccountClient() {
  const endpoint = process.env.APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1"
  const projectId = process.env.APPWRITE_PROJECT_ID ?? "6ac3f4ef00218fa22307"
  const client = new Client().setEndpoint(endpoint).setProject(projectId)

  const session = process.env.APPWRITE_SESSION_SECRET
  if (session) client.setSession(session)

  return new Account(client)
}

export async function GET() {
  try {
    const account = await getAccountClient().get()
    return NextResponse.json({ ok: true, account })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read the Appwrite account"
    return NextResponse.json(
      { ok: false, error: message, requiresSession: true },
      { status: 401 },
    )
  }
}
