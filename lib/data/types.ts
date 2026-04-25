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

export const CONCERN_CATEGORIES: ConcernCategory[] = [
  "traffic_parking",
  "building_height",
  "green_nature",
  "noise_livability",
];

export const PERSONA_LABEL_NL: Record<PersonaType, string> = {
  young_family: "Jong gezin",
  elderly_resident: "Oudere bewoner",
  commuter: "Forens",
  local_business: "Lokale ondernemer",
  underrepresented_resident: "Ondervertegenwoordigde bewoner",
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

export type SuggestResult = {
  label: string;
  postcode: string;
  straatnaam: string;
  huis_nlt: string;
  neighbourhood: string;
};

export type ProfileData = {
  voornaam: string;
  achternaam: string;
  leeftijd: number;
  postcode: string;
  neighbourhood: string;
  straatnaam: string;
  huis_nlt: string;
};

export type PlanUitlegSection = {
  category: ConcernCategory;
  headline: string;
  bodyText: string;
  impactLevel: "laag" | "gemiddeld" | "hoog";
};

export type PlanUitlegReport = {
  source: "claude" | "fallback";
  generatedAt: string;
  intro: string;
  sections: PlanUitlegSection[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type VraagResponse = {
  answer: string;
  source: "claude" | "fallback";
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
