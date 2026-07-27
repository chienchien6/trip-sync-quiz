export type GuideCategory = 'snow' | 'island' | 'city' | 'event' | 'long-trip' | 'car-free' | 'local-tips';

export interface GuideSource {
  label: string;
  url: string;
  note: string;
}

export interface GuideImage {
  src: string;
  alt: string;
  caption?: string;
  layout?: 'wide' | 'portrait';
}

export interface GuideSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: string;
  image?: GuideImage;
  imageAfterParagraph?: number;
}

export interface GuideItineraryDay {
  day: string;
  title: string;
  detail: string;
}

export interface GuideBookingIdea {
  provider: 'Klook' | 'KKday' | 'Trip.com';
  title: string;
  description: string;
  href: string;
}

export interface TravelGuide {
  status?: 'draft' | 'published';
  slug: string;
  title: string;
  kicker: string;
  excerpt: string;
  destination: string;
  category: GuideCategory;
  cover: string;
  coverAlt: string;
  accent: string;
  days: string;
  budget: string;
  bestTime: string;
  readingMinutes: number;
  updatedAt: string;
  personalityFit: string[];
  channelFit: string[];
  idealFor: string[];
  notFor: string[];
  intro: string[];
  sections: GuideSection[];
  itinerary: GuideItineraryDay[];
  checklist: string[];
  bookingIdeas: GuideBookingIdea[];
  sources: GuideSource[];
  related: string[];
  closingImage?: GuideImage;
}

export const guideCategoryLabels: Record<GuideCategory | 'all', string> = {
  all: '全部指南',
  snow: '雪季旅行',
  island: '海島慢旅',
  city: '城市小資',
  event: '節慶旅行',
  'long-trip': '長天數',
  'car-free': '不自駕',
  'local-tips': '在地眉角',
};

import guidesData from './guides.json';

export const travelGuides = guidesData as TravelGuide[];

export const isGuidePublished = (guide: TravelGuide) => guide.status !== 'draft';

export const publishedTravelGuides = travelGuides.filter(isGuidePublished);

export const guideBySlug = (slug: string) => publishedTravelGuides.find((guide) => guide.slug === slug);
