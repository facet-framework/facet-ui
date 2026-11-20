/**
 * Texts of the elements components (`@facet-tools/ui/elements`, `src/components/ui`).
 * Keys: `elements.<component>.<slug>`. `deElements` must carry exactly the keys
 * of `enElements`; the type makes a missing or an extra key a compile error.
 */
export const enElements = {
  /* anchorMap */
  "elements.anchorMap.activeWithoutAnchors":
    "Active, but no entry point in code — changes cannot be traced to this record.",
  "elements.anchorMap.noAnchors": "No entry point in code.",
  "elements.anchorMap.head": "{{entries}} in {{files}}.",
  "elements.anchorMap.entryPoints.one": "{{count}} entry point",
  "elements.anchorMap.entryPoints.other": "{{count}} entry points",
  "elements.anchorMap.files.one": "{{count}} file",
  "elements.anchorMap.files.other": "{{count}} files",
  "elements.anchorMap.driftedFiles.one": "{{count}} file changed, the record did not.",
  "elements.anchorMap.driftedFiles.other": "{{count}} files changed, the record did not.",

  /* clauseSheet */
  "elements.clauseSheet.clauseN": "Clause {{n}}",
  "elements.clauseSheet.must": "MUST",
  "elements.clauseSheet.should": "SHOULD",
  "elements.clauseSheet.may": "MAY",
  "elements.clauseSheet.noWording": "no wording",
  "elements.clauseSheet.noMeasure": "no measure named — compliance cannot be checked",
  "elements.clauseSheet.empty": "No clause recorded.",
  "elements.clauseSheet.head": "{{total}} clauses · {{binding}} binding.",
  "elements.clauseSheet.unmeasured": "{{count}} without a measure.",
  "elements.clauseSheet.allMeasured": "Each has a measure.",

  /* companion */
  "elements.companion.inRegister": "IN THE REGISTER ↑",
  "elements.companion.clear": "clear",
  "elements.companion.placeholder": "Ask about records or code",
  "elements.companion.send": "Ask",
  "elements.companion.model": "Model",
  "elements.companion.shrink": "shrink",
  "elements.companion.fullscreen": "fullscreen",
  "elements.companion.close": "close",
  "elements.companion.read": "READ",
  "elements.companion.openDetail": "OPEN DETAIL →",
  "elements.companion.notReady": "NOT READY",
  "elements.companion.workingLabel": "working",
  "elements.companion.working": "WORKING",
  "elements.companion.stop": "Stop",
  "elements.companion.thinking": "THINKING",
  "elements.companion.tools": "TOOLS",
  "elements.companion.reading": "READING",
  "elements.companion.waiting": "WAITING",
  "elements.companion.withdraw": "withdraw",

  /* coverageRing */
  "elements.coverageRing.label": "{{value}} of {{total}} promises with a mapped test",

  /* dependencyFan */
  "elements.dependencyFan.head": "{{links}} between {{records}} records.",
  "elements.dependencyFan.links.one": "{{count}} reference",
  "elements.dependencyFan.links.other": "{{count}} references",
  "elements.dependencyFan.ghostLinks.one": "{{count}} reference points to an id without a record.",
  "elements.dependencyFan.ghostLinks.other":
    "{{count}} references point to an id without a record.",
  "elements.dependencyFan.empty": "No record depends on another.",
  "elements.dependencyFan.upstream": "depends on",
  "elements.dependencyFan.downstream": "carries",
  "elements.dependencyFan.noRecord": "no record",

  /* depthLadder */
  "elements.depthLadder.answer": "Answer",
  "elements.depthLadder.evidence": "Evidence",
  "elements.depthLadder.rawSource": "Raw source",
  "elements.depthLadder.label": "Depth ladder",
  "elements.depthLadder.hint": "→ deeper · ← back",

  /* entryCards */
  "elements.entryCards.empty": "Nothing to show.",

  /* errorState */
  "elements.errorState.retry": "read again",
  "elements.errorState.unknown": "Unknown error while reading.",
  "elements.errorState.line": "Line {{line}}",

  /* evidenceLedger */
  "elements.evidenceLedger.kind.measurement": "Measurement",
  "elements.evidenceLedger.kind.survey": "Survey",
  "elements.evidenceLedger.kind.incident": "Incident",
  "elements.evidenceLedger.kind.review": "Review",
  "elements.evidenceLedger.kind.benchmark": "Benchmark",
  "elements.evidenceLedger.noDate": "no date",
  "elements.evidenceLedger.noKind": "no kind",
  "elements.evidenceLedger.noNote": "no note",
  "elements.evidenceLedger.empty": "No evidence — this assumption is an assertion.",
  "elements.evidenceLedger.noReadableDate.one":
    "{{count}} piece of evidence, none with a readable date.",
  "elements.evidenceLedger.noReadableDate.other":
    "{{count}} pieces of evidence, none with a readable date.",
  "elements.evidenceLedger.head": "{{evidence}} · most recent {{age}} ago.",
  "elements.evidenceLedger.pieces.one": "{{count}} piece of evidence",
  "elements.evidenceLedger.pieces.other": "{{count}} pieces of evidence",
  "elements.evidenceLedger.months.one": "{{count}} month",
  "elements.evidenceLedger.months.other": "{{count}} months",
  "elements.evidenceLedger.stale.one": "Unchecked for more than {{count}} month.",
  "elements.evidenceLedger.stale.other": "Unchecked for more than {{count}} months.",

  /* fieldSheet */
  "elements.fieldSheet.sensitivity.pii": "personal data",
  "elements.fieldSheet.sensitivity.sensitive": "sensitive",
  "elements.fieldSheet.sensitivity.internal": "internal",
  "elements.fieldSheet.sensitivity.public": "public",
  "elements.fieldSheet.fieldN": "Field {{n}}",
  "elements.fieldSheet.noType": "no type",
  "elements.fieldSheet.notStated": "not stated",
  "elements.fieldSheet.noRetention": "no retention set",
  "elements.fieldSheet.empty": "No fields described.",
  "elements.fieldSheet.head": "{{total}} fields · {{pii}} with personal data.",
  "elements.fieldSheet.noPii": "{{total}} fields, none with personal data.",
  "elements.fieldSheet.openRetention": "{{count}} of them without retention.",
  "elements.fieldSheet.allRetained": "Each of them has a retention.",

  /* groupTiles */
  "elements.groupTiles.noun": "groups",
  "elements.groupTiles.unit": "records",
  "elements.groupTiles.shareNoun": "with a mapped test",
  "elements.groupTiles.empty": "Nothing to show.",
  "elements.groupTiles.shareLabel": "{{label}}: {{proven}} of {{total}} {{shareNoun}}",
  "elements.groupTiles.nothingMeasured": "nothing measured",
  "elements.groupTiles.caption": "{{total}} {{unit}} in {{groups}} {{noun}}.",

  /* indexProgress */
  "elements.indexProgress.step.connect": "Connection",
  "elements.indexProgress.step.config": "Configuration",
  "elements.indexProgress.step.records": "Read records",
  "elements.indexProgress.step.enumerate": "Count files",
  "elements.indexProgress.step.index": "Find anchors",
  "elements.indexProgress.step.model": "Build model",
  "elements.indexProgress.title.connect": "Waiting for the facet server",
  "elements.indexProgress.title.config": "Reading the project configuration",
  "elements.indexProgress.title.records": "Reading the records",
  "elements.indexProgress.title.enumerate": "Counting the files in the repo",
  "elements.indexProgress.title.index": "Searching the entry points in code",
  "elements.indexProgress.title.model": "Building the model",
  "elements.indexProgress.title.ready": "Corpus is ready",
  "elements.indexProgress.progressLabel": "{{done}} of {{total}} — {{title}}",
  "elements.indexProgress.registry": "Registry {{name}}",
  "elements.indexProgress.up": "up",
  "elements.indexProgress.anchorsCount": "{{count}} anchors",
  "elements.indexProgress.recordsCount": "{{count}} records",
  "elements.indexProgress.caption.connect": "The server reads the repo as soon as it answers.",
  "elements.indexProgress.caption.config":
    "Records, schema and source directories come from the configuration.",
  "elements.indexProgress.caption.recordsOf": "{{done}} of {{total}} records read",
  "elements.indexProgress.caption.records": "{{count}} records read",
  "elements.indexProgress.caption.enumerate": "{{count}} files found",
  "elements.indexProgress.caption.indexOf":
    "{{done}} of {{total}} files searched · {{anchors}} anchors",
  "elements.indexProgress.caption.index": "{{files}} files searched · {{anchors}} anchors",
  "elements.indexProgress.caption.done":
    "{{records}} records · {{files}} files · {{anchors}} anchors",

  /* knowledgeSlots */
  "elements.knowledgeSlots.noQuestion": "no question formulated",
  "elements.knowledgeSlots.open": "open — there is no answer to this yet",
  "elements.knowledgeSlots.noDerivation": "without derivation",
  "elements.knowledgeSlots.empty": "No knowledge recorded.",
  "elements.knowledgeSlots.allAnswered.one": "{{count}} question, answered.",
  "elements.knowledgeSlots.allAnswered.other": "{{count}} questions, all answered.",
  "elements.knowledgeSlots.someOpen.one": "{{count}} question · {{open}} open.",
  "elements.knowledgeSlots.someOpen.other": "{{count}} questions · {{open}} open.",

  /* lifecycleBadge */
  "elements.lifecycleBadge.age": "{{days}} d",
  "elements.lifecycleBadge.sinceDays.one": "for {{count}} day",
  "elements.lifecycleBadge.sinceDays.other": "for {{count}} days",
  "elements.lifecycleBadge.supersededBy": "superseded by {{id}}",

  /* proofMatrix */
  "elements.proofMatrix.noTest": "no test mapped",
  "elements.proofMatrix.tests.one": "{{count}} test",
  "elements.proofMatrix.tests.other": "{{count}} tests",
  "elements.proofMatrix.empty": "No promise described.",
  "elements.proofMatrix.allMapped": "All {{count}} promises have a mapped test.",
  "elements.proofMatrix.someMapped":
    "{{proven}} of {{total}} promises have a mapped test — {{gap}}.",
  "elements.proofMatrix.gap.one": "one without a test",
  "elements.proofMatrix.gap.other": "{{count}} without a test",

  /* recordPicker */
  "elements.recordPicker.placeholder": "Records, promises, tests, code paths …",
  "elements.recordPicker.noMatchFor":
    "Nothing found for “{{query}}” — neither record nor promise, test or code path.",
  "elements.recordPicker.typeToSearch": "Type to search.",
  "elements.recordPicker.searchLabel": "Search records, promises, tests and code paths",

  /* restCloud */
  "elements.restCloud.entryOne": "further entry",
  "elements.restCloud.entryMany": "further entries",
  "elements.restCloud.collapse": "{{count}} {{noun}} — collapse",
  "elements.restCloud.expand": "{{count}} {{noun}} — expand",

  /* recordSource */
  "elements.recordSource.lines.one": "{{count}} line",
  "elements.recordSource.lines.other": "{{count}} lines",

  /* roleGate */
  "elements.roleGate.headline": "What are you here for?",
  "elements.roleGate.sub": "Sets the order, not the access. Switchable at any time.",
  "elements.roleGate.skip": "continue without choosing",

  /* scanValue */
  "elements.scanValue.fromScan": "from the repo scan, not from the record",
  "elements.scanValue.fromHost": "supplied by the host, not from the record",

  /* scenarioLedger */
  "elements.scenarioLedger.before": "before",
  "elements.scenarioLedger.after": "after",
  "elements.scenarioLedger.noStateChange": "no state change described",
  "elements.scenarioLedger.noReason": "no reason given",
  "elements.scenarioLedger.unbackedUnblockedBy": "No evidence — {{reason}} · resolved by {{by}}",
  "elements.scenarioLedger.unbacked": "No evidence — {{reason}}",
  "elements.scenarioLedger.notExplained":
    "Not explained — this registry does not use @facet-proves: yet.",
  "elements.scenarioLedger.gap": "Test mapped, but no anchor claims this promise.",
  "elements.scenarioLedger.unclaimed": "No anchor fulfils it.",
  "elements.scenarioLedger.mapped": "Test mapped",
  "elements.scenarioLedger.noTest": "without a test",
  "elements.scenarioLedger.noTestNamed": "no test named",
  "elements.scenarioLedger.empty": "No promise described.",
  "elements.scenarioLedger.caption":
    "{{total}} promises · {{proven}} with a mapped test · {{tests}}.",
  "elements.scenarioLedger.tests.one": "{{count}} test",
  "elements.scenarioLedger.tests.other": "{{count}} tests",

  /* seal */
  "elements.seal.stripe": "{{facet}} — {{state}}",
  "elements.seal.filled": "filled",
  "elements.seal.empty": "empty",
  "elements.seal.summary": "{{count}} of 7 facets filled: {{names}}",
  "elements.seal.none": "no facet filled",

  /* segmentBand */
  "elements.segmentBand.empty": "no entries",

  /* signalStack */
  "elements.signalStack.alertN": "Alert {{n}}",
  "elements.signalStack.noCondition": "no condition",
  "elements.signalStack.noSeverity": "no severity",
  "elements.signalStack.noRunbook":
    "no runbook — when this alert fires there is no described way forward",
  "elements.signalStack.noQuery": "no query",
  "elements.signalStack.noWindow": "no time window",
  "elements.signalStack.target": "Target {{target}}",
  "elements.signalStack.noTarget": "no target",
  "elements.signalStack.empty": "Nothing is measured.",
  "elements.signalStack.slos.one": "{{count}} SLO",
  "elements.signalStack.slos.other": "{{count}} SLOs",
  "elements.signalStack.alerts.one": "{{count}} alert",
  "elements.signalStack.alerts.other": "{{count}} alerts",
  "elements.signalStack.alertsWithoutRunbook.one": "{{count}} alert without a runbook.",
  "elements.signalStack.alertsWithoutRunbook.other": "{{count}} alerts without a runbook.",
  "elements.signalStack.allHaveRunbook": "Every alert has a runbook.",

  /* skeleton */
  "elements.skeleton.loading": "loading",

  /* testPyramid */
  "elements.testPyramid.empty": "No tests named.",
  "elements.testPyramid.baseWider": "The base is wider than the top.",
  "elements.testPyramid.topWider":
    "The top is wider than the base — expensive tests carry the load.",
  "elements.testPyramid.caption": "{{tests}} across {{levels}} levels. {{shape}}",
  "elements.testPyramid.tests.one": "{{count}} test",
  "elements.testPyramid.tests.other": "{{count}} tests",

  /* timeline */
  "elements.timeline.unit": "records",
  "elements.timeline.empty": "Nothing is dated.",
  "elements.timeline.nothingCreated": "nothing created",
  "elements.timeline.range": "{{first}} to {{last}}",
  "elements.timeline.peak": "densest period {{name}} with {{count}}",
  "elements.timeline.undated": "{{count}} without a date, not drawn",

  /* trail */
  "elements.trail.label": "Track",

  /* kbd */
  "elements.kbd.command": "Command",
  "elements.kbd.shift": "Shift",
  "elements.kbd.option": "Option",
  "elements.kbd.up": "Arrow up",
  "elements.kbd.down": "Arrow down",
  "elements.kbd.right": "Arrow right",
  "elements.kbd.left": "Arrow left",
} as const;

export const deElements: { readonly [K in keyof typeof enElements]: string } = {
  /* anchorMap */
  "elements.anchorMap.activeWithoutAnchors":
    "Aktiv, aber kein Einstieg im Code — Änderungen lassen sich diesem Record nicht zuordnen.",
  "elements.anchorMap.noAnchors": "Kein Einstieg im Code.",
  "elements.anchorMap.head": "{{entries}} in {{files}}.",
  "elements.anchorMap.entryPoints.one": "{{count}} Einstieg",
  "elements.anchorMap.entryPoints.other": "{{count}} Einstiege",
  "elements.anchorMap.files.one": "{{count}} Datei",
  "elements.anchorMap.files.other": "{{count}} Dateien",
  "elements.anchorMap.driftedFiles.one": "{{count}} Datei hat sich geändert, der Record nicht.",
  "elements.anchorMap.driftedFiles.other":
    "{{count}} Dateien haben sich geändert, der Record nicht.",

  /* clauseSheet */
  "elements.clauseSheet.clauseN": "Klausel {{n}}",
  "elements.clauseSheet.must": "MUSS",
  "elements.clauseSheet.should": "SOLL",
  "elements.clauseSheet.may": "KANN",
  "elements.clauseSheet.noWording": "ohne Wortlaut",
  "elements.clauseSheet.noMeasure": "keine Messgröße benannt — die Einhaltung ist nicht prüfbar",
  "elements.clauseSheet.empty": "Keine Klausel festgehalten.",
  "elements.clauseSheet.head": "{{total}} Klauseln · {{binding}} verpflichtend.",
  "elements.clauseSheet.unmeasured": "{{count}} ohne Messgröße.",
  "elements.clauseSheet.allMeasured": "Jede hat eine Messgröße.",

  /* companion */
  "elements.companion.inRegister": "IM REGISTER ↑",
  "elements.companion.clear": "leeren",
  "elements.companion.placeholder": "Frage zu Records oder Code",
  "elements.companion.send": "Fragen",
  "elements.companion.model": "Modell",
  "elements.companion.shrink": "verkleinern",
  "elements.companion.fullscreen": "vollbild",
  "elements.companion.close": "schließen",
  "elements.companion.read": "GELESEN",
  "elements.companion.openDetail": "EINZELHEIT ÖFFNEN →",
  "elements.companion.notReady": "NICHT BEREIT",
  "elements.companion.workingLabel": "arbeitet",
  "elements.companion.working": "ARBEITET",
  "elements.companion.stop": "Stopp",
  "elements.companion.thinking": "DENKT",
  "elements.companion.tools": "WERKZEUGE",
  "elements.companion.reading": "LIEST",
  "elements.companion.waiting": "WARTET",
  "elements.companion.withdraw": "zurückziehen",

  /* coverageRing */
  "elements.coverageRing.label": "{{value}} von {{total}} Zusagen mit Testzuordnung",

  /* dependencyFan */
  "elements.dependencyFan.head": "{{links}} zwischen {{records}} Records.",
  "elements.dependencyFan.links.one": "{{count}} Verweis",
  "elements.dependencyFan.links.other": "{{count}} Verweise",
  "elements.dependencyFan.ghostLinks.one": "{{count}} Verweis zeigt auf eine Kennung ohne Record.",
  "elements.dependencyFan.ghostLinks.other":
    "{{count}} Verweise zeigen auf eine Kennung ohne Record.",
  "elements.dependencyFan.empty": "Kein Record hängt von einem anderen ab.",
  "elements.dependencyFan.upstream": "hängt an",
  "elements.dependencyFan.downstream": "trägt",
  "elements.dependencyFan.noRecord": "ohne Record",

  /* depthLadder */
  "elements.depthLadder.answer": "Antwort",
  "elements.depthLadder.evidence": "Beleg",
  "elements.depthLadder.rawSource": "Rohquelle",
  "elements.depthLadder.label": "Detailstufen",
  "elements.depthLadder.hint": "→ detaillierter · ← zurück",

  /* entryCards */
  "elements.entryCards.empty": "Nichts zu zeigen.",

  /* errorState */
  "elements.errorState.retry": "erneut lesen",
  "elements.errorState.unknown": "Unbekannter Fehler beim Lesen.",
  "elements.errorState.line": "Zeile {{line}}",

  /* evidenceLedger */
  "elements.evidenceLedger.kind.measurement": "Messung",
  "elements.evidenceLedger.kind.survey": "Befragung",
  "elements.evidenceLedger.kind.incident": "Vorfall",
  "elements.evidenceLedger.kind.review": "Durchsicht",
  "elements.evidenceLedger.kind.benchmark": "Vergleichsmessung",
  "elements.evidenceLedger.noDate": "ohne Datum",
  "elements.evidenceLedger.noKind": "ohne Art",
  "elements.evidenceLedger.noNote": "ohne Notiz",
  "elements.evidenceLedger.empty": "Kein Beleg — diese Annahme ist eine Behauptung.",
  "elements.evidenceLedger.noReadableDate.one": "{{count}} Beleg, keiner mit lesbarem Datum.",
  "elements.evidenceLedger.noReadableDate.other": "{{count}} Belege, keiner mit lesbarem Datum.",
  "elements.evidenceLedger.head": "{{evidence}} · zuletzt vor {{age}}.",
  "elements.evidenceLedger.pieces.one": "{{count}} Beleg",
  "elements.evidenceLedger.pieces.other": "{{count}} Belege",
  "elements.evidenceLedger.months.one": "{{count}} Monat",
  "elements.evidenceLedger.months.other": "{{count}} Monaten",
  "elements.evidenceLedger.stale.one": "Seit über {{count}} Monat ungeprüft.",
  "elements.evidenceLedger.stale.other": "Seit über {{count}} Monaten ungeprüft.",

  /* fieldSheet */
  "elements.fieldSheet.sensitivity.pii": "personenbezogen",
  "elements.fieldSheet.sensitivity.sensitive": "sensibel",
  "elements.fieldSheet.sensitivity.internal": "intern",
  "elements.fieldSheet.sensitivity.public": "öffentlich",
  "elements.fieldSheet.fieldN": "Feld {{n}}",
  "elements.fieldSheet.noType": "ohne Typ",
  "elements.fieldSheet.notStated": "ohne Angabe",
  "elements.fieldSheet.noRetention": "keine Aufbewahrung festgelegt",
  "elements.fieldSheet.empty": "Keine Felder beschrieben.",
  "elements.fieldSheet.head": "{{total}} Felder · {{pii}} mit Personenbezug.",
  "elements.fieldSheet.noPii": "{{total}} Felder, keines mit Personenbezug.",
  "elements.fieldSheet.openRetention": "{{count}} davon ohne Aufbewahrung.",
  "elements.fieldSheet.allRetained": "Jedes davon hat eine Aufbewahrung.",

  /* groupTiles */
  "elements.groupTiles.noun": "Gruppen",
  "elements.groupTiles.unit": "Records",
  "elements.groupTiles.shareNoun": "mit Testzuordnung",
  "elements.groupTiles.empty": "Nichts zu zeigen.",
  "elements.groupTiles.shareLabel": "{{label}}: {{proven}} von {{total}} {{shareNoun}}",
  "elements.groupTiles.nothingMeasured": "nichts gemessen",
  "elements.groupTiles.caption": "{{total}} {{unit}} in {{groups}} {{noun}}.",

  /* indexProgress */
  "elements.indexProgress.step.connect": "Verbindung",
  "elements.indexProgress.step.config": "Konfiguration",
  "elements.indexProgress.step.records": "Records lesen",
  "elements.indexProgress.step.enumerate": "Dateien zählen",
  "elements.indexProgress.step.index": "Anker suchen",
  "elements.indexProgress.step.model": "Modell bauen",
  "elements.indexProgress.title.connect": "Warte auf den facet-Server",
  "elements.indexProgress.title.config": "Lese die Projektkonfiguration",
  "elements.indexProgress.title.records": "Lese die Records",
  "elements.indexProgress.title.enumerate": "Zähle die Dateien im Repo",
  "elements.indexProgress.title.index": "Suche die Einstiege im Code",
  "elements.indexProgress.title.model": "Baue das Modell",
  "elements.indexProgress.title.ready": "Korpus steht",
  "elements.indexProgress.progressLabel": "{{done}} von {{total}} — {{title}}",
  "elements.indexProgress.registry": "Registry {{name}}",
  "elements.indexProgress.up": "steht",
  "elements.indexProgress.anchorsCount": "{{count}} Anker",
  "elements.indexProgress.recordsCount": "{{count}} Records",
  "elements.indexProgress.caption.connect": "Der Server liest das Repo, sobald er antwortet.",
  "elements.indexProgress.caption.config":
    "Records, Schema und Quellverzeichnisse kommen aus der Konfiguration.",
  "elements.indexProgress.caption.recordsOf": "{{done}} von {{total}} Records gelesen",
  "elements.indexProgress.caption.records": "{{count}} Records gelesen",
  "elements.indexProgress.caption.enumerate": "{{count}} Dateien gefunden",
  "elements.indexProgress.caption.indexOf":
    "{{done}} von {{total}} Dateien durchsucht · {{anchors}} Anker",
  "elements.indexProgress.caption.index": "{{files}} Dateien durchsucht · {{anchors}} Anker",
  "elements.indexProgress.caption.done":
    "{{records}} Records · {{files}} Dateien · {{anchors}} Anker",

  /* knowledgeSlots */
  "elements.knowledgeSlots.noQuestion": "keine Frage formuliert",
  "elements.knowledgeSlots.open": "offen — hierauf gibt es noch keine Antwort",
  "elements.knowledgeSlots.noDerivation": "ohne Herleitung",
  "elements.knowledgeSlots.empty": "Kein Wissen festgehalten.",
  "elements.knowledgeSlots.allAnswered.one": "{{count}} Frage, alle beantwortet.",
  "elements.knowledgeSlots.allAnswered.other": "{{count}} Fragen, alle beantwortet.",
  "elements.knowledgeSlots.someOpen.one": "{{count}} Frage · {{open}} offen.",
  "elements.knowledgeSlots.someOpen.other": "{{count}} Fragen · {{open}} offen.",

  /* lifecycleBadge */
  "elements.lifecycleBadge.age": "{{days}} T",
  "elements.lifecycleBadge.sinceDays.one": "seit {{count}} Tag",
  "elements.lifecycleBadge.sinceDays.other": "seit {{count}} Tagen",
  "elements.lifecycleBadge.supersededBy": "abgelöst von {{id}}",

  /* proofMatrix */
  "elements.proofMatrix.noTest": "kein Test zugeordnet",
  "elements.proofMatrix.tests.one": "{{count}} Test",
  "elements.proofMatrix.tests.other": "{{count}} Tests",
  "elements.proofMatrix.empty": "Keine Zusage beschrieben.",
  "elements.proofMatrix.allMapped": "Alle {{count}} Zusagen haben eine Testzuordnung.",
  "elements.proofMatrix.someMapped":
    "{{proven}} von {{total}} Zusagen haben eine Testzuordnung — {{gap}}.",
  "elements.proofMatrix.gap.one": "eine ohne Test",
  "elements.proofMatrix.gap.other": "{{count}} ohne Test",

  /* recordPicker */
  "elements.recordPicker.placeholder": "Records, Zusagen, Tests, Codepfade …",
  "elements.recordPicker.noMatchFor":
    "Nichts gefunden zu „{{query}}“ — weder Record noch Zusage, Test oder Codepfad.",
  "elements.recordPicker.typeToSearch": "Tippen, um zu suchen.",
  "elements.recordPicker.searchLabel": "Records, Zusagen, Tests und Codepfade suchen",

  /* restCloud */
  "elements.restCloud.entryOne": "weiterer Eintrag",
  "elements.restCloud.entryMany": "weitere Einträge",
  "elements.restCloud.collapse": "{{count}} {{noun}} — einklappen",
  "elements.restCloud.expand": "{{count}} {{noun}} — aufklappen",

  /* recordSource */
  "elements.recordSource.lines.one": "{{count}} Zeile",
  "elements.recordSource.lines.other": "{{count}} Zeilen",

  /* roleGate */
  "elements.roleGate.headline": "Wofür bist du hier?",
  "elements.roleGate.sub": "Bestimmt die Reihenfolge, nicht den Zugang. Jederzeit umschaltbar.",
  "elements.roleGate.skip": "ohne Auswahl fortfahren",

  /* scanValue */
  "elements.scanValue.fromScan": "aus dem Repo-Scan, nicht aus dem Record",
  "elements.scanValue.fromHost": "vom Host geliefert, nicht aus dem Record",

  /* scenarioLedger */
  "elements.scenarioLedger.before": "vorher",
  "elements.scenarioLedger.after": "nachher",
  "elements.scenarioLedger.noStateChange": "kein Zustandswechsel beschrieben",
  "elements.scenarioLedger.noReason": "kein Grund angegeben",
  "elements.scenarioLedger.unbackedUnblockedBy": "Ohne Beleg — {{reason}} · löst sich mit {{by}}",
  "elements.scenarioLedger.unbacked": "Ohne Beleg — {{reason}}",
  "elements.scenarioLedger.notExplained":
    "Nicht erklärt — diese Registry setzt @facet-proves: noch nicht ein.",
  "elements.scenarioLedger.gap": "Test zugeordnet, aber kein Anker beansprucht diese Zusage.",
  "elements.scenarioLedger.unclaimed": "Kein einlösender Anker.",
  "elements.scenarioLedger.mapped": "Test zugeordnet",
  "elements.scenarioLedger.noTest": "ohne Test",
  "elements.scenarioLedger.noTestNamed": "kein Test benannt",
  "elements.scenarioLedger.empty": "Keine Zusage beschrieben.",
  "elements.scenarioLedger.caption":
    "{{total}} Zusagen · {{proven}} mit Testzuordnung · {{tests}}.",
  "elements.scenarioLedger.tests.one": "{{count}} Test",
  "elements.scenarioLedger.tests.other": "{{count}} Tests",

  /* seal */
  "elements.seal.stripe": "{{facet}} — {{state}}",
  "elements.seal.filled": "befüllt",
  "elements.seal.empty": "leer",
  "elements.seal.summary": "{{count}} von 7 Facetten befüllt: {{names}}",
  "elements.seal.none": "keine Facette befüllt",

  /* segmentBand */
  "elements.segmentBand.empty": "keine Einträge",

  /* signalStack */
  "elements.signalStack.alertN": "Alarm {{n}}",
  "elements.signalStack.noCondition": "ohne Bedingung",
  "elements.signalStack.noSeverity": "ohne Schwere",
  "elements.signalStack.noRunbook":
    "keine Anleitung — im Alarmfall gibt es keinen beschriebenen Weg",
  "elements.signalStack.noQuery": "ohne Abfrage",
  "elements.signalStack.noWindow": "ohne Zeitfenster",
  "elements.signalStack.target": "Ziel {{target}}",
  "elements.signalStack.noTarget": "ohne Ziel",
  "elements.signalStack.empty": "Nichts wird gemessen.",
  "elements.signalStack.slos.one": "{{count}} SLO",
  "elements.signalStack.slos.other": "{{count}} SLOs",
  "elements.signalStack.alerts.one": "{{count}} Alarm",
  "elements.signalStack.alerts.other": "{{count}} Alarme",
  "elements.signalStack.alertsWithoutRunbook.one": "{{count}} Alarm ohne Anleitung.",
  "elements.signalStack.alertsWithoutRunbook.other": "{{count}} Alarme ohne Anleitung.",
  "elements.signalStack.allHaveRunbook": "Jeder Alarm hat eine Anleitung.",

  /* skeleton */
  "elements.skeleton.loading": "lädt",

  /* testPyramid */
  "elements.testPyramid.empty": "Keine Tests benannt.",
  "elements.testPyramid.baseWider": "Die Grundlage ist breiter als die Spitze.",
  "elements.testPyramid.topWider":
    "Die Spitze ist breiter als die Grundlage — teure Tests tragen die Last.",
  "elements.testPyramid.caption": "{{tests}} über {{levels}} Ebenen. {{shape}}",
  "elements.testPyramid.tests.one": "{{count}} Test",
  "elements.testPyramid.tests.other": "{{count}} Tests",

  /* timeline */
  "elements.timeline.unit": "Records",
  "elements.timeline.empty": "Nichts ist datiert.",
  "elements.timeline.nothingCreated": "nichts angelegt",
  "elements.timeline.range": "{{first}} bis {{last}}",
  "elements.timeline.peak": "dichtester Abschnitt {{name}} mit {{count}}",
  "elements.timeline.undated": "{{count}} ohne Datum, nicht gezeichnet",

  /* trail */
  "elements.trail.label": "Spur",

  /* kbd */
  "elements.kbd.command": "Befehl",
  "elements.kbd.shift": "Umschalt",
  "elements.kbd.option": "Wahl",
  "elements.kbd.up": "Pfeil hoch",
  "elements.kbd.down": "Pfeil runter",
  "elements.kbd.right": "Pfeil rechts",
  "elements.kbd.left": "Pfeil links",
};
