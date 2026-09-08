import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@dissafyt/ui';
import { ShoppingBag } from 'lucide-react';

export default function AdminCommercePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <ShoppingBag className="mr-3 h-6 w-6 text-amber-500" />
          Commerce Management
        </h1>
        <p className="text-sm text-stone-400">
          Manage products, variants, stock inventory, and fulfill customer orders.
        </p>
      </div>

      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-base text-stone-200">Catalog & Inventory</CardTitle>
          <CardDescription>Scheduled for implementation in Phase 6 (Clothing MVP)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-stone-500 py-8 text-center">
            Product catalog and order operations will activate in Phase 6.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
