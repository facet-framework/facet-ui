import type { CSSProperties } from "react";

export type FieldView = {
  key: string;
  name: string;
  type: string;
  /** Sensitivity as a word, e.g. "personal data". */
  sensitivity: string;
  /** Retention — or the note that none is set. */
  retention: string;
  /** Personal data without retention: the finding of this compartment. */
  open: boolean;
  rowStyle: CSSProperties;
  nameStyle: CSSProperties;
  typeStyle: CSSProperties;
  sensitivityStyle: CSSProperties;
  retentionStyle: CSSProperties;
};

export type FieldSheetProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  fields: FieldView[];
  caption: string;
  "data-testid"?: string;
};

/**
 * Data fields of a data object: name, type, sensitivity, retention. A
 * personal-data field without a retention period is an open item.
 */
export function FieldSheet({
  containerStyle,
  captionStyle,
  fields,
  caption,
  ...rest
}: FieldSheetProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {fields.map((field) => (
        <div key={field.key} style={field.rowStyle} data-field={field.name}>
          <span style={field.nameStyle}>{field.name}</span>
          <span style={field.typeStyle}>{field.type}</span>
          <span style={field.sensitivityStyle}>{field.sensitivity}</span>
          <span style={field.retentionStyle}>{field.retention}</span>
        </div>
      ))}
    </div>
  );
}

export default FieldSheet;
