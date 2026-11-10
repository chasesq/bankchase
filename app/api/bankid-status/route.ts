import { NextResponse } from "next/server"

const endpoints = {
  status: "https://status.bankid.com/api/v2/status.json",
  components: "https://status.bankid.com/api/v2/components.json",
  incidents: "https://status.bankid.com/api/v2/incidents/unresolved.json",
  maintenances: "https://status.bankid.com/api/v2/scheduled-maintenances/upcoming.json",
}

export async function GET() {
  try {
    const responses = await Promise.all(Object.values(endpoints).map((url) => fetch(url, { next: { revalidate: 60 } })))
    if (responses.some((response) => !response.ok)) throw new Error("BankID status endpoint failed")

    const [status, components, incidents, maintenances] = await Promise.all(responses.map((response) => response.json()))
    return NextResponse.json({
      status,
      components: components.components ?? [],
      incidents: incidents.incidents ?? [],
      maintenances: maintenances.scheduled_maintenances ?? [],
      fetchedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "Unable to reach BankID status services" }, { status: 502 })
  }
}
