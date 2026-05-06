import { describe, it, expect } from "vitest";
import { topics, getTopicById, getAllTopicIds } from "@/data/quizzes";

describe("quizzes data", () => {
  it("exposes a non-empty topics list", () => {
    expect(topics.length).toBeGreaterThan(0);
  });

  it("each topic has questions with a valid correctIndex", () => {
    for (const topic of topics) {
      expect(topic.questions.length).toBeGreaterThan(0);
      for (const q of topic.questions) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    }
  });

  it("each topic has a Lucide icon component", () => {
    for (const topic of topics) {
      expect(typeof topic.icon).toBe("object");
    }
  });

  it("getTopicById returns the matching topic", () => {
    const topic = getTopicById("git");
    expect(topic).toBeDefined();
    expect(topic?.name).toBe("Git");
  });

  it("getTopicById returns undefined for unknown ids", () => {
    expect(getTopicById("does-not-exist")).toBeUndefined();
  });

  it("getAllTopicIds returns all topic ids", () => {
    const ids = getAllTopicIds();
    expect(ids).toEqual(topics.map((t) => t.id));
  });
});
