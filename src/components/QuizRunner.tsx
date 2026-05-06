"use client";

import { useState } from "react";
import { Topic } from "@/types/quiz";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Send,
  Trophy,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function QuizRunner({ topic }: { topic: Topic }) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(topic.questions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);

  const question = topic.questions[currentIndex];

  function selectAnswer(optionIndex: number) {
    if (submitted) return;
    const updated = [...answers];
    updated[currentIndex] = optionIndex;
    setAnswers(updated);
  }

  function next() {
    if (currentIndex < topic.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function submit() {
    setSubmitted(true);
  }

  const score = answers.reduce<number>((acc, answer, i) => {
    return acc + (answer === topic.questions[i].correctIndex ? 1 : 0);
  }, 0);

  if (submitted) {
    const percentage = Math.round((score / topic.questions.length) * 100);
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <Trophy className="h-8 w-8" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {t.quizComplete}
          </h2>
          <p className="mb-6 text-gray-500">{topic.name}</p>
          <div className="mb-6">
            <span className="text-5xl font-bold text-blue-600">
              {percentage}%
            </span>
            <p className="mt-2 text-gray-500">
              {t.correct(score, topic.questions.length)}
            </p>
          </div>
          <div className="space-y-3">
            {topic.questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`flex gap-2 rounded-lg p-3 text-left text-sm ${
                    isCorrect
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <div>
                    <span className="font-medium">Q{i + 1}:</span> {q.question}
                    {!isCorrect && (
                      <p className="mt-1 text-xs">
                        {t.correctAnswer} {q.options[q.correctIndex]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => {
                setAnswers(new Array(topic.questions.length).fill(null));
                setCurrentIndex(0);
                setSubmitted(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" />
              {t.retry}
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.allTopics}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
        <span>{topic.name}</span>
        <span>
          {currentIndex + 1} / {topic.questions.length}
        </span>
      </div>

      <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{
            width: `${((currentIndex + 1) / topic.questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, i) => {
            const selected = answers[currentIndex] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition ${
                  selected
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.previous}
        </button>

        {currentIndex === topic.questions.length - 1 ? (
          <button
            onClick={submit}
            disabled={answers.some((a) => a === null)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {t.submit}
          </button>
        ) : (
          <button
            onClick={next}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t.next}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
