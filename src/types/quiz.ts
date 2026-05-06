import type { LucideIcon } from "lucide-react";

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  questions: Question[];
}
