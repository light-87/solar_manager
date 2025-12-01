import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customerId = formData.get('customerId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!customerId || !documentType) {
      return NextResponse.json(
        { error: 'Customer ID and document type are required' },
        { status: 400 }
      );
    }

    // Create a unique filename with customer info
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${customerId}_${documentType}_${timestamp}_${sanitizedFileName}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
