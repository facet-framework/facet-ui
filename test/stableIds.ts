export function stableIds<T extends Node>(node: T): T {
  const clone = node.cloneNode(true) as T;
  const seen = new Map<string, string>();

  const stable = (value: string) =>
    value.replace(/_r_[0-9a-z]+_/gi, (match) => {
      if (!seen.has(match)) seen.set(match, `_id${seen.size}_`);
      return seen.get(match) as string;
    });

  const walk = (element: Element) => {
    for (const attribute of Array.from(element.attributes)) {
      const next = stable(attribute.value);
      if (next !== attribute.value) element.setAttribute(attribute.name, next);
    }
    Array.from(element.children).forEach(walk);
  };

  if (clone instanceof Element) walk(clone);
  return clone;
}
