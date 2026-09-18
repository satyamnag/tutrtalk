import Link from 'next/link';

const LAST_UPDATED = '18 September 2026';
const CONTACT_EMAIL = 'famerelay@gmail.com';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground mt-2 text-sm">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-10 text-sm leading-7">
        <section>
          <p>
            TutrTalk (&quot;TutrTalk&quot;, &quot;we&quot;, &quot;us&quot;) is a voice-based revision
            tutor for school students. This policy explains what personal data we collect, why we
            collect it, who we share it with, and the choices you have. It applies to the TutrTalk
            web app, the TutrTalk Android app, and our voice tutoring service.
          </p>
          <p className="mt-3">
            We do not sell your personal data. We do not show advertising in TutrTalk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">1. Information we collect</h2>

          <h3 className="mt-5 font-semibold">Account information</h3>
          <p>
            When you create an account we collect your name, email address, a user identifier, and
            &mdash; if you choose to add one &mdash; a profile photo. Sign-in is handled by Clerk.
          </p>

          <h3 className="mt-5 font-semibold">Student profile</h3>
          <p>
            To personalise tutoring we store the details you provide: your name, the spelling of
            your name in Devanagari (used only so the tutor pronounces it correctly), your class,
            board, study type, date of birth, study language, and your preferred book and subject.
          </p>

          <h3 className="mt-5 font-semibold">Voice and audio</h3>
          <p>
            TutrTalk is a voice tutor. When you start a session, your device&apos;s microphone audio
            is streamed in real time to LiveKit and to Amazon Web Services, where Amazon Nova 2 Sonic
            processes it to understand your speech and generate the tutor&apos;s spoken replies. The
            audio is processed to run the conversation. We also store a text transcript of what was
            said so you can review the session later.
          </p>
          <p className="mt-3">
            Please do not share sensitive personal information (such as health, financial, or
            government identifier details) during a session, because your speech is processed and
            transcribed.
          </p>

          <h3 className="mt-5 font-semibold">Learning activity</h3>
          <p>
            We record your learning activity so the tutor can track progress: the questions you are
            asked, the answers you give, whether an answer was correct, partial or wrong, the number
            of attempts, the chapters covered, session transcripts, and timestamps.
          </p>

          <h3 className="mt-5 font-semibold">Guardian links</h3>
          <p>
            A parent or guardian can link their own account to a student&apos;s account. Once linked,
            the guardian can view that student&apos;s name, email address, number of answers,
            chapters covered, and last active date. This is intended so a guardian can supervise a
            minor&apos;s use of TutrTalk.
          </p>

          <h3 className="mt-5 font-semibold">Usage analytics and technical data</h3>
          <p>
            We use PostHog to understand how the product is used, which collects product usage
            events and device and browser information. Our hosting and infrastructure providers
            automatically receive technical data such as your IP address and user agent when you
            use the service. We use cookies and similar storage to keep you signed in and to
            remember your preferences.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. How we use your information</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>To provide the tutoring service, including running live voice sessions.</li>
            <li>To personalise questions and feedback to your class, board and progress.</li>
            <li>To grade your answers and show you progress reports.</li>
            <li>To let a linked guardian supervise a student&apos;s activity.</li>
            <li>To keep the service secure, prevent abuse, and fix problems.</li>
            <li>To understand usage so we can improve the product.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Who we share data with</h2>
          <p>
            We share personal data with the service providers that run TutrTalk. They process data
            on our behalf and are not permitted to use it for their own purposes.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Clerk</strong> &mdash; authentication and account management.
            </li>
            <li>
              <strong>Supabase</strong> &mdash; database and file storage for profiles, learning
              activity and transcripts.
            </li>
            <li>
              <strong>LiveKit</strong> &mdash; real-time audio transport for voice sessions.
            </li>
            <li>
              <strong>Amazon Web Services (Amazon Bedrock, Amazon Nova 2 Sonic)</strong> &mdash;
              speech-to-speech processing that understands your speech and generates the
              tutor&apos;s voice.
            </li>
            <li>
              <strong>PostHog</strong> &mdash; product usage analytics.
            </li>
            <li>
              <strong>Vercel</strong> &mdash; hosting for the TutrTalk web app.
            </li>
          </ul>
          <p className="mt-3">
            We may also disclose data if required by law, or to protect the rights, safety and
            security of our users. If TutrTalk is involved in a merger or acquisition, data may be
            transferred as part of that transaction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Children&apos;s privacy</h2>
          <p>
            TutrTalk is designed for school students and is used by children. We take this
            seriously.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Where a student is a minor, the account should be created and supervised by a parent
              or guardian, and we rely on the parent or guardian to provide consent.
            </li>
            <li>
              The guardian-linking feature exists so a parent or guardian can review a
              minor&apos;s activity.
            </li>
            <li>We do not show advertising to students and we do not sell their data.</li>
            <li>
              We collect only the information needed to run the tutoring service. We do not ask for
              more than that.
            </li>
          </ul>
          <p className="mt-3">
            If you are a parent or guardian and believe a child has provided us with personal data
            without your consent, contact us at {CONTACT_EMAIL} and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. International transfers</h2>
          <p>
            Our providers operate globally, so your data may be processed in countries other than
            your own, including the United States, the European Union, and Japan. Where required,
            we rely on appropriate safeguards for these transfers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. How long we keep data</h2>
          <p>
            We keep your profile and learning activity for as long as your account is active. Voice
            audio is processed to run the session and is not retained as a recording by us; the
            text transcript is kept with your session history. When you ask us to delete your
            account we delete or anonymise your personal data, except where we are required to keep
            it for legal reasons.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Security</h2>
          <p>
            We use industry-standard measures to protect your data, including encryption in transit
            and access controls on our systems. No method of transmission or storage is completely
            secure, so we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Your choices and rights</h2>
          <p>
            You can access and update most of your information from your profile settings. You may
            also ask us to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>provide a copy of the personal data we hold about you;</li>
            <li>correct data that is inaccurate;</li>
            <li>delete your account and personal data;</li>
            <li>object to or restrict certain processing.</li>
          </ul>
          <p className="mt-3">
            To make a request, email {CONTACT_EMAIL}. If you are a minor, a parent or guardian can
            make the request on your behalf.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. When we make a material change we will
            update the date at the top of this page and, where appropriate, notify you in the app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Contact us</h2>
          <p>
            Questions about this policy or your data? Email{' '}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <p className="text-muted-foreground mt-12 text-xs">
        <Link className="underline" href="/">
          Back to TutrTalk
        </Link>
      </p>
    </main>
  );
}
