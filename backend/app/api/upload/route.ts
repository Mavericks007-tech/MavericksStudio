import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '../../../lib/auth';
import { uploadImage, generateUploadSignature } from '../../../lib/cloudinary';

// GET /api/upload — get a signed upload signature for direct browser uploads
export async function GET() {
  try {
    await requireAdmin();
    const signature = generateUploadSignature();
    return NextResponse.json(signature);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
  }
}

// POST /api/upload — server-side upload (base64 image in body)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { image, folder } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
    }

    const result = await uploadImage(image, folder);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
