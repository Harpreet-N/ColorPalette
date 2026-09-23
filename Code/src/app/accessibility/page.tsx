import { LegalSection, LegalShell, Placeholder } from '@/components/legal-page';

export default function AccessibilityPage() {
  return <LegalShell eyebrow="Inclusive use" title="Accessibility" intro="How Ochre approaches access, where limitations remain, and how to report a barrier.">
    <div className="legal-notice"><strong>Current status</strong><p>Ochre aims toward WCAG 2.2 Level AA, but the current prototype has not undergone a complete independent accessibility audit and should not yet be described as fully conformant.</p></div>
    <LegalSection title="Measures already considered">
      <ul><li>Semantic controls and visible keyboard focus.</li><li>Text alternatives for source photographs and labels for icon controls.</li><li>Automatic dark or light text on exported colour bands.</li><li>Touch targets designed for mobile use.</li><li>Reduced-motion support based on device preference: spring animation is replaced by an immediate settle, while direct dragging still follows the finger.</li>
      <li>Reduced-transparency and increased-contrast preferences are honoured separately.</li>
      <li>Keyboard operation of the reading and the video frame picker, with a visible shortcut legend on pointer devices.</li>
      <li>Interactive targets of at least 44 × 44 CSS pixels.</li><li>HEX and RGB values so colour is not the only means of identification.</li></ul>
    </LegalSection>
    <LegalSection title="Known limitations">
      <ul><li>The native camera, photo picker, share sheet, and colour picker depend on the browser and operating system.</li><li>Generated mosaics are inherently visual; extracted values are provided as a textual alternative.</li><li>Formal testing with a wider range of assistive technologies is still required.</li><li>Some very long user-created reading titles may need additional review at extreme text zoom levels.</li></ul>
    </LegalSection>
    <LegalSection title="Feedback and assistance">
      <p>If a user encounters a barrier or needs information in another accessible form, contact <Placeholder>accessibility@example.com</Placeholder>. Include the page or action involved, the browser or assistive technology used where comfortable, and the preferred reply format.</p>
      <p><strong>Response target:</strong> <Placeholder>Set a realistic response period, for example five business days</Placeholder>.</p>
    </LegalSection>
    <LegalSection title="Austrian accessibility framework">
      <p>The Austrian Accessibility Act (Barrierefreiheitsgesetz, BaFG), which transposes the European Accessibility Act, has applied since <strong>28 June 2025</strong>. It does not cover every website: it covers defined products and services, among them e-commerce, consumer banking, e-books, ticketing and passenger-transport information, and telephone and audiovisual media services.</p>
      <dl className="legal-definition">
        <div><dt>Is Ochre covered?</dt><dd>In its current form it sells nothing, takes no payment, concludes no contract, and offers none of the listed services, so it is unlikely to be an e-commerce service in the sense of the Act. Adding a shop, a subscription, or paid accounts would change that answer.</dd></div>
        <div><dt>Micro-enterprise exemption</dt><dd>Service providers with fewer than 10 people and at most €2 million in annual turnover or balance-sheet total are exempt from the service obligations of the Act. <Placeholder>Confirm whether the operator falls under this threshold</Placeholder>.</dd></div>
        <div><dt>Applicable standard</dt><dd>EN 301 549, which incorporates WCAG 2.1 Level AA. Meeting the harmonised standard creates a presumption of conformity.</dd></div>
        <div><dt>Supervision</dt><dd>Sozialministeriumservice acts as the market surveillance authority and handles complaints; penalties reach up to €80,000.</dd></div>
      </dl>
      <p>Ochre is built to EN 301 549 / WCAG 2.1 AA as a design target regardless of whether the Act binds it, because the reason for the rule does not depend on the exemption.</p>
      <p><a href="https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20012316&Paragraf=2" target="_blank" rel="noreferrer">Austrian Accessibility Act at RIS ↗</a><br /><a href="https://www.sozialministerium.gv.at/Themen/Soziales/Menschen-mit-Behinderungen/Barrierefreiheitsgesetz.html" target="_blank" rel="noreferrer">Sozialministerium overview of the BaFG ↗</a></p>
    </LegalSection>
  </LegalShell>;
}
