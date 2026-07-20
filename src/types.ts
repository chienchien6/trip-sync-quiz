export type ArchetypeId = 'anchor' | 'soft' | 'flex' | 'seek';

export type ChannelId = 'luna' | 'rin' | 'mika' | 'tyler' | 'nora' | 'timo' | 'popo';

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
  min: number;
  max: number;
  imageIndex: number;
  accent: string;
  deep: string;
  soft: string;
  traits: string[];
  stats: Array<{ label: string; value: number }>;
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
