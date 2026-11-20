import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { SchemaField } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { FieldSheetProps, FieldView } from "./FieldSheet";

export type WithFieldSheetProps = Omit<
  FieldSheetProps,
  "containerStyle" | "captionStyle" | "fields" | "caption"
> & {
  fields: SchemaField[];
  /** Only fields with personal data. */
  onlyPii?: boolean;
  style?: CSSProperties;
};

const SENSITIVITY_KEY = {
  pii: "elements.fieldSheet.sensitivity.pii",
  sensitive: "elements.fieldSheet.sensitivity.sensitive",
  internal: "elements.fieldSheet.sensitivity.internal",
  public: "elements.fieldSheet.sensitivity.public",
} as const;

const isKnownSensitivity = (value: string): value is keyof typeof SENSITIVITY_KEY =>
  Object.prototype.hasOwnProperty.call(SENSITIVITY_KEY, value);

/** Orders fields, translates sensitivity and finds fields without retention. */
export function withFieldSheetLogic(Component: ComponentType<FieldSheetProps>) {
  const Wrapped = ({ fields, onlyPii, style, ...rest }: WithFieldSheetProps) => {
    const { t } = useText();
    const isPii = (field: SchemaField) =>
      field.sensitivity === "pii" || field.sensitivity === "sensitive";

    const visible = useMemo(() => (onlyPii ? fields.filter(isPii) : fields), [fields, onlyPii]);

    const views = useMemo<FieldView[]>(
      () =>
        visible.map((field, index) => {
          const open = isPii(field) && !field.retention;
          return {
            key: `${field.name || index}`,
            name: field.name || t("elements.fieldSheet.fieldN", { n: index + 1 }),
            type: field.type || t("elements.fieldSheet.noType"),
            sensitivity: field.sensitivity
              ? isKnownSensitivity(field.sensitivity)
                ? t(SENSITIVITY_KEY[field.sensitivity])
                : field.sensitivity
              : t("elements.fieldSheet.notStated"),
            retention: field.retention
              ? String(field.retention)
              : open
                ? t("elements.fieldSheet.noRetention")
                : "—",
            open,
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 96px 128px 148px",
              gap: 10,
              alignItems: "baseline",
              padding: "7px 0",
              borderTopStyle: "solid",
              borderTopWidth: 1,
              borderTopColor: color.line,
              minWidth: 0,
            },
            nameStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.meta,
              color: color.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            typeStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: color.dim,
              whiteSpace: "nowrap",
            },
            sensitivityStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: isPii(field) ? color.ink : color.faint,
              fontWeight: isPii(field) ? 500 : 400,
              whiteSpace: "nowrap",
            },
            retentionStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: open ? color.signal : color.soft,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          };
        }),
      [visible, t],
    );

    const caption = useMemo(() => {
      if (!fields.length) return t("elements.fieldSheet.empty");
      const pii = fields.filter(isPii).length;
      const open = fields.filter((field) => isPii(field) && !field.retention).length;
      const head = t("elements.fieldSheet.head", { total: fields.length, pii });
      if (!pii) return t("elements.fieldSheet.noPii", { total: fields.length });
      return open
        ? `${head} ${t("elements.fieldSheet.openRetention", { count: open })}`
        : `${head} ${t("elements.fieldSheet.allRetained")}`;
    }, [fields, t]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 0, minWidth: 0, ...style }),
      [style],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: "0 0 6px",
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: color.ink,
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        captionStyle={captionStyle}
        fields={views}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withFieldSheetLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
