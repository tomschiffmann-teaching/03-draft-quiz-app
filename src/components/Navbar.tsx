"use client";

import Link from "next/link";
import { Brain, Languages } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Navbar() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-gray-900"
        >
          <Brain className="h-6 w-6 text-blue-600" />
          {t.appTitle}
        </Link>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
          <Languages className="ml-1 h-4 w-4 text-gray-400" />
          <button
            onClick={() => setLocale("en")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              locale === "en"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("de")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              locale === "de"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            DE
          </button>
        </div>
      </div>
    </nav>
  );
}
