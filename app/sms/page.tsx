"use client"

import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { CalendarClock, Check, ChevronRight, CircleHelp, Laptop, MessageSquare, MoreHorizontal, Phone, Plus, RefreshCw, Send, Smartphone, Sparkles, Users, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type Message = { id?: string; phone: string; body: string; direction: "inbound" | "outbound"; created_at?: string }
type Conversation = { phone: string; last_body: string; last_at: string; unread?: number }
type Device = { id: string; name: string; phone_number?: string; online: boolean; last_seen?: string }

const demoConversations: Conversation[] = [
  { phone: "+1 (415) 555-1234", last_body: "I can send that over this afternoon.", last_at: "9:42 AM", unread: 2 },
  { phone: "+1 (212) 555-0198", last_body: "Thanks for the update!", last_at: "Yesterday" },
  { phone: "+1 (650) 555-0147", last_body: "Your appointment is confirmed.", last_at: "Mon" },
]

async function api(path: string, options?: RequestInit) {
  const response = await fetch(`/api/android-texter${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || data.detail || "Request failed")
  return data
}

export default function SmsPage() {
  const [conversations, setConversations] = useState<Conversation[]>(demoConversations)
  const [selectedPhone, setSelectedPhone] = useState(demoConversations[0].phone)
  const [messages, setMessages] = useState<Message[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [phone, setPhone] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"messages" | "scheduled">("messages")

  const selected = useMemo(() => conversations.find((conversation) => conversation.phone === selectedPhone), [conversations, selectedPhone])

  async function load() {
    setLoading(true)
    try {
      const [conversationData, deviceData, historyData] = await Promise.all([
        api("/api/messages/conversations?limit=50"),
        api("/api/devices"),
        api(`/api/v1/messages/history/${encodeURIComponent(selectedPhone)}?page=1&limit=50`),
      ])
      if (conversationData.conversations) setConversations(conversationData.conversations)
      if (deviceData.devices) setDevices(deviceData.devices)
      if (historyData.messages) setMessages(historyData.messages)
    } catch { toast.info("Showing your workspace preview. Connect Android Texter to load live data.") } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [selectedPhone])

  async function sendMessage(event: FormEvent) {
    event.preventDefault()
    const destination = phone.trim() || selectedPhone
    if (!destination || !body.trim()) return toast.error("Add a recipient and message first")
    setSending(true)
    try {
      await api("/api/messages/send", { method: "POST", body: JSON.stringify({ phone: destination, message: body.trim() }) })
      setMessages((current) => [...current, { phone: destination, body: body.trim(), direction: "outbound", created_at: new Date().toISOString() }])
      setPhone(""); setBody(""); toast.success("Message queued for sending")
    } catch { toast.error("Could not send message. Check your Android Texter connection.") } finally { setSending(false) }
  }

  return <main className="min-h-screen bg-muted/30 text-foreground">
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><MessageSquare /></div><div><p className="text-sm font-medium text-muted-foreground">Communications</p><h1 className="text-xl font-semibold tracking-tight">Android Texter</h1></div></div>
        <div className="flex items-center gap-3"><Badge variant="outline" className="hidden gap-2 px-3 py-1.5 sm:flex"><span className="size-2 rounded-full bg-emerald-500" /> API connected</Badge><Button variant="ghost" size="icon" aria-label="Help"><CircleHelp /></Button><Button variant="outline" onClick={() => void load()}><RefreshCw data-icon="inline-start" />Refresh</Button></div>
      </div>
    </header>
    <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
      <div className="mb-7 grid gap-4 sm:grid-cols-3"><Stat icon={MessageSquare} label="Messages this month" value="1,248" trend="+18.4%" /><Stat icon={Smartphone} label="Connected devices" value={String(devices.length || 2)} trend="All systems normal" /><Stat icon={CalendarClock} label="Scheduled to send" value="12" trend="Next in 24 min" /></div>
      <div className="grid min-h-[610px] gap-5 lg:grid-cols-[300px_minmax(0,1fr)_310px]">
        <Card className="overflow-hidden"><CardHeader className="border-b pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Conversations</CardTitle><CardDescription>Recent message threads</CardDescription></div><Button size="icon" variant="outline" aria-label="New message" onClick={() => document.getElementById("recipient")?.focus()}><Plus /></Button></div><div className="relative mt-3"><Input placeholder="Search conversations" className="pl-9" /><Users className="absolute left-3 top-2.5 text-muted-foreground" /></div></CardHeader><CardContent className="p-2">{conversations.map((conversation) => <button key={conversation.phone} onClick={() => setSelectedPhone(conversation.phone)} className={`flex w-full gap-3 rounded-xl p-3 text-left transition-colors ${selectedPhone === conversation.phone ? "bg-primary/10" : "hover:bg-muted"}`}><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-primary">{conversation.phone.replace(/\D/g, "").slice(-2)}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold">{conversation.phone}</p><span className="text-xs text-muted-foreground">{conversation.last_at}</span></div><p className="truncate text-xs text-muted-foreground">{conversation.last_body}</p>{conversation.unread ? <Badge className="mt-2 h-5 px-1.5 text-[10px]">{conversation.unread} new</Badge> : null}</div></button>)}</CardContent></Card>
        <Card className="flex min-h-[610px] flex-col overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><Phone /></div><div><CardTitle className="text-base">{selectedPhone}</CardTitle><CardDescription>{loading ? "Loading history..." : selected?.unread ? `${selected.unread} unread messages` : "Conversation history"}</CardDescription></div></div><Button variant="ghost" size="icon" aria-label="More conversation options"><MoreHorizontal /></Button></CardHeader><CardContent className="flex flex-1 flex-col gap-4 p-5"><div className="flex flex-1 flex-col justify-end gap-3 overflow-auto">{messages.length ? messages.map((message, index) => <div key={message.id || index} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${message.direction === "outbound" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"}`}><p>{message.body}</p><p className="mt-1 text-[10px] opacity-65">{message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Today"}</p></div></div>) : <div className="mx-auto max-w-sm py-8 text-center"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted"><Sparkles className="text-primary" /></div><p className="font-medium">Start a new conversation</p><p className="mt-1 text-sm text-muted-foreground">Send a message to {selectedPhone} or choose another contact.</p></div>}</div><Separator /><form onSubmit={sendMessage} className="flex flex-col gap-3"><div className="grid gap-3 sm:grid-cols-[180px_1fr]"><div><Label htmlFor="recipient" className="sr-only">Recipient phone number</Label><Input id="recipient" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" /></div><div className="relative"><Label htmlFor="message" className="sr-only">Message</Label><Textarea id="message" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message..." className="min-h-10 resize-none pr-16" /><Button type="submit" size="icon" className="absolute bottom-2 right-2" disabled={sending} aria-label="Send message">{sending ? <RefreshCw className="animate-spin" /> : <Send />}</Button></div></div><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Messages are sent from your connected Android device.</span><span>{body.length}/1,000</span></div></form></CardContent></Card>
        <div className="flex flex-col gap-5"><Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Devices</CardTitle><CardDescription>Android phones online now</CardDescription></div><Wifi className="text-emerald-500" /></div></CardHeader><CardContent className="flex flex-col gap-3">{(devices.length ? devices : [{ id: "demo-1", name: "Pixel 7", phone_number: "+1 (415) 555-0100", online: true }]).map((device) => <div key={device.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"><div className="flex size-9 items-center justify-center rounded-lg bg-background"><Laptop className="size-4 text-primary" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{device.name}</p><p className="truncate text-xs text-muted-foreground">{device.phone_number || "Android device"}</p></div><span className={`size-2 rounded-full ${device.online ? "bg-emerald-500" : "bg-muted-foreground"}`} /></div>)}<Button variant="outline" className="w-full"><Plus data-icon="inline-start" />Connect device</Button></CardContent></Card><Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Quick replies</CardTitle><CardDescription>Save time on common messages</CardDescription></div><Button variant="ghost" size="icon" aria-label="Add quick reply"><Plus /></Button></div></CardHeader><CardContent className="flex flex-col gap-2"><QuickReply label="Thanks" text="Thanks for reaching out!" onUse={() => setBody("Thanks for reaching out!")} /><QuickReply label="Follow up" text="I’ll follow up shortly." onUse={() => setBody("I’ll follow up shortly.")} /><QuickReply label="Confirmation" text="Your appointment is confirmed." onUse={() => setBody("Your appointment is confirmed.")} /></CardContent></Card></div>
      </div>
    </div>
  </main>
}

function Stat({ icon: Icon, label, value, trend }: { icon: typeof MessageSquare; label: string; value: string; trend: string }) { return <Card><CardContent className="flex items-center gap-4 p-5"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold tracking-tight">{value}</p><p className="text-xs text-emerald-600">{trend}</p></div></CardContent></Card> }
function QuickReply({ label, text, onUse }: { label: string; text: string; onUse: () => void }) { return <button onClick={onUse} className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"><div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Check className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="truncate text-xs text-muted-foreground">{text}</p></div><ChevronRight className="size-4 text-muted-foreground" /></button> }
