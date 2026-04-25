import type { QuestionId } from "./questions";

export interface Response {
  question_id: QuestionId;
  chosen_option: "A" | "B";
  optional_comment: string;
}

export interface SynthesizeRequest {
  seeded_count: number;
  live_responses: Response[];
}

export interface QuestionBreakdown {
  question_id: QuestionId;
  total: number;
  option_a_count: number;
  option_b_count: number;
  option_a_pct: number;
  option_b_pct: number;
}
