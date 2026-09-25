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
      <p>One item is still outstanding: a postal address, which § 5 ECG and § 25 MedienG both require and which no other field can substitute for. Everything else below is filled in. Have the final wording reviewed before Ochre is promoted publicly or monetised.</p>
      <ul className="legal-checklist">
        <li><span>1</span><div><strong>Operator</strong><p>Harpreet Nehar</p></div></li>
        <li><span>2</span><div><strong>Address</strong><p><Placeholder>Complete geographic business address</Placeholder></p></div></li>
        <li><span>3</span><div><strong>Contact</strong><p>harpreetneharyt@gmail.com — no telephone number published.</p></div></li>
        <li><span>4</span><div><strong>Business details</strong><p>None apply: operated privately and non-commercially, with no Firmenbuch entry, VAT registration, trade licence or chamber membership. These must be completed if Ochre is ever monetised.</p></div></li>
        <li><span>5</span><div><strong>Infrastructure</strong><p>Vercel (hosting, US region) and Supabase (database, file storage and sign-in, eu-central-1 Frankfurt). No analytics and no error monitoring. Outstanding: an Art 28 processing agreement covering the host&rsquo;s free plan.</p></div></li>
      </ul>
    </LegalSection>
    <div className="legal-notice"><strong>Important</strong><p>This is an implementation draft, not legal advice. Applicability depends on whether Ochre remains a private prototype, becomes a free public service, or introduces accounts, payments, analytics, advertising, cloud storage, or social features.</p></div>
  </LegalShell>;
}
