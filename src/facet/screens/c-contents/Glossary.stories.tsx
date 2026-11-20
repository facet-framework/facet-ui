import { localized } from "../../../i18n/legacy/facet/screens/c-contents/Glossary.stories.text";
import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { useText } from "../../i18n/TextProvider";
import { GlossaryPage, validateProposal, type ProposalState } from "./Glossary";
import { glossary300, glossary40, glossaryCategories, lettersOf, termDetail } from "./data";
import { desk, mob } from "./kit";
import type { GlossaryTerm } from "./model";

const meta: Meta = { title: "Screens/C Contents/Glossary" };
export default meta;

type Mode = "list" | "term" | "propose";

function Demo({
  terms,
  mobile,
  initial = "list",
  pageSize = 50,
  empty,
  startPage = 1,
  proposeDisabledReason,
}: {
  terms: GlossaryTerm[];
  mobile: boolean;
  initial?: Mode;
  pageSize?: number;
  empty?: boolean;
  startPage?: number;
  proposeDisabledReason?: string;
}) {
  const { t: text } = useText();
  const [mode, setMode] = useState<Mode>(initial);
  const [letter, setLetter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(startPage);
  const [proposal, setProposal] = useState<ProposalState>({
    values: {
      term: "Anchors",
      definition: localized.text1,
      category: "",
      aliases: "Tag, Mark",
      records: ["registry/anchors/anchor-lint", "workspace/board/anchor-sheet"],
    },
    errors: {},
    status: "idle",
  });
  const filtered = terms.filter(
    (t) =>
      (!letter || t.term[0].toUpperCase() === letter) &&
      (!category || t.category === category) &&
      (!query ||
        `${t.term} ${t.definition} ${t.aliases.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const shown =
    proposal.status === "idle" && initial === "propose" && !Object.keys(proposal.errors).length
      ? {
          ...proposal,
          errors: validateProposal(
            proposal.values,
            terms.map((t) => t.term),
            text,
          ),
        }
      : proposal;
  return (
    <GlossaryPage
      proposeDisabledReason={proposeDisabledReason}
      state={empty ? "empty" : "ready"}
      mode={mode}
      terms={filtered.slice((page - 1) * pageSize, page * pageSize)}
      letters={lettersOf(terms)}
      letter={letter}
      query={query}
      page={page}
      pageSize={pageSize}
      total={filtered.length}
      categories={glossaryCategories}
      category={category}
      detail={mode === "term" ? termDetail : null}
      proposal={mode === "propose" || proposal.status === "sent" ? shown : null}
      mobile={mobile}
      onLetter={(l) => {
        setLetter(l);
        setPage(1);
      }}
      onQuery={(q) => {
        setQuery(q);
        setPage(1);
      }}
      onCategory={setCategory}
      onPage={setPage}
      onOpen={() => setMode("term")}
      onClose={() => setMode("list")}
      onPropose={() => setMode("propose")}
      onProposalChange={(patch) =>
        setProposal((p) => {
          const values = { ...p.values, ...patch };
          return {
            ...p,
            values,
            errors: validateProposal(
              values,
              terms.map((t) => t.term),
              text,
            ),
            status: "idle",
          };
        })
      }
      onSubmit={() => {
        const errors = validateProposal(
          proposal.values,
          terms.map((t) => t.term),
          text,
        );
        if (Object.keys(errors).length) return setProposal((p) => ({ ...p, errors }));
        setProposal((p) => ({
          ...p,
          status: "sent",
          result: { branch: "glossary/anchor", pr: "Example change" },
        }));
        setMode("list");
      }}
    />
  );
}

export const Empty = desk("glossary", "Empty", (m) => <Demo terms={[]} mobile={m} empty />);
export const EmptyMobile = mob("glossary", "Empty Mobile", (m) => (
  <Demo terms={[]} mobile={m} empty />
));
export const AZ = desk("glossary", "AZ", (m) => <Demo terms={glossary40} mobile={m} />);
export const AZMobile = mob("glossary", "AZ Mobile", (m) => <Demo terms={glossary40} mobile={m} />);
export const Term = desk("glossary", "Term", (m) => (
  <Demo terms={glossary40} mobile={m} initial="term" />
));
export const TermMobile = mob("glossary", "Term Mobile", (m) => (
  <Demo terms={glossary40} mobile={m} initial="term" />
));
export const ProposeTerm = desk("glossary", "Propose Term", (m) => (
  <Demo terms={glossary40} mobile={m} initial="propose" />
));
export const ProposeTermMobile = mob("glossary", "Propose Term Mobile", (m) => (
  <Demo terms={glossary40} mobile={m} initial="propose" />
));
export const Many = desk("glossary", "Many", (m) => (
  <Demo terms={glossary300} mobile={m} pageSize={25} startPage={4} />
));
export const ManyMobile = mob("glossary", "Many Mobile", (m) => (
  <Demo terms={glossary300} mobile={m} pageSize={25} />
));

const READ_ONLY = "Read-only checkout: terms are proposed from a writable clone.";
export const ProposeDisabled = desk("glossary", "Propose Disabled", (m) => (
  <Demo terms={glossary40} mobile={m} proposeDisabledReason={READ_ONLY} />
));
export const ProposeDisabledMobile = mob("glossary", "Propose Disabled Mobile", (m) => (
  <Demo terms={glossary40} mobile={m} proposeDisabledReason={READ_ONLY} />
));
