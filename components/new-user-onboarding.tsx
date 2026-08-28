"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, CreditCard, Landmark, Smartphone, WalletCards } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"

const setupItems = [
  { key: "card", title: "Activate your debit card", description: "Turn on your new card and choose a PIN.", icon: CreditCard },
  { key: "zelle", title: "Enroll in Zelle®", description: "Send and receive money with your email or U.S. mobile number.", icon: Smartphone },
  { key: "deposit", title: "Set up direct deposit", description: "Get your paycheck deposited automatically.", icon: Landmark },
] as const

type SetupKey = (typeof setupItems)[number]["key"] | "money" | "paperless"

export function NewUserOnboarding() {
  const { toast } = useToast()
  const { creditCards, activateCard, addZelleContact, updateAppSettings, addActivity } = useBanking()
  const [activeFlow, setActiveFlow] = useState<SetupKey | null>(null)
  const [pin, setPin] = useState("")
  const [contact, setContact] = useState("")
  const inactiveCard = creditCards.find((card) => !card.activated)

  const closeFlow = () => {
    setActiveFlow(null)
    setPin("")
    setContact("")
  }

  const completeFlow = () => {
    if (activeFlow === "card") {
      if (!inactiveCard) {
        toast({ title: "All cards are active", description: "No debit card needs activation." })
        return
      }
      if (!/^\d{4}$/.test(pin)) {
        toast({ title: "Enter a 4-digit PIN", description: "Your PIN must contain four numbers.", variant: "destructive" })
        return
      }
      activateCard(inactiveCard.id)
      addActivity({ action: `Activated debit card ending in ${inactiveCard.lastFour}`, device: "Current Device", location: "Current Session" })
    } else if (activeFlow === "zelle") {
      if (!contact.trim()) {
        toast({ title: "Enter an email or mobile number", description: "Use the contact information you want to enroll.", variant: "destructive" })
        return
      }
      addZelleContact({ name: "My Zelle profile", email: contact.includes("@") ? contact.trim() : undefined, phone: contact.includes("@") ? undefined : contact.trim() })
      addActivity({ action: "Enrolled in Zelle", device: "Current Device", location: "Current Session" })
    } else if (activeFlow === "deposit") {
      addActivity({ action: "Started direct deposit setup", device: "Current Device", location: "Current Session" })
    } else if (activeFlow === "paperless") {
      updateAppSettings({ paperlessStatements: true })
      addActivity({ action: "Enabled paperless statements", device: "Current Device", location: "Current Session" })
    }
    toast({ title: "Setup complete", description: "Your preference has been saved and synced." })
    closeFlow()
  }

  const flowCopy = {
    card: ["Activate your debit card", "Enter a secure 4-digit PIN to finish activation."],
    zelle: ["Enroll in Zelle®", "Use the email address or U.S. mobile number you want to enroll."],
    deposit: ["Set up direct deposit", "Your routing and account details are ready to use with your employer or payroll provider."],
    money: ["Add money", "Connect an external account or review your account details to fund your new account."],
    paperless: ["Paperless statements", "Turn on secure online delivery for future statements and notices."],
  } as const

  return (
    <section aria-labelledby="getting-started-title" className="flex flex-col gap-4">
      <Card className="border-primary/20 bg-primary/[0.03] shadow-sm">
        <CardHeader className="gap-2 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><WalletCards aria-hidden="true" /></div>
            <div><CardTitle id="getting-started-title" className="text-lg">Get started with Chase</CardTitle><CardDescription>Your new account is open and ready to fund.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg bg-card px-3 py-3"><div><p className="font-medium">Available balance</p><p className="text-sm text-muted-foreground">Total across new accounts</p></div><p className="text-xl font-semibold tabular-nums">$0.00</p></div>
          <Separator />
          <div className="flex flex-col gap-2">{setupItems.map((item) => { const Icon = item.icon; return <div key={item.key} className="flex items-center gap-3 rounded-lg bg-card px-3 py-3"><Icon className="text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="font-medium">{item.title}</p><p className="text-sm leading-6 text-muted-foreground">{item.description}</p></div><Button variant="ghost" size="icon" aria-label={item.title} onClick={() => setActiveFlow(item.key)}><ArrowRight data-icon="inline-end" aria-hidden="true" /></Button></div> })}</div>
          <Button className="w-full" onClick={() => setActiveFlow("money")}>Add money</Button>
        </CardContent>
      </Card>
      <Card><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="font-medium">Paperless statements</p><p className="text-sm leading-6 text-muted-foreground">Receive account notices securely online.</p></div><Button variant="outline" size="sm" onClick={() => setActiveFlow("paperless")}>Set up</Button></CardContent></Card>
      <Dialog open={activeFlow !== null} onOpenChange={(open) => !open && closeFlow()}>
        <DialogContent><DialogHeader><DialogTitle>{activeFlow ? flowCopy[activeFlow][0] : ""}</DialogTitle><DialogDescription>{activeFlow ? flowCopy[activeFlow][1] : ""}</DialogDescription></DialogHeader>
          {activeFlow === "card" && <div className="flex flex-col gap-2"><Label htmlFor="debit-pin">Choose a 4-digit PIN</Label><Input id="debit-pin" inputMode="numeric" maxLength={4} type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} /></div>}
          {activeFlow === "zelle" && <div className="flex flex-col gap-2"><Label htmlFor="zelle-contact">Email or U.S. mobile number</Label><Input id="zelle-contact" autoComplete="email" value={contact} onChange={(event) => setContact(event.target.value)} /></div>}
          {activeFlow === "deposit" && <div className="rounded-lg bg-muted p-4 text-sm leading-6">Use your checking account routing and account numbers from the account details screen. Never share your online banking password with an employer.</div>}
          {(activeFlow === "money" || activeFlow === "paperless") && <div className="rounded-lg bg-muted p-4 text-sm leading-6">This secure setup is available in your account tools and will stay synced across the Chase app and website.</div>}
          <DialogFooter><Button variant="outline" onClick={closeFlow}>Not now</Button><Button onClick={completeFlow}>{activeFlow === "money" ? "Open account tools" : "Complete setup"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default NewUserOnboarding
