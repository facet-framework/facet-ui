import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import SkeletonWithLogic, { Skeleton, withSkeletonLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

describe("Unit tests for Skeleton", () => {
  it("announces itself as an ongoing process", () => {
    render(<Skeleton computedStyle={{}} label="Reading records" />);
    const node = screen.getByRole("status", { name: "Reading records" });
    expect(node).toHaveAttribute("aria-busy", "true");
  });
});

describe("Unit tests for withSkeletonLogic", () => {
  it("uses the default geometry of a text line", () => {
    render(<SkeletonWithLogic data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveStyle({ height: "14px", width: "100%" });
  });

  it("takes the final geometry of the later content", () => {
    render(<SkeletonWithLogic height={34} width="60%" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveStyle({ height: "34px", width: "60%" });
  });

  it("carries default plain words", () => {
    render(<SkeletonWithLogic />);
    expect(screen.getByRole("status", { name: "loading" })).toBeInTheDocument();
  });

  it("accepts its own plain words", () => {
    render(<SkeletonWithLogic label="Counting promises" />);
    expect(screen.getByRole("status", { name: "Counting promises" })).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withSkeletonLogic(Skeleton).displayName).toBe("withSkeletonLogic(Skeleton)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<SkeletonWithLogic />);
    expect(
      screen.getByRole("status", { name: germanText.t("elements.skeleton.loading") }),
    ).toBeInTheDocument();
  });
});

describe("Snapshot tests for Skeleton", () => {
  it("text line", () => {
    const { container } = render(<SkeletonWithLogic />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("lead sentence", () => {
    const { container } = render(<SkeletonWithLogic height={34} width="70%" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
