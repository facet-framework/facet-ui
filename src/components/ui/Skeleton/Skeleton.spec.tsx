import { localized } from "../../../i18n/legacy/components/ui/Skeleton/Skeleton.spec.text";
import { render, screen } from "@testing-library/react";
import SkeletonWithLogic, { Skeleton, withSkeletonLogic } from ".";

describe("Unit tests for Skeleton", () => {
  it("announces an ongoing operation", () => {
    render(<Skeleton computedStyle={{}} label={localized.text2} />);
    const node = screen.getByRole("status", { name: localized.text3 });
    expect(node).toHaveAttribute("aria-busy", "true");
  });
});

describe("Unit tests for withSkeletonLogic", () => {
  it("uses text-line geometry by default", () => {
    render(<SkeletonWithLogic data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveStyle({ height: "14px", width: "100%" });
  });

  it("matches the eventual content geometry", () => {
    render(<SkeletonWithLogic height={34} width="60%" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveStyle({ height: "34px", width: "60%" });
  });

  it("provides a default accessible label", () => {
    render(<SkeletonWithLogic />);
    expect(screen.getByRole("status", { name: localized.text7 })).toBeInTheDocument();
  });

  it("accepts a custom accessible label", () => {
    render(<SkeletonWithLogic label={localized.text9} />);
    expect(screen.getByRole("status", { name: localized.text10 })).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withSkeletonLogic(Skeleton).displayName).toBe("withSkeletonLogic(Skeleton)");
  });
});

describe("Snapshot tests for Skeleton", () => {
  it("Text line", () => {
    const { container } = render(<SkeletonWithLogic />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Lead sentence", () => {
    const { container } = render(<SkeletonWithLogic height={34} width="70%" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
