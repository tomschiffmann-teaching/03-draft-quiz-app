import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GitBranch } from "lucide-react";
import TopicCard from "@/components/TopicCard";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { Topic } from "@/types/quiz";

const fakeTopic: Topic = {
  id: "git",
  name: "Git",
  description: "Fallback description",
  icon: GitBranch,
  questions: [
    { id: "q1", question: "Q1?", options: ["a", "b"], correctIndex: 0 },
    { id: "q2", question: "Q2?", options: ["a", "b"], correctIndex: 1 },
  ],
};

const customTopic: Topic = {
  ...fakeTopic,
  id: "unknown-topic-no-translation",
};

function renderCard(topic: Topic) {
  return render(
    <LanguageProvider>
      <TopicCard topic={topic} />
    </LanguageProvider>
  );
}

describe("TopicCard", () => {
  it("renders the topic name, translated description, and question count", () => {
    renderCard(fakeTopic);
    expect(screen.getByText("Git")).toBeInTheDocument();
    expect(screen.getByText(/Version control fundamentals/i)).toBeInTheDocument();
    expect(screen.getByText("2 questions")).toBeInTheDocument();
  });

  it("falls back to topic.description when no translation key matches", () => {
    renderCard(customTopic);
    expect(screen.getByText("Fallback description")).toBeInTheDocument();
  });

  it("links to the quiz page", () => {
    renderCard(fakeTopic);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/quiz/git");
  });
});
