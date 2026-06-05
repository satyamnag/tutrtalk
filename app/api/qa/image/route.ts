import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Optional: restrict to admin email
  // You can add the same email check as in /qa page if desired

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return new NextResponse('No file uploaded', { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return new NextResponse('Only JPG, PNG, WebP, and GIF images are allowed', { status: 400 });
  }

  // Limit file size to 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return new NextResponse('File size must be less than 5MB', { status: 400 });
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `diagram-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `questions/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('question-diagrams')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return new NextResponse('Upload failed', { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from('question-diagrams')
    .getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}