import type { ReactNode } from 'react';
import Link from 'next/link';

const APP_NAME = 'TutrTalk';
const OPERATOR = 'FAMERELAY';
const EMAIL = 'karthik@famerelay.com';

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: `What is ${APP_NAME}?`,
    a: (
      <>
        {APP_NAME} is a voice-based revision tutor for school students. You choose a chapter from
        your own textbook, and the tutor asks questions out loud, listens to your spoken answer,
        tells you how you did, and moves on — so you can revise by talking rather than typing.
      </>
    ),
  },
  {
    q: 'Which students is it for?',
    a: (
      <>
        It follows the school syllabus you select when you set up your profile, including CBSE
        classes and boards such as Class 10 Science. The chapters and questions come from the book
        you choose, so the tutoring matches what you are actually studying.
      </>
    ),
  },
  {
    q: 'Do I need an account?',
    a: (
      <>
        Yes. An account is how your progress, chapters and personalisation are kept, so the tutor
        can pick up where you left off. You can ask us to delete it at any time — see{' '}
        <Link className="underline" href="/account-deletion">
          Account deletion
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Why does it need my microphone?',
    a: (
      <>
        {APP_NAME} is voice-only — there is no typing alternative. The tutor has to hear you to
        grade your answer. If microphone permission is denied, sessions cannot work. Your audio is
        streamed to our voice providers so the tutor can understand you and reply; we keep the text
        transcript, not an audio recording. Details are in our{' '}
        <Link className="underline" href="/privacy">
          Privacy Policy
        </Link>
        .
      </>
    ),
  },
  {
    q: 'What information do you collect about me?',
    a: (
      <>
        Your account details, your student profile (name, class, board, study preferences and
        photo), your learning activity (questions, answers, grades, session history and
        transcripts), and product-usage analytics. We name every company we share data with in our{' '}
        <Link className="underline" href="/privacy">
          Privacy Policy
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Do you sell my data, or show me ads?',
    a: <>No. We do not sell personal data and {APP_NAME} does not contain advertising.</>,
  },
  {
    q: 'How do I delete my data?',
    a: (
      <>
        Email{' '}
        <a className="underline" href={`mailto:${EMAIL}`}>
          {EMAIL}
        </a>{' '}
        from the address you signed in with. To remove everything, see{' '}
        <Link className="underline" href="/account-deletion">
          Account deletion
        </Link>
        ; to remove only some data, see{' '}
        <Link className="underline" href="/data-deletion">
          Data deletion
        </Link>
        . We complete requests within 30 days.
      </>
    ),
  },
  {
    q: 'I am a parent or guardian. Can I see my child’s progress?',
    a: (
      <>
        Yes. The guardian feature lets you link your own account to a student&apos;s, so you can see
        their answers, the chapters covered and when they were last active. You can also make a
        deletion request on their behalf.
      </>
    ),
  },
  {
    q: 'How much does it cost?',
    a: (
      <>There is currently no charge to use {APP_NAME}. If that changes, we will say so clearly.</>
    ),
  },
  {
    q: 'Can I use it without an internet connection?',
    a: (
      <>
        No. The tutor runs in the cloud, so a working internet connection is required for every
        session.
      </>
    ),
  },
  {
    q: 'How long can a session run?',
    a: (
      <>
        Sessions are intentionally bounded — a long session is closed automatically so it ends
        cleanly rather than dropping mid-question. Start a new session to carry on.
      </>
    ),
  },
  {
    q: 'Something is not working. Who do I tell?',
    a: (
      <>
        Email{' '}
        <a className="underline" href={`mailto:${EMAIL}`}>
          {EMAIL}
        </a>{' '}
        with what happened and, if you can, the chapter you were studying. See also{' '}
        <Link className="underline" href="/contact">
          Contact
        </Link>
        .
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {APP_NAME} is operated by {OPERATOR}.
      </p>

      <div className="mt-10 space-y-6">
        {FAQS.map((item, i) => (
          <section key={i} className="border-b pb-6 last:border-b-0">
            <h2 className="text-base font-semibold">{item.q}</h2>
            <div className="text-muted-foreground mt-2 text-sm leading-7">{item.a}</div>
          </section>
        ))}
      </div>

      <section className="mt-10 text-sm leading-7">
        <h2 className="text-xl font-semibold">Still stuck?</h2>
        <p className="mt-3">
          Email{' '}
          <a className="underline" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>{' '}
          or visit the{' '}
          <Link className="underline" href="/contact">
            contact page
          </Link>
          .
        </p>
      </section>

      <nav className="text-muted-foreground mt-12 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        <Link className="underline" href="/about">
          About
        </Link>
        <Link className="underline" href="/contact">
          Contact
        </Link>
        <Link className="underline" href="/faq">
          FAQ
        </Link>
        <Link className="underline" href="/terms">
          Terms
        </Link>
        <Link className="underline" href="/privacy">
          Privacy
        </Link>
        <Link className="underline" href="/account-deletion">
          Account deletion
        </Link>
        <Link className="underline" href="/data-deletion">
          Data deletion
        </Link>
      </nav>
    </main>
  );
}
