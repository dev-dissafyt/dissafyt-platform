import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@dissafyt/ui';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Settings className="mr-3 h-6 w-6 text-amber-500" />
          Platform Settings
        </h1>
        <p className="text-sm text-stone-400">
          Global platform parameters, notification endpoints, and integration credentials.
        </p>
      </div>

      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-base text-stone-200">System Integrations</CardTitle>
          <CardDescription>Configured services and API gateways</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-stone-800">
            <div>
              <div className="font-medium text-stone-200">Database & Identity</div>
              <div className="text-xs text-stone-500">Supabase PostgreSQL & Auth</div>
            </div>
            <span className="text-emerald-400 font-mono text-xs">Configured</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-stone-800">
            <div>
              <div className="font-medium text-stone-200">Payment Gateway</div>
              <div className="text-xs text-stone-500">PayFast Merchant ID 17675995</div>
            </div>
            <span className="text-emerald-400 font-mono text-xs">Active</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-stone-200">Email & Communications</div>
              <div className="text-xs text-stone-500">Resend API</div>
            </div>
            <span className="text-emerald-400 font-mono text-xs">Configured</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
