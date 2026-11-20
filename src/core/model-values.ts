import type { YamlValue } from "./yaml";

export function asRecord(value: YamlValue | undefined): Record<string, YamlValue> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, YamlValue>)
    : {};
}

export function asArray<T>(value: YamlValue | undefined): T[] {
  return Array.isArray(value) ? (value as unknown as T[]) : [];
}

export function asString(value: YamlValue | undefined): string {
  return value == null ? "" : String(value);
}

export function humanize(segment: string): string {
  const s = String(segment ?? "")
    .replace(/[-_]/g, " ")
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
