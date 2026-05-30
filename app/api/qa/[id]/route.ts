import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  const body = await request.json();
  const { question_text, answer_text } = body;

  if (!question_text || !answer_text) {
    return new NextResponse('Missing question_text or answer_text', { status: 400 });
  }

  const { error } = await supabase
    .from('questions')
    .update({ question_text, answer_text, updated_at: new Date().toISOString() })
    .eq('id', numericId);

  if (error) {
    console.error('Error updating question:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', numericId);

  if (error) {
    console.error('Error deleting question:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}