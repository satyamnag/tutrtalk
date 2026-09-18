import Link from 'next/link';

const APP_NAME = 'TutrTalk';
const OPERATOR = 'FAMERELAY';
const EMAIL = 'karthik@famerelay.com';
const WEBSITE = 'https://famerelay.com';

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">About {APP_NAME}</h1>

      <div className="mt-10 space-y-8 text-sm leading-7">
        <section>
          <h2 className="text-xl font-semibold">What {APP_NAME} is</h2>
          <p className="mt-3">
            {APP_NAME} is a voice-based revision tutor for school students. A student picks a
            chapter from their own textbook, and the tutor asks questions out loud, listens to the
            spoken answer, grades it, and gives feedback — then keeps going until the chapter is
            covered. Because it is voice-first, a student can revise hands-free and get the kind of
            back-and-forth they would get from a tutor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Who runs it</h2>
          <p className="mt-3">
            {APP_NAME} is operated by <strong>{OPERATOR}</strong>, under which {APP_NAME} is
            published. {OPERATOR} is the developer name shown on the Google Play store listing for
            the {APP_NAME} Android app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How it works</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>You sign in and choose a chapter from your book.</li>
            <li>The tutor asks you a question out loud, one at a time.</li>
            <li>
              You answer by speaking. Your speech is converted to text and graded as correct,
              partial or wrong.
            </li>
            <li>
              The tutor responds with feedback and moves to the next question, and keeps a record of
              your progress so it can personalise later sessions.
            </li>
          </ul>
          <p className="mt-3">
            {APP_NAME} needs a working internet connection and microphone access. It does not work
            without them, because the tutoring is spoken.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Privacy and your data</h2>
          <p className="mt-3">
            We explain exactly what we collect and who we share it with in our{' '}
            <Link className="underline" href="/privacy">
              Privacy Policy
            </Link>
            . If you want your account or data removed, start with{' '}
            <Link className="underline" href="/account-deletion">
              Account deletion
            </Link>{' '}
            or{' '}
            <Link className="underline" href="/data-deletion">
              Data deletion
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-3">
            {OPERATOR}
            <br />
            Email:{' '}
            <a className="underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <br />
            Website:{' '}
            <a className="underline" href={WEBSITE} rel="noopener noreferrer" target="_blank">
              {WEBSITE}
            </a>
          </p>
        </section>
      </div>

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
