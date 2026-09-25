import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB input limit (prior to compression)
const MAX_DIMENSION = 1800; // max 1800px width/height bounding box
const WEBP_QUALITY = 82; // optimal visual clarity vs filesize balance for streetwear catalog

interface CompressionResult {
  buffer: Buffer;
  contentType: string;
  ext: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

async function compressProductImage(inputBuffer: Buffer, fileName: string): Promise<CompressionResult> {
  const originalSize = inputBuffer.length;

  try {
    const pipeline = sharp(inputBuffer)
      .rotate() // Auto-orient based on EXIF tag (prevents phone camera uploads from rotating sideways)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside', // Preserves original aspect ratio within the 1800x1800 box
        withoutEnlargement: true, // Never upscale lower-resolution images
      })
      .webp({
        quality: WEBP_QUALITY,
        effort: 4, // Balanced CPU effort & compression density
      });

    const outputBuffer = await pipeline.toBuffer();
    const compressedSize = outputBuffer.length;
    const savingsPercent = originalSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

    return {
      buffer: outputBuffer,
      contentType: 'image/webp',
      ext: 'webp',
      originalSize,
      compressedSize,
      savingsPercent,
    };
  } catch (err: any) {
    console.warn(`[Image Compression] Sharp pipeline failed for "${fileName}", using original buffer:`, err?.message);
    return {
      buffer: inputBuffer,
      contentType: 'image/jpeg',
      ext: 'jpg',
      originalSize,
      compressedSize: originalSize,
      savingsPercent: 0,
    };
  }
}

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
    const itemTelemetry: Array<{
      url: string;
      originalSize: number;
      compressedSize: number;
      savingsPercent: number;
    }> = [];

    let totalOriginalBytes = 0;
    let totalCompressedBytes = 0;

    for (const file of filesToUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Invalid file type (${file.type}). Supported types: JPG, PNG, WEBP, AVIF, GIF.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" exceeds the 15MB limit.` },
          { status: 400 }
        );
      }

      const cleanBase = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();

      const arrayBuffer = await file.arrayBuffer();
      const rawBuffer = Buffer.from(arrayBuffer);

      // Perform lossless/high-fidelity WebP compression with EXIF orientation correction
      const compressed = await compressProductImage(rawBuffer, file.name);
      totalOriginalBytes += compressed.originalSize;
      totalCompressedBytes += compressed.compressedSize;

      const filePath = `products/${Date.now()}-${cleanBase}.${compressed.ext}`;

      const { data: uploadData, error: uploadErr } = await admin.storage
        .from('product_catalogue')
        .upload(filePath, compressed.buffer, {
          contentType: compressed.contentType,
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
      itemTelemetry.push({
        url: publicData.publicUrl,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        savingsPercent: compressed.savingsPercent,
      });
    }

    const totalSavingsPercent = totalOriginalBytes > 0
      ? Math.max(0, Math.round(((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100))
      : 0;

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length,
      items: itemTelemetry,
      compression: {
        originalSizeBytes: totalOriginalBytes,
        compressedSizeBytes: totalCompressedBytes,
        savingsPercent: totalSavingsPercent,
      },
    });
  } catch (err: any) {
    console.error('Product image upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Image upload failed' },
      { status: 500 }
    );
  }
}
