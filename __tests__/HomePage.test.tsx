import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { topics } from "@/data/quizzes";

describe("Home page", () => {
  it("renders the heading and a card for every topic", () => {
    render(
      <LanguageProvider>
        <Home />
      </LanguageProvider>
    );
    expect(screen.getByRole("heading", { name: "Quiz-App" })).toBeInTheDocument();
    for (const topic of topics) {
      expect(screen.getByText(topic.name)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link").length).toBe(topics.length);
  });
});
