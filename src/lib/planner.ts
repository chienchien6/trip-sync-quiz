import type {
  ChannelId,
  DestinationZone,
  ItineraryDay,
  PlannerDestination,
  PlannerInput,
  RankedDestination,
} from '../types';
import { getTravelAccess, isTravelAccessEligible } from '../data/travelAccess';

const channelLabels: Record<ChannelId, string> = {
  luna: '舒適旅宿與慢旅行',
  rin: '街區、咖啡與獨立店家',
  mika: '市場、美食與料理',
  tyler: '山海、森林與自然體驗',
  nora: '歷史、文化與地方故事',
  timo: '交通效率與票券組合',
  popo: '親友共享與節慶氣氛',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toPart = (value: number, max: number) => Math.round(clamp(value, 0, max));

const circularMonthDistance = (a: number, b: number) => {
  const difference = Math.abs(a - b);
  return Math.min(difference, 12 - difference);
};

const navigationFit = (destination: PlannerDestination, archetypeId: PlannerInput['archetypeId']) => {
  if (archetypeId === 'anchor') {
    return destination.infrastructure * 0.45 + destination.comfort * 0.4 + (6 - destination.novelty) * 0.15;
  }
  if (archetypeId === 'soft') {
    const moderateNovelty = 5 - Math.abs(destination.novelty - 3);
    return destination.infrastructure * 0.35 + destination.comfort * 0.25 + moderateNovelty * 0.4;
  }
  if (archetypeId === 'flex') {
    const flexibleInfrastructure = 5 - Math.abs(destination.infrastructure - 4);
    return destination.novelty * 0.45 + flexibleInfrastructure * 0.35 + destination.comfort * 0.2;
  }
  return destination.novelty * 0.72 + (6 - destination.infrastructure) * 0.18 + (6 - destination.crowd) * 0.1;
};

const seasonPart = (destination: PlannerDestination, month: number) => {
  const nearestMonth = Math.min(...destination.bestMonths.map((item) => circularMonthDistance(item, month)));
  if (nearestMonth === 0) return 15;
  if (nearestMonth === 1) return 11;
  if (nearestMonth === 2) return 7;
  return 3;
};

const budgetPart = (destination: PlannerDestination, dailyBudgetTwd: number) => {
  const usageRatio = destination.dailyBudgetTwd / dailyBudgetTwd;
  if (usageRatio >= 0.65 && usageRatio <= 1) return 15;
  if (usageRatio >= 0.45) return 13;
  return 11;
};

const practicalPart = (destination: PlannerDestination, input: PlannerInput) => {
  const fits: number[] = [];
  input.avoidIds.forEach((avoidId) => {
    if (avoidId === 'crowd' || avoidId === 'queue') fits.push(6 - destination.crowd);
    if (avoidId === 'walk') fits.push(6 - destination.walkingDemand);
    if (avoidId === 'water') fits.push(6 - destination.waterFocus);
    if (avoidId === 'sun') fits.push(6 - destination.sunExposure);
    if (avoidId === 'early') fits.push(destination.style === 'remote' || destination.style === 'nature' ? 2 : 4);
  });

  if (input.companion === 'family') fits.push(destination.familyFit);
  if (input.pace === 'slow') fits.push((destination.comfort + (6 - destination.crowd)) / 2);
  if (input.pace === 'full') fits.push(destination.infrastructure);
  if (!fits.length) fits.push(4);

  return toPart((fits.reduce((total, value) => total + value, 0) / fits.length / 5) * 10, 10);
};

const frictionPart = (destination: PlannerDestination, input: PlannerInput) => {
  const access = getTravelAccess(destination, input);
  const timeRatio = access.hours / input.maxTravelHours;
  const timeFit = timeRatio <= 0.45 ? 10 : timeRatio <= 0.7 ? 8 : 6;
  const directFit = access.mode === 'surface' || access.mode === 'direct'
    ? 10
    : input.directPreference === 'preferred' ? 4 : 7;
  const [minimumDays, maximumDays] = destination.recommendedDays;
  let durationFit = input.days < minimumDays ? 3 : input.days > maximumDays + 4 ? 6 : 10;
  if (access.hours >= 8 && input.days <= 5) durationFit = Math.min(durationFit, 2);
  return toPart(timeFit * 0.35 + directFit * 0.3 + durationFit * 0.35, 10);
};

const scoreDestination = (destination: PlannerDestination, input: PlannerInput): RankedDestination => {
  const access = getTravelAccess(destination, input);
  const selectedChannels = input.channelIds.length ? input.channelIds : (['luna', 'rin', 'mika', 'tyler', 'nora', 'timo', 'popo'] as ChannelId[]);
  const channelMatches = selectedChannels.filter((id) => destination.channels.includes(id));
  const mission = toPart((channelMatches.length / selectedChannels.length) * 24 + Math.min(channelMatches.length, 2) * 3, 30);
  const navigation = toPart((navigationFit(destination, input.archetypeId) / 5) * 20, 20);
  const season = seasonPart(destination, input.month);
  const budget = budgetPart(destination, input.dailyBudgetTwd);
  const practical = practicalPart(destination, input);
  const travelFriction = frictionPart(destination, input);
  const score = clamp(mission + navigation + season + budget + practical + travelFriction, 0, 100);

  const reasons: string[] = [];
  if (channelMatches.length) reasons.push(`符合你的「${channelMatches.slice(0, 2).map((id) => channelLabels[id]).join('＋')}」任務重點`);
  if (navigation >= 16) reasons.push('當地的探索難度與你的導航人格相當合拍');
  if (season >= 11) reasons.push(`${input.month} 月落在推薦季節或相鄰月份`);
  reasons.push(`每日約 NT$${destination.dailyBudgetTwd.toLocaleString()}，不超過你的 NT$${input.dailyBudgetTwd.toLocaleString()} 上限`);
  if (travelFriction >= 8) reasons.push(`${access.label}，與 ${input.days} 天行程的移動負擔相符`);
  if (practical >= 8 && input.avoidIds.length) reasons.push('與你選擇的避雷條件衝突較少');

  const cautions: string[] = [];
  if (season <= 7) cautions.push(`${input.month} 月不是主要推薦季節，需再確認天候與活動`);
  if (input.days < destination.recommendedDays[0]) cautions.push(`建議至少安排 ${destination.recommendedDays[0]} 天`);
  if (input.avoidIds.includes('crowd') && destination.crowd >= 4) cautions.push('熱門區域人潮可能高於你的偏好');
  if (input.avoidIds.includes('walk') && destination.walkingDemand >= 4) cautions.push('核心體驗包含較多步行');
  if (input.avoidIds.includes('water') && destination.waterFocus >= 4) cautions.push('代表性體驗與水域活動關聯較高');
  if (input.avoidIds.includes('sun') && destination.sunExposure >= 4) cautions.push('戶外日曬比重偏高');
  if (access.mode === 'connection') cautions.push(`${access.label}，實際班次與轉機時間需另行確認`);
  if (access.hours / input.maxTravelHours >= 0.85) cautions.push('單程交通時間已接近你設定的上限');
  if (travelFriction <= 4) cautions.push('以目前出發機場與天數來看，移動負擔較高');
  cautions.push(destination.caution);

  return {
    destination,
    access,
    score,
    confidence: score >= 76 && cautions.length <= 3 ? '高' : '中',
    reasons: reasons.slice(0, 3),
    cautions: cautions.slice(0, 3),
    scoreParts: { mission, navigation, season, budget, practical, travelFriction },
  };
};

export const rankDestinations = (destinations: PlannerDestination[], input: PlannerInput, limit = 12) => {
  const ranked = destinations
    .filter((destination) => destination.dailyBudgetTwd <= input.dailyBudgetTwd)
    .filter((destination) => isTravelAccessEligible(destination, input))
    .map((destination) => scoreDestination(destination, input))
    .sort((a, b) => b.score - a.score || a.destination.dailyBudgetTwd - b.destination.dailyBudgetTwd);

  const countryCounts = new Map<string, number>();
  const diversified: RankedDestination[] = [];
  for (const item of ranked) {
    const count = countryCounts.get(item.destination.country) ?? 0;
    if (count >= 2) continue;
    diversified.push(item);
    countryCounts.set(item.destination.country, count + 1);
    if (diversified.length >= limit) break;
  }
  return diversified;
};

const channelActivity = (channelId: ChannelId | undefined, highlight: string) => {
  if (channelId === 'luna') return `${highlight}，保留一段旅宿休息或療癒時間`;
  if (channelId === 'rin') return `${highlight}，延伸一段不設目的地的街區散步`;
  if (channelId === 'mika') return `${highlight}，加入市場、在地餐桌或料理體驗`;
  if (channelId === 'tyler') return `${highlight}，依天候安排自然體驗`;
  if (channelId === 'nora') return `${highlight}，用導覽或博物館補上地方故事`;
  if (channelId === 'timo') return `${highlight}，使用通票或順路交通組合`;
  if (channelId === 'popo') return `${highlight}，安排適合同行者共同參與的版本`;
  return highlight;
};

export const buildItinerary = (
  destination: PlannerDestination,
  input: PlannerInput,
): ItineraryDay[] => {
  const dayCount = clamp(input.days, 2, 14);
  const channels = input.channelIds.length ? input.channelIds : destination.channels;

  return Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const highlight = destination.highlights[index % destination.highlights.length];
    const secondary = destination.highlights[(index + 1) % destination.highlights.length];
    const channel = channels[index % channels.length];

    if (day === 1) {
      return {
        day,
        title: '抵達與校準',
        morning: '抵達、前往住宿並確認當地交通方式',
        afternoon: `從住宿附近開始：${highlight}`,
        evening: '安排一頓不必趕時間的在地晚餐，提早休息',
        note: '第一天不放不可取消的遠距離活動。',
      };
    }

    if (day === dayCount) {
      return {
        day,
        title: '收束與回程',
        morning: `補上還想再看一次的 ${highlight}`,
        afternoon: '保留採買、行李整理與前往機場／車站的緩衝',
        evening: '回程',
        note: '至少保留 2 小時交通緩衝；實際時間依班機或列車調整。',
      };
    }

    const slowAfternoon = input.pace === 'slow'
      ? '回到住宿或咖啡館休息，再決定是否追加附近散步'
      : channelActivity(channels[(index + 1) % channels.length], secondary);
    const fullEvening = input.pace === 'full'
      ? `晚間加入 ${channelLabels[channels[(index + 2) % channels.length]]}`
      : '晚餐後留白，依當天體力決定是否繼續';

    return {
      day,
      title: highlight,
      morning: channelActivity(channel, highlight),
      afternoon: slowAfternoon,
      evening: fullEvening,
      note: index === 1 ? `留意：${destination.caution}` : '同一區域集中安排，避免為了多一個點反覆跨區。',
    };
  });
};

export const destinationZoneOptions: Array<{ id: DestinationZone; label: string }> = [
  { id: 'east-asia', label: '台灣／東亞' },
  { id: 'southeast-asia', label: '東南亞' },
  { id: 'europe', label: '歐洲' },
  { id: 'oceania', label: '澳洲／紐西蘭' },
  { id: 'north-america', label: '北美洲' },
  { id: 'latin-america', label: '中南美洲' },
  { id: 'africa-middle-east', label: '非洲／中東' },
];

export const monthOptions = [
  '1 月', '2 月', '3 月', '4 月', '5 月', '6 月',
  '7 月', '8 月', '9 月', '10 月', '11 月', '12 月',
].map((label, index) => ({ id: index + 1, label }));
