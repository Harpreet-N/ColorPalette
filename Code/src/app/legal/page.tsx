/* oxlint-disable next/no-html-link-for-pages */
import { Accessibility, Cookie, FileText, Fingerprint, Scale } from 'lucide-react';
import { LegalSection, LegalShell, Placeholder } from '@/components/legal-page';

const cards = [
  { href:'/imprint', icon:Scale, title:'Imprint', text:'Operator identity and Austrian disclosure information.' },
  { href:'/privacy', icon:Fingerprint, title:'Privacy policy', text:'How photographs, local data, access logs, and enquiries are handled.' },
  { href:'/storage', icon:Cookie, title:'Storage & cookies', text:'What stays on the device and why no consent banner is currently shown.' },
  { href:'/terms', icon:FileText, title:'Terms of use', text:'Rules for using the free Ochre application.' },
  { href:'/accessibility', icon:Accessibility, title:'Accessibility', text:'Current accessibility approach and a route for reporting barriers.' },
];

export default function LegalOverview() {
  return <LegalShell eyebrow="EU & Austria" title="Legal information" intro="The legal layer for Ochre, written around the app’s current privacy-first, device-local design.">
    <div className="legal-card-grid">{cards.map(({href,icon:Icon,title,text}) => <a href={href} key={href} className="legal-card"><Icon /><h2>{title}</h2><p>{text}</p><span>Read page →</span></a>)}</div>
    <LegalSection title="Complete before a public launch">
      <p>These pages cannot be production-ready until the actual operator is identified. Replace every highlighted placeholder, then have the final wording reviewed for the operator’s legal form, business model, hosting setup, and intended audience.</p>
      <ul className="legal-checklist">
        <li><span>1</span><div><strong>Operator</strong><p><Placeholder>Full legal name or registered company name</Placeholder></p></div></li>
        <li><span>2</span><div><strong>Address</strong><p><Placeholder>Complete geographic business address</Placeholder></p></div></li>
        <li><span>3</span><div><strong>Contact</strong><p><Placeholder>Public email address and, if applicable, telephone number</Placeholder></p></div></li>
        <li><span>4</span><div><strong>Business details</strong><p><Placeholder>Company register, VAT, chamber, trade authority and professional rules where applicable</Placeholder></p></div></li>
        <li><span>5</span><div><strong>Infrastructure</strong><p><Placeholder>Hosting provider, server location, retention period and any analytics or error monitoring</Placeholder></p></div></li>
      </ul>
    </LegalSection>
    <div className="legal-notice"><strong>Important</strong><p>This is an implementation draft, not legal advice. Applicability depends on whether Ochre remains a private prototype, becomes a free public service, or introduces accounts, payments, analytics, advertising, cloud storage, or social features.</p></div>
  </LegalShell>;
}
