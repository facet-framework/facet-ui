/**
 * Feature records of an invented shipping product, in the shape a
 * feature registry exports: one record per named capability, with its
 * scenarios, the code that implements it and how far the two have drifted.
 */

export type Lifecycle = "active" | "planned" | "deprecated";
export type Drift = "none" | "minor" | "major" | null;

export type Scenario = { given: string; when: string; then: string; verified: boolean };

export type FeatureRecord = {
  id: string;
  title: string;
  domain: string;
  lifecycle: Lifecycle;
  owner: string;
  summary: string;
  scenarios: Scenario[];
  anchors: string[];
  /** `null`: drift has not been measured for this record. */
  drift: Drift;
  updated: string;
  questions?: string[];
};

const sc = (given: string, when: string, then: string, verified = true): Scenario => ({
  given,
  when,
  then,
  verified,
});

export const records: FeatureRecord[] = [
  {
    id: "checkout/payment/card",
    title: "Card payment",
    domain: "Checkout",
    lifecycle: "active",
    owner: "Mara Quist",
    summary:
      "Customers pay for a label with a credit or debit card; 3-D Secure runs when the bank asks for it.",
    scenarios: [
      sc("a valid card", "the customer pays", "the label is issued and a receipt is sent"),
      sc(
        "a card that needs 3-D Secure",
        "the customer pays",
        "the bank challenge opens before charging",
      ),
      sc("a declined card", "the customer pays", "no label is issued and the reason is shown"),
      sc("a timeout from the provider", "the customer pays", "the charge is retried once", false),
    ],
    anchors: ["src/checkout/payment/card.ts", "src/checkout/payment/threeDs.ts"],
    drift: "none",
    updated: "2026-11-19",
  },
  {
    id: "checkout/payment/wallet",
    title: "Wallet payment",
    domain: "Checkout",
    lifecycle: "active",
    owner: "Mara Quist",
    summary: "Apple Pay and Google Pay on supported devices.",
    scenarios: [
      sc("a device with a wallet", "checkout opens", "the wallet button is offered first"),
      sc("a cancelled wallet sheet", "the customer returns", "the cart is unchanged"),
    ],
    anchors: ["src/checkout/payment/wallet.ts"],
    drift: "minor",
    updated: "2026-11-02",
    questions: ["Should wallets be offered for business accounts?"],
  },
  {
    id: "checkout/pricing/live-rates",
    title: "Live carrier rates",
    domain: "Checkout",
    lifecycle: "active",
    owner: "Jon Ekberg",
    summary: "Prices come from the carriers at the moment of checkout and are held for 15 minutes.",
    scenarios: [
      sc("a parcel and a route", "rates are requested", "each carrier's price is listed"),
      sc("a held price older than 15 minutes", "the customer pays", "the price is requested again"),
      sc("a carrier that does not answer", "rates are requested", "the others are still listed"),
    ],
    anchors: ["src/checkout/pricing/rates.ts", "src/carriers/client.ts"],
    drift: "major",
    updated: "2026-10-14",
  },
  {
    id: "checkout/labels/batch",
    title: "Batch labels",
    domain: "Checkout",
    lifecycle: "planned",
    owner: "Jon Ekberg",
    summary: "Upload a CSV of up to 500 parcels and pay once for all labels.",
    scenarios: [
      sc("a CSV with 500 rows", "it is uploaded", "every row is validated before payment", false),
      sc(
        "a row with an unknown postcode",
        "it is uploaded",
        "that row is marked and can be fixed",
        false,
      ),
    ],
    anchors: [],
    drift: null,
    updated: "2026-11-20",
    questions: ["What is the limit for business accounts?"],
  },
  {
    id: "tracking/timeline/events",
    title: "Tracking timeline",
    domain: "Tracking",
    lifecycle: "active",
    owner: "Ines Arda",
    summary: "Every carrier scan appears as one event with place and time.",
    scenarios: [
      sc("a parcel with scans", "the tracking page opens", "scans are listed newest first"),
      sc(
        "two carriers for one parcel",
        "the page opens",
        "both carriers' scans are merged by time",
      ),
      sc("a scan without a place", "the page opens", "the event shows the time only"),
    ],
    anchors: ["src/tracking/timeline.tsx", "src/tracking/merge.ts"],
    drift: "none",
    updated: "2026-11-18",
  },
  {
    id: "tracking/eta/prediction",
    title: "Delivery estimate",
    domain: "Tracking",
    lifecycle: "active",
    owner: "Ines Arda",
    summary: "A delivery window predicted from the carrier's history on the same route.",
    scenarios: [
      sc("a route with history", "a parcel is scanned", "the window narrows to two hours"),
      sc(
        "a route without history",
        "a parcel is scanned",
        "the carrier's own estimate is shown",
        false,
      ),
    ],
    anchors: ["src/tracking/eta.ts"],
    drift: "minor",
    updated: "2026-11-09",
  },
  {
    id: "tracking/map/live",
    title: "Live map",
    domain: "Tracking",
    lifecycle: "planned",
    owner: "Ines Arda",
    summary: "The courier's position on a map during the last mile.",
    scenarios: [
      sc(
        "a courier sharing location",
        "the parcel is out for delivery",
        "the map shows the courier",
        false,
      ),
    ],
    anchors: [],
    drift: null,
    updated: "2026-11-21",
  },
  {
    id: "tracking/share/link",
    title: "Share tracking",
    domain: "Tracking",
    lifecycle: "active",
    owner: "Ola Brandt",
    summary: "A public link to the tracking page without signing in.",
    scenarios: [
      sc("a parcel", "the sender copies the link", "anyone with the link sees the timeline"),
      sc(
        "a delivered parcel older than 30 days",
        "the link opens",
        "the page says the link expired",
      ),
    ],
    anchors: ["src/tracking/share.ts"],
    drift: "none",
    updated: "2026-11-11",
  },
  {
    id: "accounts/auth/passkeys",
    title: "Passkey sign-in",
    domain: "Accounts",
    lifecycle: "active",
    owner: "Ola Brandt",
    summary: "Sign in with a passkey; passwords stay available as a fallback.",
    scenarios: [
      sc("a registered passkey", "the user signs in", "no password is asked"),
      sc("a new device", "the user signs in", "the passkey from the phone can be used"),
      sc("a removed passkey", "the user signs in with it", "sign-in is refused"),
    ],
    anchors: ["src/accounts/auth/passkeys.ts"],
    drift: "none",
    updated: "2026-11-16",
  },
  {
    id: "accounts/auth/password",
    title: "Password sign-in",
    domain: "Accounts",
    lifecycle: "active",
    owner: "Ola Brandt",
    summary: "Email and password with rate limiting.",
    scenarios: [
      sc("a correct password", "the user signs in", "the dashboard opens"),
      sc("five wrong attempts", "the user tries again", "sign-in is paused for 10 minutes"),
    ],
    anchors: ["src/accounts/auth/password.ts"],
    drift: "minor",
    updated: "2026-10-30",
  },
  {
    id: "accounts/team/roles",
    title: "Team roles",
    domain: "Accounts",
    lifecycle: "active",
    owner: "Mara Quist",
    summary: "Owners, shippers and viewers in a business account.",
    scenarios: [
      sc("a viewer", "they open checkout", "paying is not offered"),
      sc("an owner", "they change a role", "the change applies on the next request"),
      sc("the last owner", "they leave the team", "leaving is refused", false),
    ],
    anchors: ["src/accounts/team/roles.ts", "src/accounts/team/guard.ts"],
    drift: "major",
    updated: "2026-10-08",
    questions: ["Can a shipper see invoices?"],
  },
  {
    id: "accounts/billing/invoices",
    title: "Monthly invoices",
    domain: "Accounts",
    lifecycle: "deprecated",
    owner: "Jon Ekberg",
    summary: "One PDF per month; replaced by per-label receipts.",
    scenarios: [sc("a month with labels", "the month ends", "one PDF is created")],
    anchors: ["src/accounts/billing/monthly.ts"],
    drift: null,
    updated: "2026-09-12",
  },
  {
    id: "notifications/email/status",
    title: "Status emails",
    domain: "Notifications",
    lifecycle: "active",
    owner: "Ines Arda",
    summary: "An email when a parcel is picked up, out for delivery and delivered.",
    scenarios: [
      sc("a pickup scan", "it arrives", "the recipient gets one email"),
      sc("two scans within a minute", "they arrive", "only one email is sent"),
    ],
    anchors: ["src/notifications/email.ts"],
    drift: "none",
    updated: "2026-11-15",
  },
  {
    id: "notifications/push/delivery",
    title: "Push on delivery",
    domain: "Notifications",
    lifecycle: "active",
    owner: "Ines Arda",
    summary: "A push message with a photo when the courier leaves the parcel.",
    scenarios: [
      sc("a delivery photo", "the parcel is delivered", "the push shows the photo"),
      sc("push turned off", "the parcel is delivered", "no push is sent"),
    ],
    anchors: ["src/notifications/push.ts"],
    drift: "none",
    updated: "2026-11-17",
  },
  {
    id: "notifications/sms/fallback",
    title: "SMS fallback",
    domain: "Notifications",
    lifecycle: "planned",
    owner: "Ola Brandt",
    summary: "An SMS when no email address is known.",
    scenarios: [sc("only a phone number", "a status changes", "an SMS is sent", false)],
    anchors: [],
    drift: null,
    updated: "2026-11-22",
    questions: ["Which countries are covered first?"],
  },
];

export const weeks = ["W38", "W39", "W40", "W41", "W42", "W43", "W44", "W45", "W46", "W47"];
export const trend = {
  active: [6, 6, 7, 8, 8, 9, 9, 10, 11, 11],
  planned: [7, 7, 6, 5, 6, 5, 5, 4, 3, 3],
  drifted: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
};
