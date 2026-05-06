import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GitBranch } from "lucide-react";
import QuizRunner from "@/components/QuizRunner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { Topic } from "@/types/quiz";

const topic: Topic = {
  id: "git",
  name: "Git",
  description: "desc",
  icon: GitBranch,
  questions: [
    {
      id: "q1",
      question: "First question?",
      options: ["A", "B", "C"],
      correctIndex: 1,
    },
    {
      id: "q2",
      question: "Second question?",
      options: ["A", "B"],
      correctIndex: 0,
    },
  ],
};

function renderRunner() {
  return render(
    <LanguageProvider>
      <QuizRunner topic={topic} />
    </LanguageProvider>
  );
}

describe("QuizRunner", () => {
  it("disables Previous on the first question", () => {
    renderRunner();
    expect(screen.getByRole("button", { name: /Previous/i })).toBeDisabled();
  });

  it("walks through the quiz, scores answers, and renders results", async () => {
    const user = userEvent.setup();
    renderRunner();

    expect(screen.getByText("First question?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "B" })); // correct
    await user.click(screen.getByRole("button", { name: /Next/i }));

    expect(screen.getByText("Second question?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Previous/i })).not.toBeDisabled();
    await user.click(screen.getByRole("button", { name: "B" })); // wrong

    const submit = screen.getByRole("button", { name: /Submit/i });
    expect(submit).not.toBeDisabled();
    await user.click(submit);

    expect(screen.getByText(/Quiz Complete/i)).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 correct")).toBeInTheDocument();
    expect(screen.getByText(/Correct:/)).toBeInTheDocument();
  });

  it("disables Submit until all questions are answered", async () => {
    const user = userEvent.setup();
    renderRunner();

    await user.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByRole("button", { name: /Submit/i })).toBeDisabled();
  });

  it("supports navigating back with Previous", async () => {
    const user = userEvent.setup();
    renderRunner();
    await user.click(screen.getByRole("button", { name: "A" }));
    await user.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByText("Second question?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Previous/i }));
    expect(screen.getByText("First question?")).toBeInTheDocument();
  });

  it("ignores answer clicks after submission", async () => {
    const user = userEvent.setup();
    const onlyOne: Topic = { ...topic, questions: [topic.questions[0]] };
    render(
      <LanguageProvider>
        <QuizRunner topic={onlyOne} />
      </LanguageProvider>
    );
    await user.click(screen.getByRole("button", { name: "B" }));
    await user.click(screen.getByRole("button", { name: /Submit/i }));
    expect(screen.getByText(/Quiz Complete/i)).toBeInTheDocument();
  });

  it("retry resets the quiz back to the first question", async () => {
    const user = userEvent.setup();
    const onlyOne: Topic = { ...topic, questions: [topic.questions[0]] };
    render(
      <LanguageProvider>
        <QuizRunner topic={onlyOne} />
      </LanguageProvider>
    );
    await user.click(screen.getByRole("button", { name: "B" }));
    await user.click(screen.getByRole("button", { name: /Submit/i }));
    await user.click(screen.getByRole("button", { name: /Retry/i }));
    expect(screen.getByText("First question?")).toBeInTheDocument();
  });

  it("scores 100% when all answers are correct", async () => {
    const user = userEvent.setup();
    renderRunner();
    await user.click(screen.getByRole("button", { name: "B" })); // correct
    await user.click(screen.getByRole("button", { name: /Next/i }));
    await user.click(screen.getByRole("button", { name: "A" })); // correct
    await user.click(screen.getByRole("button", { name: /Submit/i }));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
