import { LegalSection, LegalShell, Placeholder } from '@/components/legal-page';

export default function Terms() {
  return <LegalShell eyebrow="Current free version" title="Terms of use" intro="The rules governing use of the Ochre browser application.">
    <LegalSection title="1. Scope and operator">
      <p>These terms apply to the current free version of Ochre provided by <Placeholder>full legal name / company and address</Placeholder>. They do not describe subscriptions, paid downloads, or cloud accounts, none of which are currently offered.</p>
    </LegalSection>
    <LegalSection title="2. The service">
      <p>Ochre allows users to select or capture images, calculate representative colours, edit a reading, keep entries in browser storage, and export or share it. The service is a creative aid; colour output can vary with image compression, lighting, display calibration, and the extraction algorithm.</p>
    </LegalSection>
    <LegalSection title="3. User photographs and rights">
      <p>Users retain their rights in photographs and other content they process. They must have permission to use the content and must not use Ochre to infringe copyright, privacy, personality, confidentiality, or other third-party rights. Ochre does not claim ownership of user photographs or the readings made from them.</p>
    </LegalSection>
    <LegalSection title="4. Permitted use">
      <p>The application may be used for personal and lawful creative purposes. Users must not attempt to disrupt, overload, reverse engineer where prohibited by law, introduce malicious code, bypass security, or use the service to process unlawful material.</p>
    </LegalSection>
    <LegalSection title="5. Device-local storage and backups">
      <p>The journal is currently kept in the browser. Users are responsible for exporting anything they wish to preserve. Browser cleanup, private browsing, storage limits, a new device, or removal of site data may permanently delete entries. No server backup is promised.</p>
    </LegalSection>
    <LegalSection title="6. Availability and changes">
      <p>The operator may maintain, improve, or discontinue the free service. Reasonable notice should be given where practicable. Changes to these terms will not retroactively remove mandatory consumer rights.</p>
    </LegalSection>
    <LegalSection title="7. Liability">
      <p>Nothing in these terms excludes liability that cannot lawfully be excluded, including liability under mandatory Austrian and EU consumer law. Subject to those rights, Ochre is not a professional colour-management, archival, safety, medical, or identification tool, and outputs should be independently checked where accuracy matters.</p>
    </LegalSection>
    <LegalSection title="8. Governing law and disputes">
      <p>Austrian law applies, without depriving consumers of mandatory protection available under the law of their habitual residence. Mandatory statutory places of jurisdiction remain unaffected.</p>
      <p><strong>Alternative dispute resolution.</strong> The European Commission’s Online Dispute Resolution (ODR) platform was shut down on 20 July 2025 under Regulation (EU) 2024/3228. The link to it that Austrian and EU websites were previously required to display is now obsolete and should no longer be used — a dead ODR link is itself a defect.</p>
      <p>Consumers resident in the EU may still bring a complaint to a recognised alternative dispute resolution body under the Austrian Alternative Dispute Resolution Act (AStG). For disputes arising online, the body usually competent in Austria is the Internet Ombudsstelle: <a href="https://www.ombudsstelle.at/" target="_blank" rel="noreferrer">ombudsstelle.at ↗</a>.</p>
      <p><strong>Participation:</strong> Ochre is provided privately, free of charge and non-commercially, so the operator is not a trader for these purposes and is under no obligation to take part in alternative dispute resolution, nor does the operator undertake to do so voluntarily. This is stated plainly rather than left silent. Complaints are welcome directly at <a href="mailto:harpreetneharyt@gmail.com">harpreetneharyt@gmail.com</a> and will be answered. If Ochre is ever monetised, this paragraph must be revisited.</p>
    </LegalSection>
    <LegalSection title="9. Contact">
      <p>Questions about these terms: <a href="mailto:harpreetneharyt@gmail.com">harpreetneharyt@gmail.com</a>.</p>
    </LegalSection>
  </LegalShell>;
}

