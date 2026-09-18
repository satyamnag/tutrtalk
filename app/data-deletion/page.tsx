import Link from 'next/link';

const APP_NAME = 'TutrTalk';
const OPERATOR = 'FAMERELAY';
const EMAIL = 'karthik@famerelay.com';

const SUBJECT = `Data deletion request (${APP_NAME})`;
const BODY = `Please delete the following data linked to my ${APP_NAME} account.

Account email: (the email you signed in with)
Data to delete: (for example: learning history, transcripts, profile details, or "all data")

I understand this cannot be undone.`;

const REQUEST_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(
  BODY
)}`;

export default function DataDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">Delete your {APP_NAME} data</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {APP_NAME} is operated by {OPERATOR}. This page explains how to have your {APP_NAME} data
        deleted.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7">
        <section className="border-primary/30 bg-primary/5 rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Request data deletion</h2>
          <p className="mt-3">
            You can request deletion of all or part of your {APP_NAME} data without being sent back
            to the app. Email us from the address you sign in with:
          </p>
          <p className="mt-4">
            <a
              className="bg-primary text-primary-foreground inline-block rounded-lg px-5 py-3 font-semibold no-underline"
              href={REQUEST_HREF}
            >
              Email a data deletion request
            </a>
          </p>
          <p className="mt-4">
            Or contact{' '}
            <a className="underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            . You do not need the {APP_NAME} app installed, and there is no charge.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">The data you can have deleted</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Learning history</strong> — the questions asked, your answers, and the grades
              given.
            </li>
            <li>
              <strong>Session transcripts</strong> — the text record of what was said in your
              sessions.
            </li>
            <li>
              <strong>Profile details</strong> — your name, the spelling of your name used for
              pronunciation, class, board, study preferences and photo.
            </li>
            <li>
              <strong>Everything at once</strong> — equivalent to deleting your account. See{' '}
              <Link className="underline" href="/account-deletion">
                Account deletion
              </Link>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Voice recordings</h2>
          <p className="mt-3">
            {APP_NAME} is voice-based. When you speak, your audio is streamed to our voice providers
            so the tutor can understand you and reply. We do not keep an audio recording of your
            voice — what we store is the text transcript of the session, and that is covered by the
            deletion options above. The providers involved are listed in our{' '}
            <Link className="underline" href="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How long it takes</h2>
          <p className="mt-3">
            We verify that the request came from your account and complete deletion within{' '}
            <strong>30 days</strong>. We will reply to confirm once it is done.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">If you are a parent or guardian</h2>
          <p className="mt-3">
            You may make a deletion request on behalf of a student you are responsible for. Email{' '}
            <a className="underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            , and we may ask you to confirm the relationship first.
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
