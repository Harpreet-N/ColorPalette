import { LegalSection, LegalShell } from '@/components/legal-page';

export default function Storage() {
  return <LegalShell eyebrow="Device storage" title="Storage & cookies" intro="A plain-language inventory of the browser storage used by Ochre.">
    <div className="legal-notice"><strong>No consent banner in the current version</strong><p>Under § 165 (3) of the Austrian Telecommunications Act 2021, storing information on a user’s device requires prior consent unless that storage is strictly necessary to provide a service the user has expressly requested. Ochre sets no cookies at all; it writes one local-storage key, and only once the user chooses to keep a reading. That is the service they asked for, so no consent banner is required. If anything non-essential is added later, consent must be obtained before it is activated.</p></div>
    <LegalSection title="Current storage inventory">
      <div className="legal-table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Duration</th></tr></thead><tbody><tr><td><code>ochre-journal-v1</code></td><td>Browser local storage</td><td>Stores saved reading titles, dates, colour values, weights, and a compressed source-image copy.</td><td>Until the user deletes entries or clears browser data.</td></tr></tbody></table></div>
    </LegalSection>
    <LegalSection title="Renamed from Field Palette">
      <p>Journals written by the earlier version under the key <code>field-palette-journal-v1</code> are read once, copied to <code>ochre-journal-v1</code>, and the old key is removed. Nothing is sent anywhere during that move; it happens entirely inside the browser.</p>
    </LegalSection>
    <LegalSection title="Camera and photo library">
      <p>Camera or photo-library access is requested through the browser or operating system only after the user chooses the photo action. Permission settings are controlled by the browser or device. Choosing a photo processes it locally; it is not a cookie and does not automatically transmit the photograph to the operator.</p>
    </LegalSection>
    <LegalSection title="How to remove local data">
      <p>The journal screen shows how many readings are stored and roughly how much space they take, with an <strong>Erase everything</strong> control beside it; a single confirmation-free undo is offered briefly afterwards. Individual entries can be removed from the journal list or from the reading screen. A user may also clear the data through the browser’s own site-data settings.</p>
      <p>Erasure is final: the operator holds no server copy and cannot restore a journal once it is gone.</p>
    </LegalSection>
    <LegalSection title="Future changes">
      <p>Cloud sync, sign-in, crash reporting, embedded media, analytics, marketing, or third-party widgets may add cookies or similar technologies. The inventory and consent experience must be updated before those features are released.</p>
    </LegalSection>
  </LegalShell>;
}

