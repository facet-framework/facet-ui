// Localized text and compatibility literals; preserve public discriminants.
export const localized = {
  text1: /getest|tested|geprüft|bewiesen|belegt|bestanden|passed|proven/i,
  text2: "1 von 1 Zusagen mit Testzuordnung",
  text3: "Alle 1 Zusagen haben eine Testzuordnung.",
  text4: /getest|tested|geprüft|bewiesen|belegt|bestanden|passed|proven/i,
  text5: /aria-label="[^"]*(getest|tested|geprüft|bewiesen|belegt|bestanden|passed|proven)/i,
} as const;
