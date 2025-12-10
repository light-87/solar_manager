import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/r2-storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customerId = formData.get('customerId') as string;
    const documentType = formData.get('documentType') as string;
    const workspaceId = formData.get('workspaceId') as string || 'default';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!customerId || !documentType) {
      return NextResponse.json(
        { error: 'Customer ID and document type are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2 with workspace isolation
    // Path structure: {workspaceId}/{customerId}/{documentType}/{timestamp}_{filename}
    const { url, key } = await uploadFile(
      buffer,
      workspaceId,
      customerId,
      documentType,
      file.name,
      file.type
    );

    return NextResponse.json({
      url,
      key,
      message: 'File uploaded successfully to R2'
    }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
