import { LegalSection, LegalShell, Placeholder } from '@/components/legal-page';

export default function Privacy() {
  return <LegalShell eyebrow="GDPR transparency information" title="Privacy policy" intro="What happens to personal data when someone uses Ochre in its current form.">
    <div className="legal-notice"><strong>Privacy by design</strong><p>Photo analysis, colour readings, and the journal currently run inside the user’s browser. Ochre does not currently provide user accounts, advertising, analytics, or cloud photo storage.</p></div>
    <LegalSection title="1. Controller">
      <p><Placeholder>Full legal name / company</Placeholder><br /><Placeholder>Complete address</Placeholder><br />Email: <Placeholder>privacy@example.com</Placeholder></p>
      <p>Data protection officer: <Placeholder>Not appointed / contact details, if one is required</Placeholder></p>
    </LegalSection>
    <LegalSection title="2. Photographs and colour readings">
      <p>When a user selects or captures a photograph, the browser decodes a reduced copy and analyses pixel colours on the device. The original image is not intentionally uploaded to the operator by this feature. A compressed image copy, generated colour values, title, and date are saved in the browser’s local storage only when the user keeps an entry.</p>
      <dl className="legal-definition"><div><dt>Purpose</dt><dd>Provide image analysis, reading and export, and the local journal requested by the user.</dd></div><div><dt>Location</dt><dd>The user’s browser and device.</dd></div><div><dt>Retention</dt><dd>Until the entry is deleted, site data is cleared, or browser storage is removed.</dd></div><div><dt>Recipients</dt><dd>No recipient is intended for photo content unless the user deliberately invokes the device’s export or share function.</dd></div></dl>
    </LegalSection>
    <LegalSection title="3. Website delivery and access logs">
      <p>When the public website is loaded, the hosting provider may technically receive the IP address, request time, requested resource, browser or device information, referrer, and security diagnostics. This processing is normally necessary to deliver and secure the service and may rely on Article 6(1)(f) GDPR, subject to confirmation against the final hosting arrangement.</p>
      <p><strong>Hosting provider:</strong> <Placeholder>Provider name, address, processing location and privacy link</Placeholder><br /><strong>Processing agreement (Art 28 GDPR):</strong> <Placeholder>Confirm a controller–processor contract is in place with the host</Placeholder><br /><strong>Log retention:</strong> <Placeholder>Actual retention period</Placeholder><br /><strong>International transfers:</strong> <Placeholder>None / countries and safeguards</Placeholder></p>
      <p>Apart from this unavoidable server log, the application itself sends nothing back: analysis, editing, and the journal all happen in the browser.</p>
    </LegalSection>
    <LegalSection title="4. Contact enquiries">
      <p>If a person contacts the operator, the supplied name, contact information, message, and related correspondence are processed to answer the enquiry. The legal basis will generally be Article 6(1)(b) GDPR for pre-contractual or service-related communication, or Article 6(1)(f) GDPR for other legitimate correspondence. Statutory retention duties may apply.</p>
    </LegalSection>
    <LegalSection title="5. No third-party requests">
      <p>Opening Ochre makes no request to any domain other than the one serving it. Typefaces are served from this origin rather than from a font CDN, so no IP address is disclosed to a third country in order to render text. There are no embedded maps, videos, social buttons, tag managers, or consent vendors.</p>
      <p>The application code contains no behavioural analytics, advertising pixels, social-media trackers, fingerprinting, or marketing profiles. If any external resource is introduced, this policy — and, where the resource is not strictly necessary, a consent mechanism — must be in place before it is activated.</p>
      <div className="legal-notice"><strong>Why this matters</strong><p>Loading fonts, scripts, or media from another provider transmits the visitor’s IP address to that provider before any consent can be given. Austrian and German supervisory practice has treated that as a processing operation requiring its own legal basis. Serving those files from this origin removes the question.</p></div>
    </LegalSection>
    <LegalSection title="6. Data-subject rights">
      <p>Where the operator processes personal data relating to an identifiable person, that person may have rights of access, rectification, erasure, restriction, portability, objection, and withdrawal of consent under the GDPR. A request can be sent to <Placeholder>privacy@example.com</Placeholder>. The operator may need enough information to verify identity.</p>
      <p><strong>Erasure without asking anyone.</strong> Because the journal never leaves the device, the operator holds no copy to erase. Ochre therefore puts the control in the product: the journal screen shows how many readings are stored and how much space they occupy, and <em>Erase everything</em> removes all of it immediately. Individual entries can be removed from the journal list or the reading screen.</p>
      <p>A complaint may be submitted to the Austrian Data Protection Authority, Barichgasse 40–42, 1030 Vienna, Austria. Website: <a href="https://www.dsb.gv.at/" target="_blank" rel="noreferrer">dsb.gv.at ↗</a>.</p>
    </LegalSection>
    <LegalSection title="7. Children and automated decisions">
      <p>Ochre is not designed to collect information directly from children and does not make decisions producing legal or similarly significant effects. The colour extraction is a visual calculation requested by the user, not profiling.</p>
    </LegalSection>
    <LegalSection title="8. Changes">
      <p>This notice must be reviewed whenever hosting, accounts, cloud sync, analytics, payments, error monitoring, communication tools, or other external services are added.</p>
      <p><a href="https://eur-lex.europa.eu/eli/reg/2016/679/" target="_blank" rel="noreferrer">General Data Protection Regulation at EUR-Lex ↗</a></p>
    </LegalSection>
  </LegalShell>;
}

