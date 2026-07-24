export type ArchetypeId = 'anchor' | 'soft' | 'flex' | 'seek';

export type ChannelId = 'luna' | 'rin' | 'mika' | 'tyler' | 'nora' | 'timo' | 'popo';

export type DestinationZone =
  | 'east-asia'
  | 'southeast-asia'
  | 'europe'
  | 'oceania'
  | 'north-america'
  | 'latin-america'
  | 'africa-middle-east';

export type DestinationStyle = 'metro' | 'balanced' | 'heritage' | 'resort' | 'nature' | 'remote';

export type OriginAirportId = 'tpe' | 'rmq' | 'khh' | 'tnn';

export type DirectPreference = 'required' | 'preferred' | 'any';

export type TravelAccessMode = 'surface' | 'direct' | 'connection';

export interface TravelAccessEstimate {
  mode: TravelAccessMode;
  hours: number;
  directKnown: boolean;
  label: string;
}

export interface PlannerDestination {
  id: string;
  city: string;
  area: string;
  country: string;
  zone: DestinationZone;
  style: DestinationStyle;
  channels: ChannelId[];
  bestMonths: number[];
  dailyBudgetTwd: number;
  recommendedDays: [number, number];
  infrastructure: number;
  novelty: number;
  comfort: number;
  crowd: number;
  walkingDemand: number;
  waterFocus: number;
  sunExposure: number;
  familyFit: number;
  highlights: [string, string, string];
  caution: string;
}

export interface PlannerInput {
  archetypeId: ArchetypeId;
  channelIds: ChannelId[];
  pace: string;
  companion: string;
  budgetMode: string;
  avoidIds: string[];
  originAirport: OriginAirportId;
  directPreference: DirectPreference;
  maxTravelHours: number;
  month: number;
  days: number;
  dailyBudgetTwd: number;
}

export interface RankedDestination {
  destination: PlannerDestination;
  access: TravelAccessEstimate;
  score: number;
  confidence: '高' | '中';
  reasons: string[];
  cautions: string[];
  scoreParts: {
    mission: number;
    navigation: number;
    season: number;
    budget: number;
    practical: number;
    travelFriction: number;
  };
}

export interface ItineraryDay {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  note: string;
}

export interface Choice {
  id: string;
  title: string;
  description: string;
  accent: string;
  scene: string;
  image: string;
  explorationScore: number;
}

export interface Question {
  id: number;
  chapter: string;
  prompt: string;
  help: string;
  scoreWeight: number;
  choices: Choice[];
}

export interface Destination {
  city: string;
  country: string;
  reason: string;
  match: number;
}

export interface AffiliateSlot {
  label: string;
  provider: 'Klook' | 'KKday' | 'Trip.com';
  cta: string;
  href: string;
}

export interface Archetype {
  id: ArchetypeId;
  label: string;
  cosmicTitle: string;
  english: string;
  description: string;
  innerLine: string;
  motive: string;
  routeAdvice: string;
  bigFiveSummary: string;
  min: number;
  max: number;
  imageIndex: number;
  accent: string;
  deep: string;
  soft: string;
  traits: string[];
  stats: Array<{ label: string; value: number }>;
}

export interface CompatibilityProfile {
  archetypeId: ArchetypeId;
  bestMatchId: ArchetypeId;
  bestReason: string;
  frictionMatchId: ArchetypeId;
  frictionReason: string;
  travelAgreement: string;
}

export interface Channel {
  id: ChannelId;
  member: string;
  title: string;
  role: string;
  image: string;
  accent: string;
  deep: string;
  soft: string;
  description: string;
  tags: string[];
  destinations: Destination[];
  affiliateSlots: AffiliateSlot[];
}

export interface TravelSettingOption {
  id: string;
  label: string;
  description: string;
}
