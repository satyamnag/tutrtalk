import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabase
    .from('chapters')
    .select('name')
    .order('order_index');

  if (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return NextResponse.json(data?.map(c => c.name) || []);
}