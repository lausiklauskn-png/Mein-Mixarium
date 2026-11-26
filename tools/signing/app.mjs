// Die einzige Datei unter tools/signing/, die je App verschieden ist. Nie die Kennung einer anderen App, nie deren Freigabe.
// Signiert wird nur die Ausgabe mixarium-voll (Brief 26.11.2026); die Store-Ausgabe (de.family_projekt.mixarium) kommt später.
export const APP = Object.freeze({
  appId: 'de.family_projekt.mixarium.voll',
  name: 'Mein Mixarium Pro',
  unlock: 'MX_SIGNING_UNLOCK',
  format: 'mein-mixarium-android-signing',
  alias: 'mixarium',
});
