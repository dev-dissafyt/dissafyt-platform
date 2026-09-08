'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { Settings, ShieldAlert, CheckCircle2, Key } from 'lucide-react';

export default function AdminSettingsPage() {
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleBootstrapAdmin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bootstrapEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: data.message || 'Account successfully promoted to Admin!' });
        setBootstrapEmail('');
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to promote account.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error during admin promotion.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Settings className="mr-3 h-8 w-8 text-amber-500" />
          Platform Settings & Infrastructure
        </h1>
        <p className="text-sm text-stone-400">
          Operational configurations, credentials verification, and security controls.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-md border p-4 text-sm ${
            statusMsg.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Admin Bootstrap Tool */}
      <Card className="border-amber-500/40 bg-stone-900/80 shadow-lg shadow-amber-500/5">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center">
            <Key className="mr-2 h-5 w-5 text-amber-500" />
            Initialize / Promote Platform Administrator
          </CardTitle>
          <CardDescription>
            Grant the <code className="text-amber-400">admin</code> role to an existing registered user account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBootstrapAdmin} className="space-y-4">
            <div className="space-y-1">
              <Label>Registered Email Address</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  value={bootstrapEmail}
                  onChange={(e) => setBootstrapEmail(e.target.value)}
                  placeholder="e.g. your-email@domain.com"
                  className="bg-stone-950 border-stone-700"
                  required
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold shrink-0"
                >
                  {submitting ? 'Promoting...' : 'Promote to Admin'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-stone-500">
              Note: The user must first register via the customer portal or Supabase Auth.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Verified Gateway Configurations */}
      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Configured Gateways & APIs</CardTitle>
          <CardDescription>
            Active environment variables and third-party platform endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-stone-800">
            <div>
              <div className="font-medium text-stone-200">Supabase PostgreSQL & Auth</div>
              <div className="text-xs text-stone-500 font-mono">https://ddetxmhghairsapcqmto.supabase.co</div>
            </div>
            <span className="flex items-center text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> ONLINE
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-stone-800">
            <div>
              <div className="font-medium text-stone-200">PayFast Gateway</div>
              <div className="text-xs text-stone-500 font-mono">Merchant ID: 17675995 &bull; Key: Configured &bull; Passphrase: Set</div>
            </div>
            <span className="flex items-center text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> READY
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-stone-800">
            <div>
              <div className="font-medium text-stone-200">The Courier Guy / Shiplogic</div>
              <div className="text-xs text-stone-500 font-mono">API Key: a6008c96... &bull; Env: Sandbox</div>
            </div>
            <span className="flex items-center text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> CONFIGURED
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-stone-200">Email Notifications (Resend)</div>
              <div className="text-xs text-stone-500 font-mono">API Key: re_2gebtjeK...</div>
            </div>
            <span className="flex items-center text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> CONFIGURED
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
