"use client"

import { ArrowRight, CheckCircle2, CreditCard, Landmark, Smartphone, WalletCards } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

const setupItems = [
  { title: "Activate your debit card", description: "Turn on your new card and choose a PIN.", icon: CreditCard },
  { title: "Enroll in Zelle®", description: "Send and receive money with your email or U.S. mobile number.", icon: Smartphone },
  { title: "Set up direct deposit", description: "Get your paycheck deposited automatically.", icon: Landmark },
]

export function NewUserOnboarding() {
  const { toast } = useToast()

  const handleAction = (title: string) => {
    toast({ title, description: "This secure setup flow is ready for your next step." })
  }

  return (
    <section aria-labelledby="getting-started-title" className="flex flex-col gap-4">
      <Card className="border-primary/20 bg-primary/[0.03] shadow-sm">
        <CardHeader className="gap-2 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <WalletCards aria-hidden="true" />
            </div>
            <div>
              <CardTitle id="getting-started-title" className="text-lg">Get started with Chase</CardTitle>
              <CardDescription>Your new account is open and ready to fund.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg bg-card px-3 py-3">
            <div>
              <p className="font-medium">Available balance</p>
              <p className="text-sm text-muted-foreground">Total across new accounts</p>
            </div>
            <p className="text-xl font-semibold tabular-nums">$0.00</p>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            {setupItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-center gap-3 rounded-lg bg-card px-3 py-3">
                  <Icon className="text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={item.title} onClick={() => handleAction(item.title)}>
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </div>
              )
            })}
          </div>
          <Button className="w-full" onClick={() => handleAction("Add money")}>Add money</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Paperless statements</p>
            <p className="text-sm leading-6 text-muted-foreground">Receive account notices securely online.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleAction("Paperless statements")}>Set up</Button>
        </CardContent>
      </Card>
    </section>
  )
}
