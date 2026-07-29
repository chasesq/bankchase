'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Settings {
  id: string
  user_id: string
  default_domain_id?: string
  default_template_id?: string
  default_sender_id?: string
  enable_delivery_tracking: boolean
  enable_open_tracking: boolean
  enable_click_tracking: boolean
  unsubscribe_header: boolean
}

interface Domain {
  id: string
  domain_name: string
  verified: boolean
}

interface Template {
  id: string
  name: string
}

interface Sender {
  id: string
  from_email: string
  from_name?: string
}

export default function EmailSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [senders, setSenders] = useState<Sender[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Partial<Settings>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [settingsRes, domainsRes, templatesRes, sendersRes] = await Promise.all([
        fetch('/api/email/settings'),
        fetch('/api/email/domains'),
        fetch('/api/email/templates'),
        fetch('/api/email/senders')
      ])

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }
      if (domainsRes.ok) {
        const data = await domainsRes.json()
        setDomains(data.domains || [])
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || [])
      }
      if (sendersRes.ok) {
        const data = await sendersRes.json()
        setSenders(data.senders || [])
      }
    } catch (error: any) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (Object.keys(changes).length === 0) {
      toast.info('No changes to save')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/email/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      })

      if (!res.ok) throw new Error('Failed to save settings')
      
      const data = await res.json()
      setSettings(data.settings)
      setChanges({})
      toast.success('Settings saved!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: keyof Settings, value: any) => {
    setChanges({ ...changes, [key]: value })
  }

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>
  }

  if (!settings) {
    return <div className="text-center py-8 text-muted-foreground">Failed to load settings</div>
  }

  return (
    <div className="space-y-6">
      {/* Default Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Default Configuration</CardTitle>
          <CardDescription>
            Set default values for sending emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="default-domain">Default Domain</Label>
            <Select
              value={changes.default_domain_id || settings.default_domain_id || ''}
              onValueChange={(v) => handleChange('default_domain_id', v || null)}
            >
              <SelectTrigger id="default-domain" className="mt-2">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.domain_name} {!d.verified && '(Pending)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="default-sender">Default Sender</Label>
            <Select
              value={changes.default_sender_id || settings.default_sender_id || ''}
              onValueChange={(v) => handleChange('default_sender_id', v || null)}
            >
              <SelectTrigger id="default-sender" className="mt-2">
                <SelectValue placeholder="Select a sender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {senders.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.from_name || s.from_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="default-template">Default Template</Label>
            <Select
              value={changes.default_template_id || settings.default_template_id || ''}
              onValueChange={(v) => handleChange('default_template_id', v || null)}
            >
              <SelectTrigger id="default-template" className="mt-2">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking & Analytics</CardTitle>
          <CardDescription>
            Configure email tracking features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="delivery-tracking" className="font-medium">Delivery Tracking</Label>
              <p className="text-sm text-muted-foreground">Track when emails are delivered</p>
            </div>
            <Switch
              id="delivery-tracking"
              checked={changes.enable_delivery_tracking ?? settings.enable_delivery_tracking}
              onCheckedChange={(v) => handleChange('enable_delivery_tracking', v)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <Label htmlFor="open-tracking" className="font-medium">Open Tracking</Label>
              <p className="text-sm text-muted-foreground">Track when emails are opened</p>
            </div>
            <Switch
              id="open-tracking"
              checked={changes.enable_open_tracking ?? settings.enable_open_tracking}
              onCheckedChange={(v) => handleChange('enable_open_tracking', v)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <Label htmlFor="click-tracking" className="font-medium">Click Tracking</Label>
              <p className="text-sm text-muted-foreground">Track when links are clicked</p>
            </div>
            <Switch
              id="click-tracking"
              checked={changes.enable_click_tracking ?? settings.enable_click_tracking}
              onCheckedChange={(v) => handleChange('enable_click_tracking', v)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <Label htmlFor="unsubscribe-header" className="font-medium">Unsubscribe Header</Label>
              <p className="text-sm text-muted-foreground">Add unsubscribe links to emails</p>
            </div>
            <Switch
              id="unsubscribe-header"
              checked={changes.unsubscribe_header ?? settings.unsubscribe_header}
              onCheckedChange={(v) => handleChange('unsubscribe_header', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSaveSettings}
        disabled={saving || Object.keys(changes).length === 0}
        className="w-full"
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  )
}
