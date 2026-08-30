import { NextResponse } from "next/server"
import { getCard, MercuryApiError, revealAgentCard } from "@/lib/mercury-api"

export async function GET(request: Request, context: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await context.params
    const card = new URL(request.url).searchParams.get("reveal") === "true"
      ? await revealAgentCard(cardId)
      : await getCard(cardId)
    return NextResponse.json(card)
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load card" }, { status })
  }
}
