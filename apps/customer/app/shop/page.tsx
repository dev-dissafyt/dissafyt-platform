import { Card, CardContent, CardHeader, CardTitle, Button } from '@dissafyt/ui';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 space-y-8">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8 text-amber-500" />
          DISSafyt Clothing Catalog
        </h1>
        <p className="text-zinc-400">
          Streetwear apparel, headwear, and limited-edition seasonal drops.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
          <div>
            <div className="h-48 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
              [Product Image Placeholder]
            </div>
            <CardTitle className="text-lg text-white">DISSafyt Signature Hoodie</CardTitle>
            <p className="text-sm text-zinc-400 mt-1">Heavyweight cotton, embroidered logo.</p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="font-bold text-lg text-amber-400">R 650.00</span>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
              Coming in Phase 6
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
