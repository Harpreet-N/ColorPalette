import { LegalSection, LegalShell } from '@/components/legal-page';

export default function Storage() {
  return <LegalShell eyebrow="Device storage" title="Storage & cookies" intro="A plain-language inventory of the browser storage used by Ochre.">
    <div className="legal-notice"><strong>No consent banner in the current version</strong><p>Under § 165 (3) of the Austrian Telecommunications Act 2021, storing information on a user&rsquo;s device needs prior consent unless it is strictly necessary for a service the user has expressly requested. Ochre sets no cookies at all. It writes two local-storage keys, and each only after the user asks for the thing it serves: one when a reading is kept, one when the user chooses to sign in. Both are strictly necessary for those requested services, so no consent banner is required. Anything non-essential added later must obtain consent before it is activated.</p></div>

    <LegalSection title="Current storage inventory">
      <div className="legal-table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Written when</th><th>Duration</th></tr></thead><tbody>
        <tr><td><code>ochre-journal-v1</code></td><td>Browser local storage</td><td>Saved reading titles, dates, colour values and weights, and a compressed copy of the source image.</td><td>The user keeps a reading.</td><td>Until entries are deleted or browser data is cleared.</td></tr>
        <tr><td><code>sb-girveadcinhdfeywgzbg-auth-token</code></td><td>Browser local storage</td><td>The signed-in session — an access token, a refresh token and the basic profile returned by Google. Without it the user would be signed out on every reload.</td><td>The user signs in. Never written for a signed-out visitor.</td><td>Until sign-out, token expiry, or browser data is cleared.</td></tr>
      </tbody></table></div>
      <p>No cookies are set by the application. No third-party storage of any kind is written.</p>
    </LegalSection>

    <LegalSection title="What leaves the device, and when">
      <p>Signed out, nothing does. The journal, the photographs and the colour analysis are all in the two places above and in memory.</p>
      <p>Signed in, kept readings are additionally copied to the operator&rsquo;s database in the <strong>eu-central-1 (Frankfurt)</strong> region and their photographs to a private file-storage bucket in the same region, so the journal can be opened on another device. The local copy remains the working copy either way, which is why Ochre keeps working with no network.</p>
    </LegalSection>

    <LegalSection title="Renamed from Field Palette">
      <p>Journals written by the earlier version under the key <code>field-palette-journal-v1</code> are read once, copied to <code>ochre-journal-v1</code>, and the old key is removed. Nothing is sent anywhere during that move; it happens entirely inside the browser.</p>
    </LegalSection>

    <LegalSection title="Camera and photo library">
      <p>Camera or photo-library access is requested through the browser or operating system only after the user chooses the photo action, and permission is controlled by the browser or device. Choosing a photograph processes it locally. It is not a cookie, and it does not transmit the photograph to the operator unless the user is signed in and keeps the reading.</p>
    </LegalSection>

    <LegalSection title="How to remove stored data">
      <p>The journal screen shows how many readings are stored and roughly how much space they take, with an <strong>Erase everything</strong> control beside it and a brief undo afterwards. Individual entries can be removed from the journal list or the reading screen. Browser site-data settings clear the local keys directly.</p>
      <p>Signed out, erasure is final: the operator holds no copy and cannot restore a journal. Signed in, erasing removes the database rows and the stored photographs as well, and the same undo covers both; once the undo has passed, that deletion is equally final. Deleting an entire account is done by email — see the privacy policy.</p>
    </LegalSection>

    <LegalSection title="Future changes">
      <p>Crash reporting, embedded media, analytics, marketing and third-party widgets would all add storage or similar technologies. This inventory and the consent experience must be updated before any of them is released.</p>
    </LegalSection>
  </LegalShell>;
}
