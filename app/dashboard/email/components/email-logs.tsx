'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clock, Eye, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

interface EmailLog {
  id: string
  recipient_email: string
  recipient_name?: string
  subject: string
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced'
  message_id: string
  opened_at?: string
  clicked_at?: string
  created_at: string
}

interface Statistics {
  total: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
}

export default function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<Statistics>({
    total: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [statusFilter])

  const fetchLogs = async () => {
    try {
      const url = new URL('/api/email/logs', window.location.origin)
      if (statusFilter) url.searchParams.set('status', statusFilter)
      
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch logs')
      
      const data = await res.json()
      setLogs(data.logs || [])
      setStats(data.statistics || {})
    } catch (error: any) {
      toast.error('Failed to load email logs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'opened':
        return <Eye className="h-4 w-4 text-blue-600" />
      case 'clicked':
        return <LinkIcon className="h-4 w-4 text-purple-600" />
      case 'bounced':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'secondary'
      case 'delivered':
        return 'default'
      case 'opened':
        return 'default'
      case 'clicked':
        return 'default'
      case 'bounced':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const filteredLogs = logs.filter(log =>
    log.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Email Logs</h2>
        <p className="text-sm text-muted-foreground">
          Track email delivery and engagement
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.opened}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Clicked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.clicked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Bounced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.bounced}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by email or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter || ''} onValueChange={(v) => setStatusFilter(v || null)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8">Loading email logs...</div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No email logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Recipient</th>
                  <th className="px-4 py-3 text-left font-medium">Subject</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sent</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{log.recipient_email}</div>
                      {log.recipient_name && (
                        <div className="text-xs text-muted-foreground">{log.recipient_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{log.subject}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(log.status)} className="flex w-fit gap-1">
                        {getStatusIcon(log.status)}
                        <span className="capitalize">{log.status}</span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
