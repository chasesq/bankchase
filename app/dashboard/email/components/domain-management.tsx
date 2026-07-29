'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, Clock, Plus, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Domain {
  id: string
  domain_name: string
  verified: boolean
  dns_record: any
  created_at: string
}

export default function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/email/domains')
      if (!res.ok) throw new Error('Failed to fetch domains')
      const data = await res.json()
      setDomains(data.domains || [])
    } catch (error: any) {
      toast.error('Failed to load domains')
      console.error('[v0] Domain fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/email/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_name: newDomain })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add domain')
      }

      const data = await res.json()
      setDomains([data.domain, ...domains])
      setNewDomain('')
      setIsDialogOpen(false)
      toast.success('Domain added! Add DNS record to verify.')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyDomain = async (domainId: string) => {
    try {
      const res = await fetch('/api/email/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: domainId })
      })

      const data = await res.json()
      
      if (res.ok) {
        setDomains(domains.map(d => d.id === domainId ? { ...d, verified: true } : d))
        toast.success('Domain verified!')
      } else {
        toast.error(data.message || 'Domain verification pending')
      }
    } catch (error: any) {
      toast.error('Failed to verify domain')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Email Domains</h2>
          <p className="text-sm text-muted-foreground">
            Manage verified domains for sending emails
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Domain</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Email Domain</DialogTitle>
              <DialogDescription>
                Enter your domain name to get started. We'll provide DNS records to verify.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Domain Name</label>
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddDomain} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Domain'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading domains...</div>
      ) : domains.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No domains added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first domain to start sending emails
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-base">{domain.domain_name}</CardTitle>
                    </div>
                    <Badge variant={domain.verified ? 'default' : 'secondary'}>
                      {domain.verified ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyDomain(domain.id)}
                    disabled={domain.verified}
                  >
                    {domain.verified ? 'Verified' : 'Verify'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">DNS Record to Add:</p>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <p>Type: {domain.dns_record?.type}</p>
                        <p>Name: {domain.dns_record?.name}</p>
                        <p>Value: {domain.dns_record?.value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${domain.dns_record?.name} ${domain.dns_record?.type} ${domain.dns_record?.value}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(domain.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
