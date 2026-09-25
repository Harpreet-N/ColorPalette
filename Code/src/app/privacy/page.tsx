import { LegalSection, LegalShell, Placeholder } from '@/components/legal-page';

export default function Privacy() {
  return <LegalShell eyebrow="GDPR transparency information" title="Privacy policy" intro="What happens to personal data when someone uses Ochre.">
    <div className="legal-notice"><strong>Ochre works in two modes, and they are very different</strong><p><strong>Signed out</strong> — photo analysis, colour readings and the journal run entirely inside the browser. Nothing is sent to the operator, and no account exists. <strong>Signed in</strong> — the same journal is additionally copied to the operator&rsquo;s database and file storage so that it can be opened on another device. Signing in is optional, is never required to use the app, and can be undone.</p></div>

    <LegalSection title="1. Controller">
      <p>Harpreet Nehar<br /><Placeholder>Postal address — required under Art 13(1)(a) GDPR</Placeholder><br />Email: <a href="mailto:harpreetneharyt@gmail.com">harpreetneharyt@gmail.com</a></p>
      <p>Data protection officer: not appointed. Ochre is operated privately and non-commercially, carries out no large-scale or systematic monitoring, and processes no special categories of data, so none of the cases in Art 37(1) GDPR applies.</p>
    </LegalSection>

    <LegalSection title="2. Photographs and colour readings">
      <p>When a photograph or video frame is chosen, the browser decodes a reduced copy and analyses its pixel colours on the device. The analysis itself never leaves the browser in either mode.</p>
      <p>Keeping a reading writes a compressed copy of the image, the extracted colour values, a title and a date into the browser&rsquo;s local storage. <strong>Signed out, that is the end of it.</strong></p>
      <p>Signed in, the same reading is additionally written to the operator&rsquo;s database, and the compressed image is uploaded to a private file-storage bucket. Photographs are never placed in the database itself; the stored row holds only the file&rsquo;s path.</p>
      <dl className="legal-definition">
        <div><dt>Purpose</dt><dd>Provide the analysis and journal the user asked for, and — only on request — keep that journal available on the user&rsquo;s other devices.</dd></div>
        <div><dt>Legal basis</dt><dd>Art 6(1)(b) GDPR: performance of the service the user has requested by signing in. Signed out there is no processing by the operator to base anything on.</dd></div>
        <div><dt>Location</dt><dd>The browser, and — signed in — a database and file store in the <strong>eu-central-1 (Frankfurt) region</strong>, inside the EU.</dd></div>
        <div><dt>Access</dt><dd>Every stored row and every stored file is bound to the account that created it and enforced in the database by row-level security, so one account cannot read another&rsquo;s readings or photographs.</dd></div>
        <div><dt>Retention</dt><dd>Until the user deletes the entry or erases everything. Deleting removes the database row and the stored photograph as well as the local copy.</dd></div>
      </dl>
    </LegalSection>

    <LegalSection title="3. Account and sign-in">
      <p>The only way to sign in is with a Google account. Choosing it sends the user to Google, which authenticates them and returns a confirmation to the operator&rsquo;s authentication service. There is no password, and the operator never sees one.</p>
      <p>What the operator receives and stores about the person: a generated user identifier, the email address of the Google account, the display name and profile-picture link Google supplies, and the times of sign-up and last sign-in. Requested scopes are limited to <code>email</code> and <code>profile</code>.</p>
      <p>Google acts as an independent controller for what happens on its own side of that exchange, including whatever it records about the sign-in. Google&rsquo;s own notice applies there: <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">policies.google.com/privacy ↗</a>. For users in the EEA, the relevant Google entity is normally Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland.</p>
      <p>Legal basis: Art 6(1)(b) GDPR — the account is the service requested. Signing out ends the session; asking the operator to delete the account removes the stored profile and, with it, every reading and photograph belonging to it.</p>
    </LegalSection>

    <LegalSection title="4. Processors">
      <p>Two providers process data on the operator&rsquo;s behalf.</p>
      <dl className="legal-definition">
        <div><dt>Website hosting</dt><dd>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. Serves the application and necessarily receives request data — IP address, time, requested resource, browser and device information, referrer — in order to deliver and secure it. Builds and server-side execution for this project run in a United States region.</dd></div>
        <div><dt>Database, file storage and authentication</dt><dd>Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513. The project&rsquo;s data is stored and primarily processed in <strong>eu-central-1 (Frankfurt)</strong>. Subprocessors: <a href="https://supabase.com/legal/customer-resources/subprocessor-list" target="_blank" rel="noreferrer">supabase.com subprocessor list ↗</a>.</dd></div>
      </dl>
      <p><strong>International transfers.</strong> Both providers are established outside the EEA and both rely on the 2021 Standard Contractual Clauses, Module Two (controller to processor), for transfers. Readings and photographs are held in Frankfurt; hosting-level request data may be processed in the United States.</p>
      <div className="legal-notice warning"><strong>Outstanding: processing agreement with the host</strong><p>Vercel&rsquo;s Data Processing Addendum is stated to apply to customers on its Enterprise and Pro plans. Ochre is deployed on the free Hobby plan, so an Art 28(3) contract with the host should not be assumed to be in force. Before this is treated as settled, the operator must either obtain a processing agreement covering the plan in use, move to a plan the addendum covers, or host elsewhere.</p></div>
    </LegalSection>

    <LegalSection title="5. Requests to other domains">
      <p>Signed out, opening Ochre makes no request to any domain other than the one serving it. Typefaces are served from this origin rather than a font CDN, so no IP address is disclosed to a third party in order to render text. There are no embedded maps, videos, social buttons, tag managers or consent vendors, and no behavioural analytics, advertising pixels, fingerprinting or marketing profiles anywhere in the application.</p>
      <p>Signing in necessarily changes that, and only then: the browser is redirected to Google to authenticate, and from that point the app exchanges data with the operator&rsquo;s Supabase project in Frankfurt. Both are consequences of the user&rsquo;s own decision to have an account.</p>
      <div className="legal-notice"><strong>Why this matters</strong><p>Loading fonts, scripts or media from another provider transmits the visitor&rsquo;s IP address to that provider before any consent can be given. Austrian and German supervisory practice has treated that as a processing operation needing its own legal basis. Serving those files from this origin removes the question entirely.</p></div>
    </LegalSection>

    <LegalSection title="6. Data-subject rights">
      <p>A person whose personal data the operator processes has the rights of access, rectification, erasure, restriction, portability, objection and withdrawal of consent under the GDPR. Requests go to <a href="mailto:harpreetneharyt@gmail.com">harpreetneharyt@gmail.com</a>. The operator may need enough information to identify the account concerned.</p>
      <p><strong>Erasure without asking anyone.</strong> Signed out, the operator holds no copy at all — there is nothing to request. Signed in, <em>Erase everything</em> on the journal screen deletes the rows and the stored photographs as well as the local copies, and individual entries can be removed one at a time from the journal or the reading screen. Rights over an account itself — access to the stored profile, or deletion of the account as a whole — are exercised by email.</p>
      <p>A complaint may be submitted to the Austrian Data Protection Authority, Barichgasse 40–42, 1030 Vienna, Austria: <a href="https://www.dsb.gv.at/" target="_blank" rel="noreferrer">dsb.gv.at ↗</a>.</p>
    </LegalSection>

    <LegalSection title="7. Children and automated decisions">
      <p>Ochre is not designed to collect information directly from children and makes no decision producing legal or similarly significant effects. Colour extraction is a visual calculation the user asked for, not profiling.</p>
    </LegalSection>

    <LegalSection title="8. Changes">
      <p>This notice must be reviewed whenever hosting, analytics, payments, error monitoring, communication tools or other external services change. It was last revised when optional Google sign-in and account-backed journals were added.</p>
      <p><a href="https://eur-lex.europa.eu/eli/reg/2016/679/" target="_blank" rel="noreferrer">General Data Protection Regulation at EUR-Lex ↗</a></p>
    </LegalSection>
  </LegalShell>;
}
