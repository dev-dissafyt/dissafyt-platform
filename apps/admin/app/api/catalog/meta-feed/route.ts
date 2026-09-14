import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

function resolveImageLink(product: any): string {
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
    if (typeof first === 'string' && first.startsWith('/')) return `https://www.dissafyt.com${first}`;
  }
  if (product.mockup_url && typeof product.mockup_url === 'string') {
    if (product.mockup_url.startsWith('http')) return product.mockup_url;
    if (product.mockup_url.startsWith('/')) return `https://www.dissafyt.com${product.mockup_url}`;
  }
  return 'https://www.dissafyt.com/logo.png';
}

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'xml').toLowerCase();

    // 1. Fetch active products, variants, and categories from Supabase
    const admin = getSupabaseAdminClient();
    const { data: products, error } = await admin
      .from('products')
      .select('*, categories(name), product_variants(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MetaCatalogFeed Admin] Database query error:', error);
      return new NextResponse('Error generating catalog feed', { status: 500 });
    }

    const items: any[] = [];

    for (const prod of products || []) {
      const categoryName = prod.categories?.name || 'Streetwear';
      const imageLink = resolveImageLink(prod);
      const productUrl = `https://www.dissafyt.com/shop/${prod.slug || prod.id}`;
      const brand = 'Dissafyt';

      const variants = prod.product_variants || [];

      if (variants.length > 0) {
        for (const variant of variants) {
          if (variant.is_active === false) continue;

          const priceNum = variant.price_override || prod.base_price || 0;
          const priceFormatted = `${Number(priceNum).toFixed(2)} ZAR`;
          const availability = (variant.stock_quantity ?? 25) > 0 ? 'in stock' : 'out of stock';
          const title = variant.name && variant.name !== 'Standard'
            ? `${prod.name} (${variant.name})`
            : prod.name;

          items.push({
            id: variant.sku || `${prod.id}-${variant.id}`,
            item_group_id: prod.id,
            title,
            description: prod.description || `${prod.name} - Luxury Cape Town Streetwear by Dissafyt`,
            availability,
            condition: 'new',
            price: priceFormatted,
            link: productUrl,
            image_link: imageLink,
            brand,
            category: categoryName,
            google_product_category: '1604', // Apparel & Accessories > Clothing
            inventory: variant.stock_quantity ?? 25,
            size: variant.name && variant.name !== 'Standard' ? variant.name : 'M',
            color: 'Black',
          });
        }
      } else {
        const priceFormatted = `${Number(prod.base_price || 0).toFixed(2)} ZAR`;
        items.push({
          id: prod.slug || prod.id,
          item_group_id: prod.id,
          title: prod.name,
          description: prod.description || `${prod.name} - Luxury Cape Town Streetwear by Dissafyt`,
          availability: 'in stock',
          condition: 'new',
          price: priceFormatted,
          link: productUrl,
          image_link: imageLink,
          brand,
          category: categoryName,
          google_product_category: '1604',
          inventory: 25,
          size: 'M',
          color: 'Black',
        });
      }
    }

    // 2. Return CSV format if requested (?format=csv)
    // Matches Meta Commerce Manager's Official 31-Column Data Feed Template
    if (format === 'csv') {
      const headers = [
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'link',
        'image_link',
        'brand',
        'price',
        'google_product_category',
        'fb_product_category',
        'quantity_to_sell_on_facebook',
        'sale_price',
        'sale_price_effective_date',
        'item_group_id',
        'gender',
        'color',
        'size',
        'age_group',
        'material',
        'pattern',
        'shipping',
        'shipping_weight',
        'offer_disclaimer',
        'offer_disclaimer_url',
        'video[0].url',
        'video[0].tag[0]',
        'gtin',
        'product_tags[0]',
        'product_tags[1]',
        'style[0]',
      ];

      const csvRows = [
        headers.join(','),
        ...items.map((item) =>
          [
            escapeCsvField(item.id),
            escapeCsvField(item.title),
            escapeCsvField(item.description),
            escapeCsvField(item.availability),
            escapeCsvField(item.condition),
            escapeCsvField(item.link),
            escapeCsvField(item.image_link),
            escapeCsvField(item.brand),
            escapeCsvField(item.price),
            escapeCsvField('Apparel & Accessories > Clothing'),
            escapeCsvField('Clothing & Accessories > Clothing'),
            escapeCsvField(item.inventory),
            escapeCsvField(item.price), // sale_price
            escapeCsvField(''), // sale_price_effective_date
            escapeCsvField(item.item_group_id),
            escapeCsvField('unisex'),
            escapeCsvField(item.color || 'Black'),
            escapeCsvField(item.size || 'M'),
            escapeCsvField('adult'),
            escapeCsvField('cotton'),
            escapeCsvField('graphic print'),
            escapeCsvField('ZA:::0.00 ZAR'),
            escapeCsvField('0.5 kg'),
            escapeCsvField('Valid while stocks last. Terms and conditions apply.'),
            escapeCsvField('https://www.dissafyt.com/terms'),
            escapeCsvField(''),
            escapeCsvField(''),
            escapeCsvField(''),
            escapeCsvField('Streetwear'),
            escapeCsvField(item.category || 'Apparel'),
            escapeCsvField('Streetwear'),
          ].join(',')
        ),
      ];

      return new NextResponse(csvRows.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'inline; filename="dissafyt-meta-catalog.csv"',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      });
    }

    // 3. Return Standard XML RSS 2.0 Google / Meta Product Feed (Default)
    const xmlItems = items
      .map(
        (item) => `    <item>
      <g:id><![CDATA[${item.id}]]></g:id>
      <g:item_group_id><![CDATA[${item.item_group_id}]]></g:item_group_id>
      <g:title><![CDATA[${item.title}]]></g:title>
      <g:description><![CDATA[${item.description}]]></g:description>
      <g:availability>${item.availability}</g:availability>
      <g:condition>${item.condition}</g:condition>
      <g:price>${item.price}</g:price>
      <g:link><![CDATA[${item.link}]]></g:link>
      <g:image_link><![CDATA[${item.image_link}]]></g:image_link>
      <g:brand><![CDATA[${item.brand}]]></g:brand>
      <g:google_product_category>${item.google_product_category}</g:google_product_category>
      <g:fb_product_category>clothing</g:fb_product_category>
      <g:inventory>${item.inventory}</g:inventory>
    </item>`
      )
      .join('\n');

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Dissafyt Cape Town - Live Dynamic Commerce Catalog</title>
    <link>https://www.dissafyt.com</link>
    <description>Authoritative real-time product feed for Meta Commerce Manager (Facebook, Instagram, and WhatsApp Catalog)</description>
${xmlItems}
  </channel>
</rss>`;

    return new NextResponse(xmlFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err: unknown) {
    console.error('[MetaCatalogFeed Admin] Unhandled error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
