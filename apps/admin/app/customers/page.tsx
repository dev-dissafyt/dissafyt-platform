import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@dissafyt/ui';
import { Users } from 'lucide-react';

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Users className="mr-3 h-6 w-6 text-amber-500" />
          Customer Directory
        </h1>
        <p className="text-sm text-stone-400">
          Platform-wide customer identity profiles and linked histories.
        </p>
      </div>

      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-base text-stone-200">Registered Users</CardTitle>
          <CardDescription>All customers across commerce and barbershop</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-stone-500 py-8 text-center">
            Customer management table will populate as users register during Phase 2.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
