import { labelText } from "../../../i18n/legacy/labels";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/ErrorState/ErrorState.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YamlError } from "../../../core";
import ErrorStateWithLogic, { ErrorState, withErrorStateLogic } from ".";

const styles = {
  containerStyle: {},
  headlineStyle: {},
  originStyle: {},
  retryStyle: {},
};

describe("Unit tests for ErrorState", () => {
  it("exposes an alert with a reason", () => {
    render(<ErrorState {...styles} headline={localized.text2} retryLabel={labelText.text467} />);
    expect(screen.getByRole("alert")).toHaveTextContent(localized.text3);
  });

  it("shows the source when known", () => {
    render(
      <ErrorState
        {...styles}
        headline={germanLabels.text171}
        origin="quick-add.yaml:42"
        retryLabel={labelText.text469}
      />,
    );
    expect(screen.getByText("quick-add.yaml:42")).toBeInTheDocument();
  });

  it("offers returning only with a callback", () => {
    const { rerender } = render(
      <ErrorState {...styles} headline={germanLabels.text171} retryLabel={labelText.text469} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <ErrorState
        {...styles}
        headline={germanLabels.text171}
        retryLabel={labelText.text469}
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: labelText.text469 })).toBeInTheDocument();
  });
});

describe("Unit tests for withErrorStateLogic", () => {
  it("renders matches as a selection list", () => {
    render(<ErrorStateWithLogic error={new Error(localized.text6)} />);
    expect(screen.getByRole("alert")).toHaveTextContent(localized.text7);
  });

  it("combines the file and line number", () => {
    render(
      <ErrorStateWithLogic error={new YamlError(labelText.text348, 41)} path="quick-add.yaml" />,
    );
    expect(screen.getByText("quick-add.yaml:42")).toBeInTheDocument();
  });

  it("handles a missing file", () => {
    render(<ErrorStateWithLogic error={new YamlError(labelText.text348, 7)} />);
    expect(screen.getByText(labelText.text470)).toBeInTheDocument();
  });

  it("accepts a string error", () => {
    render(<ErrorStateWithLogic error={localized.text11} />);
    expect(screen.getByRole("alert")).toHaveTextContent(localized.text12);
  });

  it("falls back to a default message", () => {
    render(<ErrorStateWithLogic error={{ seltsam: true }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(localized.text14);
  });

  it("reports the return action", async () => {
    const onRetry = jest.fn();
    render(<ErrorStateWithLogic error={labelText.text348} onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("sets a descriptive displayName", () => {
    expect(withErrorStateLogic(ErrorState).displayName).toBe("withErrorStateLogic(ErrorState)");
  });
});

describe("Snapshot tests for ErrorState", () => {
  it("YAML error with a source", () => {
    const { container } = render(
      <ErrorStateWithLogic
        error={new YamlError(labelText.text348, 41)}
        path="quick-add.yaml"
        onRetry={() => {}}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("error without a source", () => {
    const { container } = render(<ErrorStateWithLogic error={new Error("offline")} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
