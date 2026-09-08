import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@dissafyt/ui';
import { Users, ShoppingBag, Scissors, DollarSign, Activity, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Operations Overview</h1>
        <p className="text-sm text-stone-400">
          Unified real-time metrics across Dissafyt Commerce and Ace of Fyt Barbershop.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1</div>
            <p className="text-xs text-stone-500 mt-1">Unified across platform</p>
          </CardContent>
        </Card>

        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Commerce Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-stone-500 mt-1">Clothing module ready</p>
          </CardContent>
        </Card>

        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Barber Bookings</CardTitle>
            <Scissors className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-stone-500 mt-1">Ace of Fyt services ready</p>
          </CardContent>
        </Card>

        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">PayFast Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R 0.00</div>
            <p className="text-xs text-stone-500 mt-1">Merchant 17675995 active</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Alerts & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-stone-800 bg-stone-900/40">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              <Activity className="mr-2 h-5 w-5 text-amber-500" />
              Platform Infrastructure Status
            </CardTitle>
            <CardDescription>
              Backend micro-architecture verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-300">Supabase Auth Endpoint</span>
              <span className="text-emerald-400 font-mono text-xs">ONLINE (200 OK)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-300">Decoupled API Boundary</span>
              <span className="text-emerald-400 font-mono text-xs">INITIALIZED (@dissafyt/api)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-300">Database Migrations</span>
              <span className="text-amber-400 font-mono text-xs">0001_initial_schema.sql ready</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-stone-300">Next.js Applications</span>
              <span className="text-emerald-400 font-mono text-xs">Customer (3000) &bull; Admin (3001)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-800 bg-stone-900/40">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              Next Milestone Checklist
            </CardTitle>
            <CardDescription>
              Phase 1 Exit Condition & Phase 2 Gate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-stone-300">
            <p className="flex items-center">
              <span className="text-amber-500 mr-2">&#9679;</span>
              Execute schema migration on Supabase PostgreSQL.
            </p>
            <p className="flex items-center">
              <span className="text-amber-500 mr-2">&#9679;</span>
              Supply Supabase service_role key to test server-side admin queries.
            </p>
            <p className="flex items-center">
              <span className="text-amber-500 mr-2">&#9679;</span>
              Register a customer and verify profile creation via <code>GET /users/me</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
