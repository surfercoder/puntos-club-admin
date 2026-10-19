import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Plans from "@/components/landing/screens/plans";
import type { PlanLimitsByPlan } from "@/components/plan/plan-cards";

jest.mock("@/components/plan/plan-cards", () => ({
  PlanCards: ({ onSelect }: { onSelect: (plan: string) => void }) => (
    <button type="button" onClick={() => onSelect("pro")}>
      pick-pro
    </button>
  ),
}));

const limits = {} as PlanLimitsByPlan;

describe("Plans", () => {
  const push = jest.fn();

  beforeEach(() => {
    push.mockClear();
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it("renders the section title", () => {
    render(<Plans limits={limits} />);
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("stores the chosen plan for onboarding step 3 and navigates there", () => {
    render(<Plans limits={limits} />);
    fireEvent.click(screen.getByText("pick-pro"));
    expect(localStorage.getItem("onboarding_plan")).toBe("pro");
    expect(push).toHaveBeenCalledWith("/owner/onboarding");
  });

  it("still navigates when localStorage throws", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<Plans limits={limits} />);
    fireEvent.click(screen.getByText("pick-pro"));
    expect(push).toHaveBeenCalledWith("/owner/onboarding");
  });
});
