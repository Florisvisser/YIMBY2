import type { ConcernCategory } from "@/lib/data/types";
import type { ThemaAnalyse } from "./schema";

const FALLBACK_BY_CATEGORY: Record<
  ConcernCategory,
  Pick<ThemaAnalyse, "samenvatting" | "pijnpunten" | "keyTakeaways">
> = {
  traffic_parking: {
    samenvatting:
      "Bewoners maken zich vooral zorgen over de extra verkeersdruk op de Emmalaan en Nachtegaalstraat. Met 450 nieuwe woningen verwachten zij vooral in de spits opstoppingen en onveilige situaties op schoolroutes.",
    pijnpunten: [
      "Sluipverkeer door smalle straten met weinig parkeerruimte",
      "Onveilige schoolroutes voor kinderen op de fiets",
      "Tekort aan bezoekersparkeerplekken in de bestaande wijk",
      "Geluidsoverlast van extra autobewegingen rond de Emmalaan",
    ],
    keyTakeaways: [
      "Mobiliteitstoets vraagt herijking voordat het bestemmingsplan wordt vastgesteld",
      "Verkeersveiligheid op schoolroutes vereist een afzonderlijk participatietraject",
      "Parkeernormen voor het nieuwe gebied moeten realistisch worden onderbouwd",
    ],
  },
  building_height: {
    samenvatting:
      "Bewoners zien een breuk met de bestaande woonschaal van Bilthoven. De voorgestelde zes bouwlagen geven onrust over schaduwwerking, uitzichtverlies en de stedenbouwkundige inpassing.",
    pijnpunten: [
      "Schaduwwerking op naastgelegen tuinen in de winter",
      "Verlies van bestaand uitzicht over het open weiland",
      "Schaalbreuk met de bestaande 2-3 lagen architectuur",
      "Privacy-aantasting door inkijk vanuit hogere woningen",
    ],
    keyTakeaways: [
      "Onderzoek naar bezonningsstudie ontbreekt nog en is noodzakelijk",
      "Stapeling tot zes lagen vraagt expliciete stedenbouwkundige motivering",
      "Overweeg een hoogteafbouw aan de randen richting bestaande wijken",
    ],
  },
  green_nature: {
    samenvatting:
      "Bewoners benadrukken de ecologische waarde van het terrein, in het bijzonder de beschermde dassenburcht. Verlies van bomen en groen wordt als onomkeerbaar ervaren.",
    pijnpunten: [
      "Behoud van de dassenburcht onder de Wet Natuurbescherming",
      "Kap van volwassen bomen die niet snel terug te brengen zijn",
      "Verlies van wandelroutes en informeel groen voor de buurt",
      "Onduidelijkheid over compenserende groenmaatregelen",
    ],
    keyTakeaways: [
      "Ecologische toets vereist actualisatie vóór bestemmingsplan-besluit",
      "Compensatieplan moet kwalitatief zijn, niet enkel oppervlakte",
      "Communicatie over dassenburcht-bescherming kan transparanter",
    ],
  },
  noise_livability: {
    samenvatting:
      "De zorg richt zich op de bouwperiode en de leefbaarheid daarna. Bewoners verwachten meerdere jaren overlast van bouwverkeer en machines, zonder duidelijk meldpunt.",
    pijnpunten: [
      "Bouwgeluid gedurende 6-8 jaar zonder duidelijke compensatie",
      "Vrachtverkeer op smalle wijkstraten naar de bouwplaats",
      "Onduidelijkheid over werktijden en weekendrust",
      "Stof en trillingen voor woningen direct grenzend aan het terrein",
    ],
    keyTakeaways: [
      "Bouwlogistiekplan moet vooraf worden vastgesteld en gepubliceerd",
      "Klachtenmeldpunt instellen vóór start uitvoering",
      "Werktijden en weekendrust expliciet vastleggen in vergunningvoorwaarden",
    ],
  },
};

export function getFallbackThemaAnalyse(category: ConcernCategory): ThemaAnalyse {
  return {
    ...FALLBACK_BY_CATEGORY[category],
    source: "fallback",
    generatedAt: new Date().toISOString(),
  };
}
