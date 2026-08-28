'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { useBanking } from '@/lib/banking-context'
import { ArrowLeft, Shield, Lock, Eye, AlertCircle, Smartphone, FileText, Copy, Check, Download } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function SecurityPage() {
  const router = useRouter()
  
  const { isLoaded, userProfile, linkedDevices = [], removeDevice } = useBanking()
  const userId = userProfile.id
  const [currentTab, setCurrentTab] = useState<'password' | 'twofa' | 'privacy' | 'devices'>('password')
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorStep, setTwoFactorStep] = useState<'method' | 'verify'>('method')
  const [twoFactorMethod, setTwoFactorMethod] = useState('sms')
  const [backupCodesVisible, setBackupCodesVisible] = useState(false)
  const [codesCopied, setCodesCopied] = useState(false)
  const backupCodes = ['R7K4-M2QP', 'N9TX-6VLA', 'C3HZ-8WFD', 'P5GB-1YRS', 'Q8MN-4KVC']
  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\\n'))
    setCodesCopied(true)
    window.setTimeout(() => setCodesCopied(false), 1800)
  }
  const downloadBackupCodes = () => {
    const blob = new Blob([`Chase backup codes\\n\\n${backupCodes.join('\\n')}\\n\\nKeep these codes private.`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'chase-backup-codes.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    showActivity: false,
    allowMessages: true,
  })

  if (!userId) {
    router.replace('/login')
    return null
  }

  const handlePasswordChange = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      alert('Please fill in all fields')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      alert('Passwords do not match')
      return
    }
    alert('Password changed successfully')
    setPasswordForm({ current: '', new: '', confirm: '' })
  }

  const mockDevices = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      type: 'Mobile',
      lastActive: '2 minutes ago',
      location: 'New York, NY',
      current: true,
    },
    {
      id: '2',
      name: 'MacBook Pro',
      type: 'Desktop',
      lastActive: '1 hour ago',
      location: 'New York, NY',
      current: false,
    },
    {
      id: '3',
      name: 'iPad Pro',
      type: 'Tablet',
      lastActive: '2 days ago',
      location: 'Brooklyn, NY',
      current: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card pb-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security & Privacy</h1>
            <p className="text-muted-foreground">Manage your account security</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['password', 'twofa', 'privacy', 'devices'].map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition ${
                currentTab === tab
                  ? 'bg-primary text-background'
                  : 'bg-background text-foreground hover:bg-background'
              }`}
            >
              {tab === 'password' && 'Password'}
              {tab === 'twofa' && '2FA'}
              {tab === 'privacy' && 'Privacy'}
              {tab === 'devices' && 'Devices'}
            </button>
          ))}
        </div>

        {/* Password Tab */}
        {currentTab === 'password' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600" />
              Change Password
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <Eye className="w-5 h-5 opacity-50" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                className="w-full px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary transition"
              >
                Change Password
              </button>
            </div>

            <div className="mt-8 p-4 bg-background rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Password Tips:</strong> Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols.
              </p>
            </div>
          </Card>
        )}

        {/* 2FA Tab */}
        {currentTab === 'twofa' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              Two-Factor Authentication
            </h2>

            <div className="space-y-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="font-semibold text-green-900">Status: Enabled</p>
                </div>
                <p className="text-green-800 text-sm">Your account is protected with SMS-based two-factor authentication.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Current 2FA Method</h3>
                <p className="text-foreground">SMS to ••••• 9999</p>
                <button className="mt-4 px-6 py-2 bg-card text-foreground rounded-lg hover:bg-card transition">
                  Change Method
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-foreground mb-4">Backup Codes</h3>
                <p className="text-muted-foreground mb-4">
                  Save your backup codes in a secure place. You can use them to access your account if you lose access to your 2FA device.
                </p>
                {!backupCodesVisible ? (
                  <button onClick={() => setBackupCodesVisible(true)} className="px-6 py-2 bg-primary text-background rounded-lg hover:bg-primary transition">
                    View Backup Codes
                  </button>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4 font-mono text-sm text-foreground">
                      {backupCodes.map((code) => <span key={code}>{code}</span>)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={copyBackupCodes} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-background">
                        {codesCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {codesCopied ? 'Copied' : 'Copy Codes'}
                      </button>
                      <button onClick={downloadBackupCodes} className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-foreground">
                        <Download className="w-4 h-4" /> Download
                      </button>
                      <button onClick={() => setBackupCodesVisible(false)} className="rounded-lg border border-border px-4 py-2 text-foreground">
                        Hide
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Privacy Tab */}
        {currentTab === 'privacy' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Privacy Settings
            </h2>

            <div className="space-y-6">
              <div className="p-4 bg-background rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Profile Visibility</label>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })
                    }
                    className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="private">Private</option>
                    <option value="friends">Friends Only</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <p className="text-sm text-muted-foreground">Control who can see your profile information</p>
              </div>

              <div className="p-4 bg-background rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Show Activity Status</label>
                  <input
                    type="checkbox"
                    checked={privacySettings.showActivity}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, showActivity: e.target.checked })
                    }
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Let others see when you&apos;re online</p>
              </div>

              <div className="p-4 bg-background rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Allow Messages</label>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowMessages}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, allowMessages: e.target.checked })
                    }
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Allow others to send you messages</p>
              </div>
            </div>

            <div className="mt-8">
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                View Privacy Policy
              </a>
            </div>
          </Card>
        )}

        {/* Devices Tab */}
        {currentTab === 'devices' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              Linked Devices
            </h2>

            {mockDevices.map((device) => (
              <Card key={device.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{device.name}</h3>
                      {device.current && (
                        <span className="text-xs bg-card text-blue-800 px-2 py-1 rounded-full">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{device.type}</p>
                    <p className="text-muted-foreground text-sm">Last active: {device.lastActive}</p>
                    <p className="text-muted-foreground text-sm">{device.location}</p>
                  </div>
                  {!device.current && (
                    <button
                      onClick={() => removeDevice?.(device.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
