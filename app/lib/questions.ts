export type QuestionId = "height" | "ground_floor" | "green_space" | "entrance";

export interface DesignOption {
  label: string;
  description: string;
}

export interface DesignQuestion {
  id: QuestionId;
  question: string;
  optionA: DesignOption;
  optionB: DesignOption;
}

export const DESIGN_QUESTIONS: DesignQuestion[] = [
  {
    id: "height",
    question: "How tall should the building be?",
    optionA: {
      label: "4 floors",
      description: "Fits the scale of the street. Less housing but more light on Emmalaan and surrounding gardens.",
    },
    optionB: {
      label: "6 floors",
      description: "25% more homes. Some shadow impact on neighbouring gardens, especially in winter.",
    },
  },
  {
    id: "ground_floor",
    question: "What goes on the ground floor?",
    optionA: {
      label: "Apartments",
      description: "Maximises the number of homes. Ground floor units face the street.",
    },
    optionB: {
      label: "Shop or café",
      description: "A local amenity — small supermarket, pharmacy, or café. Activates the street but reduces total housing.",
    },
  },
  {
    id: "green_space",
    question: "South side of the plot: green space or parking?",
    optionA: {
      label: "Communal garden",
      description: "A shared green area with trees retained. Usable by residents and the wider neighbourhood.",
    },
    optionB: {
      label: "Parking",
      description: "Resident and visitor parking. Addresses the parking pressure on nearby streets.",
    },
  },
  {
    id: "entrance",
    question: "Where should the main entrance be?",
    optionA: {
      label: "Emmalaan",
      description: "The main road. Visible and easy to find, but adds vehicle traffic to an already busy street.",
    },
    optionB: {
      label: "Schapenweide road",
      description: "A quieter access path from the plot's own road. Less visible but keeps Emmalaan clear.",
    },
  },
];
