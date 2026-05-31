import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

// GET: List linked students with aggregated progress
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch guardian-student links
  const { data: links, error } = await supabase
    .from('guardian_students')
    .select('*')
    .eq('guardian_id', userId);

  if (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  if (!links || links.length === 0) {
    return NextResponse.json([]);
  }

  // Get Clerk user details for each student (by email or stored student_id)
  const client = await clerkClient();
  const studentsWithStats = await Promise.all(
    links.map(async (link) => {
      let studentId = link.student_id;
      let studentName = link.student_email;
      let studentEmail = link.student_email;

      // Try to resolve student by stored ID first
      if (studentId) {
        try {
          const user = await client.users.getUser(studentId);
          studentName = user.fullName || user.primaryEmailAddress?.emailAddress || studentEmail;
          studentEmail = user.primaryEmailAddress?.emailAddress || studentEmail;
        } catch (e) {
          // User may have been deleted; fallback to email
        }
      } else {
        // Look up by email
        try {
          const users = await client.users.getUserList({
            emailAddress: [link.student_email],
          });
          if (users.data.length > 0) {
            const user = users.data[0];
            studentId = user.id;
            studentName = user.fullName || user.primaryEmailAddress?.emailAddress || studentEmail;
            studentEmail = user.primaryEmailAddress?.emailAddress || studentEmail;
            // Update the stored student_id for future lookups
            await supabase
              .from('guardian_students')
              .update({ student_id: studentId })
              .eq('id', link.id);
          }
        } catch (e) {
          // Ignore lookup errors
        }
      }

      // Fetch aggregated progress from user_answers
      const { data: answers, error: answersError } = await supabase
        .from('user_answers')
        .select('chapter, attempt_number, created_at')
        .eq('user_id', studentId || link.student_email)
        .order('created_at', { ascending: false });

      if (answersError) {
        console.error(answersError);
      }

      const totalAnswers = answers?.length || 0;
      const chapters = [...new Set(answers?.map(a => a.chapter) || [])];
      const lastActive = answers?.length ? answers[0].created_at : null;
      // Compute average attempts per question
      const avgAttempts = totalAnswers > 0
        ? (answers || []).reduce((sum, a) => sum + a.attempt_number, 0) / totalAnswers
        : 0;

      return {
        id: link.id,
        studentId: studentId || '',
        studentName,
        studentEmail,
        totalAnswers,
        chaptersCovered: chapters.length,
        lastActive,
        avgAttempts: avgAttempts.toFixed(2),
        linkedAt: link.linked_at,
      };
    })
  );

  return NextResponse.json(studentsWithStats);
}

// POST: Link a student by email
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return new NextResponse('Missing student email', { status: 400 });
  }

  // Check if already linked
  const { data: existing } = await supabase
    .from('guardian_students')
    .select('id')
    .eq('guardian_id', userId)
    .eq('student_email', email)
    .maybeSingle();

  if (existing) {
    return new NextResponse('Student already linked', { status: 409 });
  }

  // Verify email belongs to a Clerk user
  const client = await clerkClient();
  try {
    const users = await client.users.getUserList({
      emailAddress: [email],
    });
    if (users.data.length === 0) {
      return new NextResponse('No user found with that email', { status: 404 });
    }
    const studentId = users.data[0].id;

    const { error } = await supabase
      .from('guardian_students')
      .insert({
        guardian_id: userId,
        student_email: email,
        student_id: studentId,
      });

    if (error) {
      console.error(error);
      return new NextResponse('Failed to link student', { status: 500 });
    }

    return new NextResponse(null, { status: 201 });
  } catch (e) {
    console.error(e);
    return new NextResponse('Error verifying email', { status: 500 });
  }
}

// DELETE: Remove a link
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return new NextResponse('Missing link id', { status: 400 });
  }

  const { error } = await supabase
    .from('guardian_students')
    .delete()
    .eq('id', id)
    .eq('guardian_id', userId);

  if (error) {
    console.error(error);
    return new NextResponse('Failed to unlink', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}