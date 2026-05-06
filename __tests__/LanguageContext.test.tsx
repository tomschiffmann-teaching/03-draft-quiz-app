import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";

function Probe() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="title">{t.appTitle}</span>
      <span data-testid="count">{t.questionsCount(3)}</span>
      <button onClick={() => setLocale("de")}>de</button>
    </div>
  );
}

describe("LanguageContext", () => {
  it("defaults to English", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    expect(screen.getByTestId("locale").textContent).toBe("en");
    expect(screen.getByTestId("count").textContent).toBe("3 questions");
  });

  it("switches locale via setLocale", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    act(() => {
      screen.getByText("de").click();
    });
    expect(screen.getByTestId("locale").textContent).toBe("de");
    expect(screen.getByTestId("count").textContent).toBe("3 Fragen");
  });

  it("throws when used outside the provider", () => {
    const original = console.error;
    console.error = () => {};
    expect(() => render(<Probe />)).toThrow(
      /useLanguage must be used within a LanguageProvider/
    );
    console.error = original;
  });
});
