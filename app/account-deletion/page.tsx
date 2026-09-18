import Link from 'next/link';

const APP_NAME = 'TutrTalk';
const OPERATOR = 'FAMERELAY';
const EMAIL = 'karthik@famerelay.com';

const SUBJECT = 'Account deletion request';
const BODY = `Please delete my ${APP_NAME} account and its associated data.

Account email: (the email you signed in with)

I understand this permanently removes my account and the learning data linked to it.`;

const REQUEST_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(
  BODY
)}`;

export default function AccountDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">Delete your {APP_NAME} account</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {APP_NAME} is operated by {OPERATOR}.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7">
        <section className="border-primary/30 bg-primary/5 rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Request account deletion</h2>
          <p className="mt-3">
            You can ask us to delete your {APP_NAME} account and the data linked to it. Send the
            request from the email address you use to sign in:
          </p>
          <p className="mt-4">
            <a
              className="bg-primary text-primary-foreground inline-block rounded-lg px-5 py-3 font-semibold no-underline"
              href={REQUEST_HREF}
            >
              Email a deletion request
            </a>
          </p>
          <p className="mt-4">
            Or email us directly at{' '}
            <a className="underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>{' '}
            with the subject &ldquo;Account deletion request&rdquo;. There is no in-app charge for
            this and you do not need the app installed to make the request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What we delete</h2>
          <p className="mt-3">Once we confirm the request came from your account, we delete:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>your account and sign-in identity;</li>
            <li>your student profile — name, class, board, study preferences and photo;</li>
            <li>
              your learning records — questions asked, answers given, grades and session history;
            </li>
            <li>
              your session transcripts, including both your words and the tutor&apos;s replies;
            </li>
            <li>any guardian link that gives a parent or guardian access to your progress.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What we may keep, and why</h2>
          <p className="mt-3">
            We may retain a limited amount of information where we have a legitimate reason, and
            only for as long as that reason applies:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Legal and accounting records</strong> that we are required by law to keep.
            </li>
            <li>
              <strong>Security and abuse-prevention records</strong>, such as evidence of fraud or
              misuse, so the same abuse cannot simply be repeated.
            </li>
          </ul>
          <p className="mt-3">
            We also ask the service providers who process data on our behalf — listed in our{' '}
            <Link className="underline" href="/privacy">
              Privacy Policy
            </Link>{' '}
            — to delete the data we hold with them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How long it takes</h2>
          <p className="mt-3">
            We confirm receipt, verify the request came from your account, and complete deletion
            within <strong>30 days</strong>. If we need anything else from you, we will say so when
            we reply.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Deleting some data but keeping your account</h2>
          <p className="mt-3">
            If you only want particular data removed, see{' '}
            <Link className="underline" href="/data-deletion">
              Data deletion
            </Link>
            .
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
