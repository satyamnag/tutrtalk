import Link from 'next/link';

const APP_NAME = 'TutrTalk';
const OPERATOR = 'FAMERELAY';
const LEGAL_NAME = 'PALEPU KARTHIK CHANDAN';
const ADDRESS =
  'G01, Mathrushree Orchid Homes, Kempapura Road, Yemalur Street, Bengaluru - 560037, India';
const EMAIL = 'karthik@famerelay.com';
const PHONE = '+91 98861 16123';
const WEBSITE = 'https://famerelay.com';

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {APP_NAME} is operated by {OPERATOR}.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7">
        <section>
          <h2 className="text-xl font-semibold">Support</h2>
          <p className="mt-3">
            For any question about {APP_NAME}, including account or data deletion requests, bug
            reports, and billing questions, email us at:
          </p>
          <p className="mt-3 text-base">
            <a className="underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </p>
          <p className="mt-3">
            We aim to reply within a few business days. Deletion requests are actioned within 30
            days of us confirming your identity — see{' '}
            <Link className="underline" href="/account-deletion">
              Account deletion
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Phone</h2>
          <p className="mt-3">{PHONE}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Postal address</h2>
          <p className="mt-3">
            {LEGAL_NAME}
            <br />
            {OPERATOR}
            <br />
            {ADDRESS}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Website</h2>
          <p className="mt-3">
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
