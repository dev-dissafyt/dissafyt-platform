import { NextRequest, NextResponse } from 'next/server';
import { AdminProductService, AdminBarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'STREETWEAR' | 'BARBERSHOP';
  href: string;
  price?: string;
}

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

    const [products, services] = await Promise.all([
      AdminProductService.listProducts().catch((err) => {
        console.error('Error fetching products for search:', err);
        return [];
      }),
      AdminBarbershopService.listServices().catch((err) => {
        console.error('Error fetching services for search:', err);
        return [];
      }),
    ]);

    const activeProducts: SearchResultItem[] = products
      .filter((p) => p.is_active)
      .map((p) => ({
        id: `prod-${p.id}`,
        title: p.name,
        subtitle: p.description || (p as any).category_name || 'Dissafyt Streetwear Lab',
        category: 'STREETWEAR',
        href: p.slug ? `/shop/${p.slug}` : '/shop',
        price: `R ${Number(p.base_price || 0).toFixed(2)}`,
      }));

    const activeServices: SearchResultItem[] = services
      .filter((s) => s.is_active)
      .map((s) => ({
        id: `serv-${s.id}`,
        title: s.name,
        subtitle: s.description || `${s.duration_minutes || 30} min grooming session`,
        category: 'BARBERSHOP',
        href: s.is_subscription ? '/book#memberships' : '/book',
        price: s.is_subscription
          ? `R ${Number(s.price || 0).toFixed(2)}/mo`
          : `R ${Number(s.price || 0).toFixed(2)}`,
      }));

    const allItems = [...activeProducts, ...activeServices];

    if (!q) {
      return NextResponse.json(allItems);
    }

    const filtered = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.price && item.price.toLowerCase().includes(q))
    );

    return NextResponse.json(filtered);
  } catch (err: any) {
    console.error('Search API error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
