import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@dissafyt/ui';
import { Scissors } from 'lucide-react';

export default function AdminBarbershopPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Scissors className="mr-3 h-6 w-6 text-amber-500" />
          Barbershop Administration
        </h1>
        <p className="text-sm text-stone-400">
          Manage Ace of Fyt services, barber rosters, availability schedules, and client bookings.
        </p>
      </div>

      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-base text-stone-200">Services & Rostering</CardTitle>
          <CardDescription>Scheduled for implementation in Phase 7 (Barbershop MVP)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-stone-500 py-8 text-center">
            Service management and staff calendar controls will activate in Phase 7.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
