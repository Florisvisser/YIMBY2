export type ConcernCategory =
  | "traffic_parking"
  | "building_height"
  | "green_nature"
  | "noise_livability";

export type PersonaType =
  | "young_family"
  | "elderly_resident"
  | "commuter"
  | "local_business"
  | "underrepresented_resident";

export type Severity = 1 | 2 | 3 | 4 | 5;

export type ConcernStatus = "new" | "in_review" | "answered";

export type Concern = {
  id: string;
  projectId: "schapenweide";
  source: "seed" | "db";
  status?: ConcernStatus;
  postcode: string;
  neighbourhood: string;
  streetReference?: string;
  category: ConcernCategory;
  severity: Severity;
  concernText: string;
  personaType: PersonaType;
  submittedAt: string;
};

export const STATUS_LABEL_NL: Record<ConcernStatus, string> = {
  new: "Nieuw",
  in_review: "In behandeling",
  answered: "Beantwoord",
};

export const CATEGORY_LABEL_NL: Record<ConcernCategory, string> = {
  traffic_parking: "Verkeer & parkeren",
  building_height: "Bouwhoogte & uitzicht",
  green_nature: "Groen & natuur",
  noise_livability: "Geluid & leefbaarheid",
};

export type MotiveringSection = {
  category: string;
  concernCount: number;
  severityAverage: number;
  officialMotivation: string;
  residentExplanation: string;
  suggestedPlanAdjustment: string;
  evidenceSummary: string;
  reviewWarnings: string[];
};

export type MotiveringReport = {
  source: "claude" | "fallback";
  generatedAt: string;
  title: string;
  status: "Concept — ambtelijke review vereist";
  summary: string;
  sections: MotiveringSection[];
};

export type MotiveringRequest = {
  projectId: "schapenweide";
  forceFallback?: boolean;
};

export type ConcernWithAnswer = Concern & {
  verslagAnswer?: string;
  verslagSignedAt?: string;
  verslagReference?: string;
};

export type PublishedReport = {
  id: string;
  projectId: "schapenweide";
  signedAt: string;
  reference: string;
  title: string;
  summary: string;
  sections: MotiveringSection[];
};

export type CategoryStats = {
  category: ConcernCategory;
  label: string;
  count: number;
  severityAverage: number;
  representative: Concern | null;
};
