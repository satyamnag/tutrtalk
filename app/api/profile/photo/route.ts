import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return new NextResponse('No file uploaded', { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return new NextResponse('Only image files are allowed', { status: 400 });
  }

  // Limit file size to 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return new NextResponse('File size must be less than 5MB', { status: 400 });
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;
  const filePath = `profiles/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return new NextResponse('Upload failed', { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}