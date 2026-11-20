import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/FieldSheet/FieldSheet.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { SchemaField } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { FieldSheetProps, FieldView } from "./FieldSheet";

export type WithFieldSheetProps = Omit<
  FieldSheetProps,
  "containerStyle" | "captionStyle" | "fields" | "caption"
> & {
  fields: SchemaField[];

  onlyPii?: boolean;
  style?: CSSProperties;
};

const SENSITIVITY_LABEL: Record<string, string> = {
  pii: labelText.text297,
  sensitive: labelText.text299,
  internal: labelText.extra26,
  public: localized.text1,
};

export function withFieldSheetLogic(Component: ComponentType<FieldSheetProps>) {
  const Wrapped = ({ fields, onlyPii, style, ...rest }: WithFieldSheetProps) => {
    const isPii = (field: SchemaField) =>
      field.sensitivity === "pii" || field.sensitivity === "sensitive";

    const visible = useMemo(() => (onlyPii ? fields.filter(isPii) : fields), [fields, onlyPii]);

    const views = useMemo<FieldView[]>(
      () =>
        visible.map((field, index) => {
          const open = isPii(field) && !field.retention;
          return {
            key: `${field.name || index}`,
            name: field.name || `${labelText.text300}${index + 1}`,
            type: field.type || localized.text2,
            sensitivity: field.sensitivity
              ? (SENSITIVITY_LABEL[field.sensitivity] ?? field.sensitivity)
              : localized.text3,
            retention: field.retention ? String(field.retention) : open ? localized.text4 : "—",
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
      [visible],
    );

    const caption = useMemo(() => {
      if (!fields.length) return localized.text5;
      const pii = fields.filter(isPii).length;
      const open = fields.filter((field) => isPii(field) && !field.retention).length;
      const head = `${fields.length}${labelText.text301}${pii}${localized.text6}`;
      if (!pii) return `${fields.length}${localized.text7}`;
      return open ? `${head} ${open}${localized.text8}` : `${head}${localized.text9}`;
    }, [fields]);

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
