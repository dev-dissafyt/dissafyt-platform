import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const filesToUpload: File[] = [];
    if (singleFile && singleFile instanceof File) {
      filesToUpload.push(singleFile);
    }
    for (const f of files) {
      if (f instanceof File && !filesToUpload.includes(f)) {
        filesToUpload.push(f);
      }
    }

    if (filesToUpload.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image files provided for upload.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Invalid file type (${file.type}). Supported types: JPG, PNG, WEBP, AVIF, GIF.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" exceeds the 10MB limit.` },
          { status: 400 }
        );
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanBase = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      const filePath = `products/${Date.now()}-${cleanBase}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadErr } = await admin.storage
        .from('product_catalogue')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadErr || !uploadData) {
        console.error('Supabase storage upload error:', uploadErr);
        throw new Error(uploadErr?.message || `Failed to upload "${file.name}"`);
      }

      const { data: publicData } = admin.storage
        .from('product_catalogue')
        .getPublicUrl(uploadData.path);

      uploadedUrls.push(publicData.publicUrl);
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (err: any) {
    console.error('Product image upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Image upload failed' },
      { status: 500 }
    );
  }
}
