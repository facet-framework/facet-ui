// Localized display text.
export const localized = {
  text1: "UND",
  text2: "ABER",
  tokenPattern:
    /("[^"]*"|'[^']*'|<[^>]+>|\b\d+(?:[.,]\d+)?\s*(?:%|px|ms|s|min|h|d|Tage?|Monate?|Sekunden?|Minuten?|Stunden?|Zeichen)?\b|\b[a-z_]+(?:_[a-z]+)+\b|\btrue\b|\bfalse\b|\bnull\b)/g,
} as const;
