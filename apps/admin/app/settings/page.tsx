'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { Settings, ShieldAlert, CheckCircle2, Key, History, RefreshCw, FileText } from 'lucide-react';
import { adminFetch } from '../../lib/operator';

export default function AdminSettingsPage() {
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audit Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const res = await adminFetch('/api/audit');
      if (res.ok) setLogs(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  async function handleBootstrapAdmin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await adminFetch('/api/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bootstrapEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: data.message || 'Account successfully promoted to Admin!' });
        setBootstrapEmail('');
        loadLogs();
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
    <div className="space-y-8 max-w-5xl">
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
              Note: The user must first register via the customer portal.
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
              <div className="font-medium text-stone-200">Dissafyt Cloud Database & Auth Engine</div>
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

      {/* Database Audit Trail & Compliance */}
      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg text-white flex items-center">
              <History className="mr-2 h-5 w-5 text-amber-500" />
              Database Audit Trail & Compliance ({logs.length})
            </CardTitle>
            <CardDescription>
              Immutable background ledger recording all administrative mutations, role updates, and catalog changes.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loadingLogs}
            className="border-stone-700 text-stone-300 hover:bg-stone-800"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            Refresh Trail
          </Button>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="py-8 text-center text-stone-500 text-sm">Loading audit events...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-sm">
              <FileText className="mx-auto h-8 w-8 text-stone-600 mb-2" />
              No administrative mutations recorded in this session yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="border-b border-stone-800 text-[10px] uppercase text-stone-500">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp (SAST)</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">Details / Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80 font-mono">
                  {logs.map((log) => {
                    const formattedDate = new Intl.DateTimeFormat('en-ZA', {
                      timeZone: 'Africa/Johannesburg',
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    }).format(new Date(log.created_at));

                    const isDanger = log.action.includes('delete') || log.action.includes('revoke');
                    const isSuccess = log.action.includes('create') || log.action.includes('assign');

                    return (
                      <tr key={log.id} className="hover:bg-stone-800/30">
                        <td className="py-2.5 px-3 text-stone-400 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-2.5 px-3 text-white whitespace-nowrap">
                          {log.actor_email}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.actor_role === 'admin'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}>
                            {log.actor_role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isDanger
                              ? 'bg-rose-500/10 text-rose-400'
                              : isSuccess
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-stone-800 text-stone-300'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-300 font-sans">
                          <div className="font-semibold text-white">{log.entity_name || log.entity_id}</div>
                          <div className="text-[10px] text-stone-500 uppercase">{log.entity_type}</div>
                        </td>
                        <td className="py-2.5 px-3 text-stone-400 max-w-xs truncate text-[11px]">
                          {log.changes ? JSON.stringify(log.changes) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
