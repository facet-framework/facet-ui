import { Icon } from "../../primitives/Icon";
import { IconButton } from "../../primitives/controls";
import { Finding, Meter, Skeleton } from "../../primitives/display";
import { useText } from "../../i18n/TextProvider";
import type { TextKey } from "../../i18n/en";
import { Sparkline } from "./charts";
import type { ContentGroup, ContentKind, ContentKindKey } from "./model";

export type ContentsHubProps = {
  state: "ready" | "loading";
  kinds: ContentKind[];

  headline?: { records: number; open: number; sentence: string };
  onOpen?: (key: ContentKindKey, view?: string) => void;

  pinned?: readonly ContentKindKey[];

  onPin?: (key: ContentKindKey, pin: boolean) => void;
};

const GROUP_LABEL: Record<ContentGroup, TextKey | null> = {
  Registry: null,
  Evidence: "c.group.evidence",
  Code: null,
  Context: "c.group.context",
};

export function useGroupLabel() {
  const { t } = useText();
  return (g: ContentGroup) => {
    const key = GROUP_LABEL[g];
    return key ? t(key) : g;
  };
}
const GROUPS: ContentGroup[] = ["Registry", "Evidence", "Code", "Context"];

export const hubGroupId = (g: ContentGroup) => `contents-${g.toLowerCase()}`;

export function ContentsHub({ state, kinds, headline, onOpen, pinned, onPin }: ContentsHubProps) {
  const { t, plural, number } = useText();
  const groupLabel = useGroupLabel();
  const loading = state === "loading";
  return (
    <div className="t-page t-c-hub" data-testid="contents-hub" aria-busy={loading || undefined}>
      <Finding
        eyebrow={loading ? t("c.hub.eyebrowLoading") : plural("c.hub.eyebrow", kinds.length)}
        figure={loading || !headline ? "—" : number(headline.records)}
        sentence={loading || !headline ? t("c.hub.counting") : headline.sentence}
        lead={loading || !headline ? t("c.hub.leadLoading") : plural("c.hub.lead", headline.open)}
      />
      {GROUPS.map((g) => {
        const list = loading
          ? Array.from({ length: g === "Registry" ? 6 : g === "Evidence" ? 4 : 2 }, () => null)
          : kinds.filter((k) => k.group === g);
        if (!list.length) return null;
        const label = groupLabel(g);
        return (
          <section
            key={g}
            id={hubGroupId(g)}
            className="t-c-hub__group"
            aria-label={label}
            data-testid={`hub-group-${g}`}
          >
            <h2 className="t-c-hub__group-title">
              <span>{label}</span>
              <span className="t-meta">{loading ? "—" : list.length}</span>
            </h2>
            <ul className="t-c-hub__grid t-stagger">
              {list.map((k, i) =>
                k ? (
                  <li key={k.key}>
                    <KindTile
                      kind={k}
                      onOpen={onOpen}
                      pinned={pinned?.includes(k.key) ?? false}
                      onPin={onPin}
                    />
                  </li>
                ) : (
                  <li key={i} className="t-c-tile t-c-tile--skel">
                    <Skeleton width={28} height={28} radius={8} />
                    <Skeleton width="55%" height={14} />
                    <Skeleton width={72} height={34} />
                    <Skeleton width="90%" height={10} />
                    <Skeleton width="70%" height={10} />
                  </li>
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function KindTile({
  kind: k,
  onOpen,
  pinned,
  onPin,
}: {
  kind: ContentKind;
  onOpen?: ContentsHubProps["onOpen"];
  pinned: boolean;
  onPin?: ContentsHubProps["onPin"];
}) {
  const { t, number } = useText();
  return (
    <article className="t-c-tile t-interactive" data-testid={`kind-${k.key}`}>
      <button type="button" className="t-c-tile__open" onClick={() => onOpen?.(k.key)}>
        <span className="t-c-tile__top">
          <span className="t-c-tile__icon">
            <Icon name={k.icon} size={18} />
          </span>
          <span className="t-c-tile__label">{k.label}</span>
          {k.finding ? (
            <span
              className={`t-badge${k.tone && k.tone !== "neutral" ? ` t-badge--${k.tone}` : ""}`}
            >
              {k.finding}
            </span>
          ) : null}
        </span>
        <span className="t-c-tile__figure">
          {k.count == null ? (
            <span className="t-muted" title={t("c.notMeasured")}>
              —
            </span>
          ) : (
            number(k.count)
          )}
          <small>{k.unit}</small>
        </span>
        <span className="t-c-tile__desc">{k.desc}</span>
      </button>
      <div className="t-c-tile__foot">
        {k.share !== undefined ? (
          <Meter
            value={k.share}
            thin
            label={t("c.hub.share", { kind: k.label })}
            tone={k.tone === "warn" ? "warn" : "ok"}
          />
        ) : k.spark ? (
          <Sparkline
            values={k.spark}
            label={t("c.hub.trend", { kind: k.label })}
            width={120}
            height={22}
          />
        ) : (
          <span />
        )}
        <span className="t-c-tile__views">
          {k.views.map((v) => (
            <button
              key={v.id}
              type="button"
              className="t-c-tile__view"
              onClick={() => onOpen?.(k.key, v.id)}
            >
              {v.label}
            </button>
          ))}
        </span>
        {}
        {onPin && k.key !== "glossary" ? (
          <IconButton
            icon="pin"
            size="small"
            className="t-c-tile__pin"
            label={t("c.hub.pin", { kind: k.label })}
            pressed={pinned}
            data-testid={`pin-${k.key}`}
            onClick={() => onPin(k.key, !pinned)}
          />
        ) : null}
      </div>
    </article>
  );
}
