import { LegalSection, LegalShell, Placeholder } from '@/components/legal-page';

export default function Imprint() {
  return <LegalShell eyebrow="Impressum · ECG & MedienG" title="Imprint" intro="Provider and media-owner disclosures for an Austrian website or online service.">
    <div className="legal-notice warning"><strong>Operator details required</strong><p>Replace the highlighted fields before making the application available to the public.</p></div>
    <LegalSection title="Service provider">
      <address>
        Harpreet Nehar<br />
        <Placeholder>Street and building number</Placeholder><br />
        <Placeholder>Postal code, city, Austria</Placeholder>
      </address>
      <p>Email: <a href="mailto:harpreetneharyt@gmail.com">harpreetneharyt@gmail.com</a><br />Telephone: <Placeholder>+43 …, if applicable</Placeholder></p>
    </LegalSection>
    <LegalSection title="Business information">
      <dl className="legal-definition">
        <div><dt>Legal form</dt><dd>Natural person. Ochre is operated privately and non-commercially, free of charge, with no advertising and no paid features.</dd></div>
        <div><dt>Company register number and court</dt><dd>Not applicable — not entered in the Firmenbuch.</dd></div>
        <div><dt>VAT identification number</dt><dd>Not applicable — no VAT registration.</dd></div>
        <div><dt>Trade authority</dt><dd>Not applicable — no Gewerbeberechtigung is held for this service in its current non-commercial form.</dd></div>
        <div><dt>Chamber membership</dt><dd>Not applicable.</dd></div>
        <div><dt>Applicable professional rules</dt><dd>Not applicable.</dd></div>
      </dl>
    </LegalSection>
    <LegalSection title="Media disclosure">
      <p><strong>Media owner:</strong> Harpreet Nehar<br /><strong>Business purpose:</strong> Development and operation of the Ochre digital application.<br /><strong>Registered office:</strong> <Placeholder>City, Austria</Placeholder><br /><strong>Persons authorised to represent the owner:</strong> Not applicable — the media owner is a natural person.</p>
      <p><strong>Editorial policy:</strong> Ochre provides a creative tool for reading and keeping the colours of photographed places. It does not pursue a political programme.</p>
    </LegalSection>
    <LegalSection title="Liability and copyright">
      <p>The operator prepares its own content with reasonable care but does not guarantee uninterrupted availability or that automatically extracted colours are suitable for a particular professional purpose. Mandatory statutory liability remains unaffected.</p>
      <p>The Ochre name, interface, texts, and original visual assets are protected where applicable. Users retain all rights they hold in photographs they process and are responsible for having the necessary rights to use them.</p>
    </LegalSection>
    <LegalSection title="Official legal basis">
      <p>This page is designed to accommodate information required by § 5 Austrian E-Commerce Act and the applicable disclosure under §§ 24 and 25 Austrian Media Act. The exact fields depend on the operator’s legal and professional status.</p>
      <p>The Media Act distinguishes by content, not by size. A site that only presents its owner and their own offering is a <em>kleine Website</em> and needs just the owner’s name, their seat or residence, and the business purpose. Once a site publishes content capable of shaping public opinion — commentary, editorial writing, a magazine section — the full disclosure applies, including the editorial direction and, for companies, the ownership structure with shareholdings. Ochre as shipped is a presentation of its own service and falls in the first group; adding a blog would move it to the second.</p>
      <p>The disclosure must be permanently, easily, and directly findable from the service. Ochre links it from the footer of the capture and journal screens, either of which is one tap away from anywhere in the app via the tab bar or the back control.</p>
      <p><a href="https://ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20001703&Paragraf=5" target="_blank" rel="noreferrer">§ 5 ECG at RIS ↗</a><br /><a href="https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10000719&Paragraf=25" target="_blank" rel="noreferrer">§ 25 MedienG at RIS ↗</a></p>
    </LegalSection>
  </LegalShell>;
}

