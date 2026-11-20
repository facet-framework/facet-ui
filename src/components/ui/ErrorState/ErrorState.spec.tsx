import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YamlError } from "../../../core";
import ErrorStateWithLogic, { ErrorState, withErrorStateLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const styles = {
  containerStyle: {},
  headlineStyle: {},
  originStyle: {},
  retryStyle: {},
};

describe("Unit tests for ErrorState", () => {
  it("announces itself as an alert with a reason", () => {
    render(<ErrorState {...styles} headline="File not readable" retryLabel="read again" />);
    expect(screen.getByRole("alert")).toHaveTextContent("File not readable");
  });

  it("shows the origin when it is known", () => {
    render(
      <ErrorState {...styles} headline="Error" origin="quick-add.yaml:42" retryLabel="again" />,
    );
    expect(screen.getByText("quick-add.yaml:42")).toBeInTheDocument();
  });

  it("offers the way back only with a callback", () => {
    const { rerender } = render(<ErrorState {...styles} headline="Error" retryLabel="again" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(<ErrorState {...styles} headline="Error" retryLabel="again" onRetry={jest.fn()} />);
    expect(screen.getByRole("button", { name: "again" })).toBeInTheDocument();
  });
});

describe("Unit tests for withErrorStateLogic", () => {
  it("takes the reason from the error", () => {
    render(<ErrorStateWithLogic error={new Error("Repo not reachable")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Repo not reachable");
  });

  it("joins file and line number", () => {
    render(<ErrorStateWithLogic error={new YamlError("broken", 41)} path="quick-add.yaml" />);
    expect(screen.getByText("quick-add.yaml:42")).toBeInTheDocument();
  });

  it("copes without a file", () => {
    render(<ErrorStateWithLogic error={new YamlError("broken", 7)} />);
    expect(screen.getByText("Line 8")).toBeInTheDocument();
  });

  it("also accepts a string as the error", () => {
    render(<ErrorStateWithLogic error="Index missing" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Index missing");
  });

  it("falls back to a default text", () => {
    render(<ErrorStateWithLogic error={{ strange: true }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unknown error while reading.");
  });

  it("speaks German under the German locale", () => {
    renderInGerman(<ErrorStateWithLogic error={new YamlError("broken", 7)} onRetry={jest.fn()} />);
    expect(
      screen.getByText(germanText.t("elements.errorState.line", { line: 8 })),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: germanText.t("elements.errorState.retry") }),
    ).toBeInTheDocument();
    renderInGerman(<ErrorStateWithLogic error={{ strange: true }} />);
    expect(screen.getAllByRole("alert")[1]).toHaveTextContent(
      germanText.t("elements.errorState.unknown"),
    );
  });

  it("reports the way back", async () => {
    const onRetry = jest.fn();
    render(<ErrorStateWithLogic error="broken" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("assigns a descriptive displayName", () => {
    expect(withErrorStateLogic(ErrorState).displayName).toBe("withErrorStateLogic(ErrorState)");
  });
});

describe("Snapshot tests for ErrorState", () => {
  it("YAML error with origin", () => {
    const { container } = render(
      <ErrorStateWithLogic
        error={new YamlError("broken", 41)}
        path="quick-add.yaml"
        onRetry={() => {}}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("error without origin", () => {
    const { container } = render(<ErrorStateWithLogic error={new Error("offline")} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
