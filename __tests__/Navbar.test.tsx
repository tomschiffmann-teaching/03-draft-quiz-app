import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/i18n/LanguageContext";

function renderNavbar() {
  return render(
    <LanguageProvider>
      <Navbar />
    </LanguageProvider>
  );
}

describe("Navbar", () => {
  it("shows the app title and language buttons", () => {
    renderNavbar();
    expect(screen.getByText("Quiz-App")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DE" })).toBeInTheDocument();
  });

  it("highlights EN by default and switches to DE on click", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const en = screen.getByRole("button", { name: "EN" });
    const de = screen.getByRole("button", { name: "DE" });
    expect(en.className).toMatch(/bg-blue-600/);
    expect(de.className).not.toMatch(/bg-blue-600/);

    await user.click(de);
    expect(de.className).toMatch(/bg-blue-600/);
    expect(en.className).not.toMatch(/bg-blue-600/);

    await user.click(en);
    expect(en.className).toMatch(/bg-blue-600/);
  });
});
