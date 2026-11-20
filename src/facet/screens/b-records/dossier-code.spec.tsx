import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/facet/screens/b-records/dossier-code.spec.text";
import { fireEvent, render as renderInEnglish, screen, within } from "@testing-library/react";
import { renderInGerman as render } from "../../i18n/testing";
import {
  RecordDossierPage,
  type RecordDossier,
  type RecordDossierPageProps,
} from "./RecordDossierPage";
import { SourceEditor, codeZoomLevel, type SourceFile } from "./SourceEditor";
import { languageOf, tokenize } from "./syntax";
import { dossierOf, siblingsOf } from "./storyData";

const TAG = "@fa" + "cet";

function dossierProps(
  record: RecordDossier,
  over: Partial<RecordDossierPageProps> = {},
): RecordDossierPageProps {
  return {
    state: "ready",
    record,
    siblings: siblingsOf(record.id),
    tab: "record",
    now: "2026-11",
    ...over,
  };
}

const adr = dossierOf("workspace/board/column");

const GO_FILE = [
  "package adr",
  "",
  "/* A block comment",
  "   over two lines */",
  `// ${TAG}: workspace/board/column`,
  `// ${TAG}-role: primary`,
  "func Read(path string) error {",
  '\treturn fmt.Errorf("no %s", path) // 42',
  "}",
].join("\n");

function readyFile(over: Partial<SourceFile> = {}): SourceFile {
  return {
    path: "official-plugins/adr/src/read.go",
    line: 5,
    state: "ready",
    text: GO_FILE,
    anchors: [{ line: 5, id: "workspace/board/column", role: "primary" }],
    ...over,
  };
}

describe("record sections navigate", () => {
  let scrolled: Element[];
  beforeEach(() => {
    scrolled = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this);
    };
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it("brings the picked section into view and reports it", () => {
    const onSection = jest.fn();
    render(<RecordDossierPage {...dossierProps(adr, { onSection })} />);
    for (const [name, key] of [
      [germanLabels.text126, "history"],
      [germanLabels.text127, "relations"],
      [remainingText.text132, "operations"],
    ] as const) {
      fireEvent.click(screen.getByRole("link", { name }));
      expect(onSection).toHaveBeenLastCalledWith(key);
      expect(scrolled.at(-1)).toBe(screen.getByTestId(`section-${key}`));
    }
  });

  it("opens at the section named by the address, and not at all without one", () => {
    const { unmount } = render(<RecordDossierPage {...dossierProps(adr)} />);
    expect(scrolled).toHaveLength(0);
    unmount();
    render(<RecordDossierPage {...dossierProps(adr, { section: "operations" })} />);
    expect(scrolled).toEqual([screen.getByTestId("section-operations")]);
    expect(screen.getByRole("link", { name: remainingText.text132 })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("brings a section into view from the phone's chips", () => {
    const onSection = jest.fn();
    render(<RecordDossierPage {...dossierProps(adr, { mobile: true, onSection })} />);
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text126, pressed: false }));
    expect(onSection).toHaveBeenCalledWith("history");
    expect(scrolled.at(-1)).toBe(screen.getByTestId("section-history"));
  });
});

describe("the record button shows the active view", () => {
  it("is pressed in the raw view and leads back to the dossier", () => {
    const onTab = jest.fn();
    const { rerender } = render(<RecordDossierPage {...dossierProps(adr, { onTab })} />);
    const button = () => screen.getByRole("button", { name: "Record ansehen" });
    expect(button()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button());
    expect(onTab).toHaveBeenLastCalledWith("raw");
    rerender(<RecordDossierPage {...dossierProps(adr, { onTab, tab: "raw" })} />);
    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("tab", { name: labelText.text275 })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(button());
    expect(onTab).toHaveBeenLastCalledWith("record");
  });
});

describe("code zoom in the raw view", () => {
  it("offers minus, reset and plus, and sizes only the code", () => {
    const onCodeZoom = jest.fn();
    const { rerender } = render(
      <RecordDossierPage {...dossierProps(adr, { tab: "raw", onCodeZoom })} />,
    );
    const zoom = screen.getByRole("group", { name: localized.text1 });
    expect(within(zoom).getByRole("button", { name: localized.text2 })).toBeDisabled();
    fireEvent.click(within(zoom).getByRole("button", { name: localized.text3 }));
    expect(onCodeZoom).toHaveBeenLastCalledWith(110);

    rerender(
      <RecordDossierPage {...dossierProps(adr, { tab: "raw", onCodeZoom, codeZoom: 150 })} />,
    );
    const code = screen.getByRole("region", { name: "Record als YAML" });
    expect(code.querySelector("pre")).toHaveStyle({ fontSize: "calc(var(--t-fs-12) * 1.5)" });

    expect(screen.getByTestId("dossier")).not.toHaveAttribute("style");
    const z = screen.getByRole("group", { name: localized.text4 });
    expect(within(z).getByRole("button", { name: localized.text5 })).toHaveTextContent("150 %");
    fireEvent.click(within(z).getByRole("button", { name: localized.text6 }));
    expect(onCodeZoom).toHaveBeenLastCalledWith(100);
    fireEvent.click(within(z).getByRole("button", { name: labelText.text276 }));
    expect(onCodeZoom).toHaveBeenLastCalledWith(125);
  });

  it("stops at the smallest and the largest level", () => {
    const { rerender } = render(
      <RecordDossierPage {...dossierProps(adr, { tab: "raw", codeZoom: 80 })} />,
    );
    expect(screen.getByRole("button", { name: labelText.text276 })).toBeDisabled();
    rerender(<RecordDossierPage {...dossierProps(adr, { tab: "raw", codeZoom: 200 })} />);
    expect(screen.getByRole("button", { name: localized.text7 })).toBeDisabled();
  });

  it("snaps an odd stored value to the nearest level", () => {
    expect(codeZoomLevel(133)).toBe(125);
    expect(codeZoomLevel("x")).toBe(100);
    expect(codeZoomLevel(9999)).toBe(200);
  });
});

describe("source view of an anchored file", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it("shows the file under the anchors, with line numbers, highlighting and the anchor marked", () => {
    const onOpenAnchor = jest.fn();
    render(
      <RecordDossierPage
        {...dossierProps(adr, {
          onOpenAnchor,
          openFile: readyFile({ path: "plugins/adr/src/ActivityLayout.tsx", line: 14 }),
        })}
      />,
    );
    const code = screen.getByTestId("section-code");
    const editor = within(code).getByTestId("source-editor");
    expect(editor).toHaveAccessibleName("Quelldatei plugins/adr/src/ActivityLayout.tsx");

    expect(within(code).getByRole("button", { name: /ActivityLayout\.tsx :14/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(within(editor).getByText(localized.text8)).toBeInTheDocument();
  });

  it("renders every line with its number, its tokens and the anchor lines", () => {
    render(<SourceEditor file={readyFile()} recordId="workspace/board/column" />);
    const body = screen.getByTestId("source-editor-body");
    const lines = body.querySelectorAll("[data-line]");
    expect(lines).toHaveLength(9);
    expect(lines[6]).toHaveTextContent(/^7func Read\(path string\) error \{$/);
    const anchor = body.querySelector('[data-line="5"]');
    expect(anchor).toHaveAttribute("data-anchor", "true");
    expect(anchor).toHaveAttribute("aria-current", "true");
    expect(body.querySelector('[data-line="6"]')).toHaveAttribute("data-anchor", "true");
    expect(body.querySelector('[data-line="7"]')).not.toHaveAttribute("data-anchor");
    const tokens = (n: number, kind: string) =>
      [...body.querySelectorAll(`[data-line="${n}"] [data-token="${kind}"]`)].map(
        (e) => e.textContent,
      );
    expect(tokens(5, "tag")).toEqual([`${TAG}:`]);
    expect(tokens(7, "kw")).toEqual(["func"]);
    expect(tokens(8, labelText.text261)).toEqual(['"no %s"']);
    expect(tokens(8, "com")).toEqual(["// 42"]);
    expect(tokens(4, "com")).toEqual(["   over two lines */"]);
    expect(screen.getByText(germanLabels.text128)).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
  });

  it("closes on Escape and on its close button", () => {
    const onClose = jest.fn();
    render(<SourceEditor file={readyFile()} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId("source-editor-body"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: localized.text9 }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("scrolls the editor to the anchor line", () => {
    const top = jest.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(400);
    const height = jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(300);
    render(<SourceEditor file={readyFile()} />);
    expect(screen.getByTestId("source-editor-body").scrollTop).toBe(300);
    top.mockRestore();
    height.mockRestore();
  });

  it("names the state while reading and why a file is not shown", () => {
    const { rerender } = render(
      <SourceEditor file={readyFile({ state: "loading", text: undefined })} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(localized.text10);
    rerender(<SourceEditor file={readyFile({ state: "error", reason: "not-anchored" })} />);
    expect(screen.getByRole("alert")).toHaveTextContent(localized.text11);
    rerender(<SourceEditor file={readyFile({ state: "error", reason: "whatever" })} />);
    expect(screen.getByRole("alert")).toHaveTextContent(localized.text12);
  });

  it("speaks English without a provider", () => {
    renderInEnglish(<SourceEditor file={readyFile()} />);
    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close file" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Code size" })).toBeInTheDocument();
  });
});

describe("syntax tokens", () => {
  it("picks the language from the file name", () => {
    expect(languageOf("a/b.tsx").name).toBe("TypeScript");
    expect(languageOf("internal/ui/source.go").name).toBe("Go");
    expect(languageOf("Dockerfile").name).toBe("Shell");
    expect(languageOf("notes.unknown").name).toBe("Text");
  });

  it("carries a template string over lines and keys YAML and JSON", () => {
    const ts = tokenize("const a = `one\ntwo` + 1;", languageOf("x.ts"));
    expect(ts[0].map((t) => t.kind)).toEqual(["kw", "plain", labelText.text261]);
    expect(ts[1][0]).toEqual({ kind: "str", text: "two`" });
    expect(ts[1].find((t) => t.kind === "num")?.text).toBe("1");
    const yaml = tokenize("id: x # note\n- name: y", languageOf("a.yaml"));
    expect(yaml[0][0]).toEqual({ kind: "key", text: "id" });
    expect(yaml[0].at(-1)).toEqual({ kind: "com", text: "# note" });
    expect(yaml[1].find((t) => t.kind === "key")?.text).toBe("name");
    const json = tokenize('{"a": "b"}', languageOf("a.json"));
    expect(json[0].filter((t) => t.kind !== "plain").map((t) => t.kind)).toEqual([
      "key",
      labelText.text261,
    ]);
  });

  it("does not take a word with digits for a number, nor # inside a word for a comment", () => {
    const py = tokenize("v2 = x#y  # real", languageOf("a.py"));
    expect(py[0].filter((t) => t.kind === "num")).toEqual([]);
    expect(py[0].at(-1)).toEqual({ kind: "com", text: "# real" });
  });
});
