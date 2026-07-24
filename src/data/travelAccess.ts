import type {
  DestinationZone,
  OriginAirportId,
  PlannerDestination,
  PlannerInput,
  TravelAccessEstimate,
} from '../types';

export const travelAccessUpdatedAt = '2026-07-24';

export const originAirportOptions: Array<{ id: OriginAirportId; label: string; shortLabel: string }> = [
  { id: 'tpe', label: '桃園機場・北部', shortLabel: '桃園' },
  { id: 'rmq', label: '台中機場・中部', shortLabel: '台中' },
  { id: 'khh', label: '高雄機場・南部', shortLabel: '高雄' },
  { id: 'tnn', label: '台南機場・南部', shortLabel: '台南' },
];

export const maxTravelHourOptions = [
  { id: 3, label: '3 小時內' },
  { id: 5, label: '5 小時內' },
  { id: 8, label: '8 小時內' },
  { id: 12, label: '12 小時內' },
  { id: 16, label: '16 小時內' },
  { id: 24, label: '不限長程（24 小時內）' },
];

export const directPreferenceOptions: Array<{
  id: PlannerInput['directPreference'];
  label: string;
  description: string;
}> = [
  { id: 'required', label: '只看直飛', description: '排除資料庫中未確認直飛的國際目的地' },
  { id: 'preferred', label: '直飛優先', description: '轉機仍可出現，但直飛會得到較高分數' },
  { id: 'any', label: '可接受轉機', description: '只依總交通時間與其他條件排序' },
];

const directDestinationIds: Record<OriginAirportId, Set<string>> = {
  tpe: new Set([
    'tokyo', 'osaka', 'nagoya', 'fukuoka', 'nagasaki', 'sapporo', 'hakodate', 'sendai', 'aomori',
    'akita', 'kumamoto', 'miyazaki', 'kagoshima', 'takamatsu', 'okayama-kurashiki', 'hiroshima-miyajima',
    'naha', 'ishigaki', 'miyakojima', 'seoul', 'busan', 'jeju', 'daegu', 'hong-kong', 'macau',
    'shanghai', 'beijing', 'chengdu', 'xiamen', 'chongqing', 'hangzhou', 'nanjing', 'bangkok',
    'chiang-mai', 'phuket', 'hanoi', 'ho-chi-minh-city', 'da-nang', 'kuala-lumpur', 'penang',
    'kota-kinabalu', 'singapore', 'manila', 'cebu', 'clark-subic', 'jakarta', 'bali', 'phnom-penh',
    'sydney', 'melbourne', 'brisbane', 'auckland', 'paris', 'london', 'frankfurt-rhine', 'munich',
    'vienna', 'amsterdam', 'rome', 'milan', 'prague', 'istanbul', 'vancouver', 'toronto', 'new-york',
  ]),
  rmq: new Set([
    'tokyo', 'kumamoto', 'takamatsu', 'naha', 'miyakojima', 'seoul', 'jeju', 'hong-kong', 'macau',
    'ho-chi-minh-city',
  ]),
  khh: new Set([
    'tokyo', 'osaka', 'nagoya', 'fukuoka', 'sapporo', 'sendai', 'kumamoto', 'naha', 'seoul', 'busan',
    'jeju', 'hong-kong', 'macau', 'shanghai', 'xiamen', 'bangkok', 'chiang-mai', 'hanoi',
    'ho-chi-minh-city', 'da-nang', 'kuala-lumpur', 'singapore', 'manila',
  ]),
  tnn: new Set(['kumamoto', 'naha']),
};

const countryFlightHours: Record<string, number> = {
  台灣: 1,
  日本: 3,
  韓國: 2.5,
  中國香港: 2,
  中國澳門: 2,
  中國: 3.5,
  越南: 3.5,
  泰國: 4,
  馬來西亞: 4.5,
  新加坡: 4.5,
  菲律賓: 3,
  印尼: 5.5,
  柬埔寨: 3.5,
  寮國: 4,
  德國: 14,
  瑞典: 14.5,
  波蘭: 14,
  奧地利: 13.5,
  匈牙利: 14,
  西班牙: 15,
  葡萄牙: 16,
  捷克: 13.5,
  丹麥: 14,
  荷蘭: 13.5,
  斯洛維尼亞: 14,
  義大利: 14,
  冰島: 17,
  法國: 14,
  英國: 14.5,
  瑞士: 14,
  希臘: 14.5,
  澳洲: 9.5,
  紐西蘭: 11.5,
  加拿大: 12.5,
  美國: 13.5,
  墨西哥: 18,
  土耳其: 12.5,
  南非: 18,
  摩洛哥: 17,
};

const zoneFlightHours: Record<DestinationZone, number> = {
  'east-asia': 3,
  'southeast-asia': 4.5,
  europe: 14.5,
  oceania: 10,
  'north-america': 13,
  'latin-america': 19,
  'africa-middle-east': 16,
};

const connectionPenalty: Record<OriginAirportId, number> = {
  tpe: 3.5,
  rmq: 4,
  khh: 4,
  tnn: 5,
};

const surfaceHours: Record<OriginAirportId, Record<string, number>> = {
  tpe: {
    taipei: 1,
    'new-taipei-north-coast': 1.5,
    yilan: 2,
    taichung: 2,
    nantou: 3,
    hualien: 3.5,
    tainan: 3,
    kaohsiung: 3.5,
    taitung: 4.5,
  },
  rmq: {
    taichung: 0.75,
    nantou: 1.5,
    taipei: 2,
    'new-taipei-north-coast': 2.5,
    yilan: 3,
    hualien: 4,
    tainan: 2,
    kaohsiung: 2.5,
    taitung: 4.5,
  },
  khh: {
    kaohsiung: 0.75,
    tainan: 1,
    taitung: 3,
    taichung: 2.5,
    nantou: 3,
    hualien: 4.5,
    taipei: 3,
    'new-taipei-north-coast': 3.5,
    yilan: 4,
  },
  tnn: {
    tainan: 0.5,
    kaohsiung: 1.25,
    taichung: 2,
    nantou: 2.5,
    taitung: 3.5,
    taipei: 3,
    'new-taipei-north-coast': 3.5,
    yilan: 4,
    hualien: 4.5,
  },
};

const roundHalfHour = (value: number) => Math.round(value * 2) / 2;

export const getTravelAccess = (
  destination: PlannerDestination,
  input: Pick<PlannerInput, 'originAirport'>,
): TravelAccessEstimate => {
  if (destination.country === '台灣') {
    const hours = surfaceHours[input.originAirport][destination.id] ?? 3;
    return {
      mode: 'surface',
      hours,
      directKnown: true,
      label: `陸路約 ${hours} 小時`,
    };
  }

  const directKnown = directDestinationIds[input.originAirport].has(destination.id);
  const baseHours = countryFlightHours[destination.country] ?? zoneFlightHours[destination.zone];
  const hours = roundHalfHour(baseHours + (directKnown ? 0 : connectionPenalty[input.originAirport]));
  return {
    mode: directKnown ? 'direct' : 'connection',
    hours,
    directKnown,
    label: directKnown ? `已知直飛・約 ${hours} 小時` : `通常需轉機・約 ${hours} 小時`,
  };
};

export const isTravelAccessEligible = (
  destination: PlannerDestination,
  input: Pick<PlannerInput, 'originAirport' | 'directPreference' | 'maxTravelHours'>,
) => {
  const access = getTravelAccess(destination, input);
  if (access.hours > input.maxTravelHours) return false;
  if (input.directPreference === 'required' && access.mode === 'connection') return false;
  return true;
};
