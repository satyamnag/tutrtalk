import Link from 'next/link';

const APP_NAME = 'TutrTalk';
const OPERATOR = 'FAMERELAY';
const LEGAL_NAME = 'PALEPU KARTHIK CHANDAN';
const ADDRESS =
  'G01, Mathrushree Orchid Homes, Kempapura Road, Yemalur Street, Bengaluru - 560037, India';
const EMAIL = 'karthik@famerelay.com';
const LAST_UPDATED = '19 September 2026';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-muted-foreground mt-2 text-sm">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-10 text-sm leading-7">
        <section>
          <p>
            These terms are a legal agreement between you and {OPERATOR} (&quot;we&quot;,
            &quot;us&quot;) covering your use of the {APP_NAME} web app and the {APP_NAME} Android
            app (together, the &quot;Service&quot;). {APP_NAME} is operated by {OPERATOR}. By
            creating an account or using the Service, you accept these terms. If you do not accept
            them, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">1. Who may use the Service</h2>
          <p className="mt-3">
            The Service is intended for school students. If you are a minor in your country, you may
            only use the Service with the involvement and consent of a parent or guardian, who must
            accept these terms on your behalf. If you are a parent or guardian, you are responsible
            for the minor&apos;s use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Your account</h2>
          <p className="mt-3">
            You need an account to use the Service. Keep your sign-in details secure and tell us
            promptly if you think someone else has access to your account. You are responsible for
            activity that happens through your account. You must give accurate information in your
            profile, because the tutoring is based on the class, board and book you select.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Acceptable use</h2>
          <p className="mt-3">You agree not to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>use the Service unlawfully, or to harm or harass anyone;</li>
            <li>
              attempt to break, overload, scrape or reverse-engineer the Service, or get around any
              usage limit or security control;
            </li>
            <li>
              record, copy or redistribute the tutor&apos;s content as a substitute for studying, or
              resell access to the Service;
            </li>
            <li>upload or say anything that infringes someone else&apos;s rights.</li>
          </ul>
          <p className="mt-3">
            We may suspend or end access if we reasonably believe these terms have been broken.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            4. The tutor is a study aid, not a qualified teacher
          </h2>
          <p className="mt-3">
            {APP_NAME} uses automated speech and language models to ask questions, grade answers and
            give feedback. It can be wrong, incomplete or out of date. It is a revision aid only. It
            is not a substitute for your school, teacher or textbook, and it is not professional
            educational, legal or medical advice. Always check anything important against your
            textbook or with your teacher.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Voice and connectivity</h2>
          <p className="mt-3">
            The Service is voice-only and needs a working internet connection and microphone access.
            Quality depends on your device, your network and our providers, and sessions may be
            closed automatically after a period of time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Your content and our content</h2>
          <p className="mt-3">
            You keep ownership of what you say and submit. You give us permission to process it so
            we can run and improve the Service — for example, to grade an answer and keep your
            progress — as described in our{' '}
            <Link className="underline" href="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="mt-3">
            We own the Service itself, including its software, design, and the questions and
            explanations we provide. These terms do not give you any right to copy or redistribute
            them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Availability and changes</h2>
          <p className="mt-3">
            We may add, change, suspend or withdraw any part of the Service, including features and
            content, and we do not promise that the Service will always be available or
            uninterrupted. We may also update these terms; if a change is material we will update
            the date above and, where appropriate, tell you in the app. Continuing to use the
            Service after a change means you accept it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Ending your access</h2>
          <p className="mt-3">
            You may stop using the Service at any time and ask us to delete your account — see{' '}
            <Link className="underline" href="/account-deletion">
              Account deletion
            </Link>
            . We may suspend or end your access if you break these terms, or if we are required to
            by law. Sections 4 and 9 to 12 survive the end of your access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Disclaimers</h2>
          <p className="mt-3">
            The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the fullest
            extent permitted by law, we exclude all warranties, whether express or implied,
            including any implied warranty of merchantability, fitness for a particular purpose and
            non-infringement — including any warranty about the accuracy of the questions, grades or
            feedback.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Limitation of liability</h2>
          <p className="mt-3">
            To the fullest extent permitted by law, we are not liable for any indirect, incidental,
            special, consequential or punitive loss, or for any loss of data, profits, goodwill or
            opportunity, arising out of or relating to your use of the Service. Where liability
            cannot be excluded, our total liability to you is limited to the greater of the amount
            you paid us in the twelve months before the claim, or INR 1,000. Nothing in these terms
            limits liability that cannot lawfully be limited.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">11. Changes you make to a device</h2>
          <p className="mt-3">
            If you install the {APP_NAME} Android app, you may need to accept the app store&apos;s
            own terms. The app is distributed through Google Play, and Google&apos;s terms apply to
            that distribution.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">12. Governing law</h2>
          <p className="mt-3">
            These terms are governed by the laws of <strong>India</strong>. The courts at Bengaluru,
            Karnataka have exclusive jurisdiction over any dispute arising out of or relating to
            these terms or the Service, unless the law requires otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">13. Contact</h2>
          <p className="mt-3">
            {LEGAL_NAME}, trading as {OPERATOR}
            <br />
            {ADDRESS}
            <br />
            Email:{' '}
            <a className="underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
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
