import fallbackJson from "@/data/plan-uitleg-fallback.json";
import type { PlanUitlegReport, ResidentLanguage } from "@/lib/data/types";
import { PlanUitlegReportSchema } from "./schema";

const SECTIONS_EN: PlanUitlegReport["sections"] = [
  {
    category: "traffic_parking",
    headline: "More traffic expected in your neighbourhood",
    bodyText:
      "There will be 450 new homes. That means more cars on Emmalaan and Nachtegaalstraat. The municipality is studying how to keep the traffic flow safe.",
    impactLevel: "hoog",
  },
  {
    category: "building_height",
    headline: "Buildings up to six storeys high",
    bodyText:
      "The plan allows up to six storeys, while the neighbourhood is mostly two or three. Taller buildings can cast more shadow on adjacent gardens.",
    impactLevel: "gemiddeld",
  },
  {
    category: "green_nature",
    headline: "Protected badger setts on the site",
    bodyText:
      "The Schapenweide site hosts legally protected badgers. Greenery and trees will be preserved as much as possible. The municipality is engaging an ecologist before construction starts.",
    impactLevel: "gemiddeld",
  },
  {
    category: "noise_livability",
    headline: "Construction noise for several years",
    bodyText:
      "Building 450 homes takes several years. During the day there can be noise from machines and trucks. The municipality is setting building hours and opening a complaints desk.",
    impactLevel: "laag",
  },
];

const SECTIONS_ES: PlanUitlegReport["sections"] = [
  {
    category: "traffic_parking",
    headline: "Más tráfico previsto en tu barrio",
    bodyText:
      "Habrá 450 viviendas nuevas. Eso significa más coches en Emmalaan y Nachtegaalstraat. El ayuntamiento está estudiando cómo mantener un flujo de tráfico seguro.",
    impactLevel: "hoog",
  },
  {
    category: "building_height",
    headline: "Edificios de hasta seis plantas",
    bodyText:
      "El plan permite hasta seis plantas, mientras que el barrio tiene mayoritariamente dos o tres. Los edificios más altos pueden dar más sombra a los jardines vecinos.",
    impactLevel: "gemiddeld",
  },
  {
    category: "green_nature",
    headline: "Madrigueras de tejones protegidas en el terreno",
    bodyText:
      "En el terreno de Schapenweide viven tejones protegidos por la ley. Se conservará el verde y los árboles tanto como sea posible. El ayuntamiento contrata a un ecólogo antes de iniciar la obra.",
    impactLevel: "gemiddeld",
  },
  {
    category: "noise_livability",
    headline: "Ruido de obra durante varios años",
    bodyText:
      "Construir 450 viviendas lleva varios años. Durante el día puede haber ruido de máquinas y camiones. El ayuntamiento establece horarios de obra y abre un buzón de quejas.",
    impactLevel: "laag",
  },
];

function makeIntro(voornaam: string, straatnaam: string, language: ResidentLanguage): string {
  const naam = voornaam || (language === "es" ? "vecino/a" : language === "en" ? "resident" : "bewoner");
  const straat = straatnaam || (language === "es" ? "tu calle" : language === "en" ? "your street" : "jouw straat");
  if (language === "en") {
    return `Hello ${naam}, here is what the Schapenweide plan means for ${straat}. There will be 450 new homes in Bilthoven. Below you can see, per theme, what that means for your neighbourhood.`;
  }
  if (language === "es") {
    return `Hola ${naam}, esto es lo que el plan Schapenweide significa concretamente para ${straat}. Habrá 450 viviendas nuevas en Bilthoven. A continuación verás, por tema, qué supone para tu barrio.`;
  }
  return fallbackJson.intro
    .replace("{voornaam}", naam)
    .replace("{straatnaam}", straat);
}

export function getFallbackPlanUitleg(
  voornaam: string,
  straatnaam: string,
  language: ResidentLanguage = "nl",
): PlanUitlegReport {
  const intro = makeIntro(voornaam, straatnaam, language);
  const sections =
    language === "en" ? SECTIONS_EN : language === "es" ? SECTIONS_ES : fallbackJson.sections;
  const parsed = PlanUitlegReportSchema.parse({ intro, sections });
  return {
    ...parsed,
    source: "fallback",
    generatedAt: new Date().toISOString(),
  };
}
