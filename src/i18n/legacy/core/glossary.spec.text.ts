// Localized text and compatibility literals; preserve public discriminants.
export const localized = {
  text1:
    'schema_version: "1.10"\nterms:\n  - term: Consignee\n    definition: |\n      Die im Transportdokument benannte Partei, die die Ware am Zielort\n      empfängt — nicht zwingend der Käufer.\n  - term: Bill of Lading\n    definition: |\n      Das Dokument, das der Carrier über die übernommene Ware ausstellt.\n    renderings:\n      de: Konnossement\n',
  text7:
    'schema_version: "1.10"\nterms:\n  - term: Consignee\n    definition: |\n      Die benannte Partei.\n  - term: ""\n    definition: |\n      Ohne Begriff.\n  - term: Carrier\n',
  text9: "Der Consignee wird benachrichtigt.",
  text10: "Der ",
  text11: " wird benachrichtigt.",
  text13: "Reordering ist kein Ordering.",
  text14: "Die Consigneeliste.",
  text16: "Eine ReOrder ist keine Order.",
  text17: "Eine ReOrder ist keine ",
  text19: "Der consignee steht klein da.",
  text21: "Die Order Line wird geändert.",
  text22: "Die ",
  text23: " wird geändert.",
  text25: "Consignee und Consignee.",
  text27: "Order-Line, nicht Order Line.",
  text28: "-Line, nicht ",
  text30: "Ein Satz.",
  text31: "Ein Satz.",
  text33: "Consignee, Order Line und Order am Ende: Consignee",
} as const;
