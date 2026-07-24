import { computed, defineComponent, nextTick, ref, type PropType } from 'vue';
import { destinationCatalogUpdatedAt, plannerDestinations } from '../data/destinations';
import {
  directPreferenceOptions,
  isTravelAccessEligible,
  maxTravelHourOptions,
  originAirportOptions,
  travelAccessUpdatedAt,
} from '../data/travelAccess';
import { buildItinerary, destinationZoneOptions, monthOptions, rankDestinations } from '../lib/planner';
import type {
  ArchetypeId,
  ChannelId,
  DestinationZone,
  DirectPreference,
  OriginAirportId,
  PlannerDestination,
  PlannerInput,
} from '../types';

const budgetDefaults: Record<string, number> = {
  value: 2800,
  balanced: 4800,
  experience: 7600,
};

const catalogChannelOptions: Array<{ id: 'all' | ChannelId; label: string }> = [
  { id: 'all', label: '全部旅行主題' },
  { id: 'luna', label: '旅宿療癒' },
  { id: 'rin', label: '城市街區' },
  { id: 'mika', label: '美食料理' },
  { id: 'tyler', label: '自然戶外' },
  { id: 'nora', label: '文化故事' },
  { id: 'timo', label: '交通效率' },
  { id: 'popo', label: '同行氣氛' },
];

export default defineComponent({
  name: 'GlobalPlanner',
  props: {
    archetypeId: { type: String as PropType<ArchetypeId>, required: true },
    channelIds: { type: Array as PropType<ChannelId[]>, default: () => [] },
    pace: { type: String, required: true },
    companion: { type: String, required: true },
    budgetMode: { type: String, required: true },
    avoidIds: { type: Array as PropType<string[]>, default: () => [] },
  },
  setup(props) {
    const originAirport = ref<OriginAirportId>('tpe');
    const directPreference = ref<DirectPreference>('preferred');
    const maxTravelHours = ref(16);
    const month = ref(new Date().getMonth() + 1);
    const days = ref(7);
    const dailyBudgetTwd = ref(budgetDefaults[props.budgetMode] ?? budgetDefaults.balanced);
    const searched = ref(false);
    const visibleCount = ref(6);
    const selectedDestinationId = ref('');
    const catalogQuery = ref('');
    const catalogZone = ref<'all' | DestinationZone>('all');
    const catalogChannel = ref<'all' | ChannelId>('all');
    const catalogBudgetOnly = ref(false);
    const compareIds = ref<string[]>([]);
    const compareMessage = ref('');

    const plannerInput = computed<PlannerInput>(() => ({
      archetypeId: props.archetypeId,
      channelIds: props.channelIds,
      pace: props.pace,
      companion: props.companion,
      budgetMode: props.budgetMode,
      avoidIds: props.avoidIds,
      originAirport: originAirport.value,
      directPreference: directPreference.value,
      maxTravelHours: maxTravelHours.value,
      month: month.value,
      days: days.value,
      dailyBudgetTwd: dailyBudgetTwd.value,
    }));

    const rankedDestinations = computed(() => rankDestinations(plannerDestinations, plannerInput.value, 12));
    const budgetCandidateCount = computed(() => plannerDestinations.filter(
      (destination) => destination.dailyBudgetTwd <= dailyBudgetTwd.value,
    ).length);
    const eligibleCandidateCount = computed(() => plannerDestinations.filter(
      (destination) => destination.dailyBudgetTwd <= dailyBudgetTwd.value
        && isTravelAccessEligible(destination, plannerInput.value),
    ).length);
    const minimumDailyBudget = Math.min(...plannerDestinations.map((destination) => destination.dailyBudgetTwd));
    const emptyResultMessage = computed(() => {
      if (!budgetCandidateCount.value) {
        return `資料庫中的最低每日估算為 ${formatCurrency(minimumDailyBudget)}，請先調高預算。`;
      }
      if (directPreference.value === 'required') {
        return '目前沒有同時符合預算、交通時間與已知直飛條件的目的地。可改成「直飛優先」或放寬交通時間。';
      }
      return '目前沒有同時符合預算與交通時間的目的地，請放寬其中一項條件。';
    });
    const filteredCatalogDestinations = computed(() => {
      const query = catalogQuery.value.trim().toLocaleLowerCase('zh-Hant');
      return plannerDestinations.filter((destination) => {
        const matchesQuery = !query || [destination.city, destination.area, destination.country]
          .some((value) => value.toLocaleLowerCase('zh-Hant').includes(query));
        const matchesZone = catalogZone.value === 'all' || destination.zone === catalogZone.value;
        const matchesChannel = catalogChannel.value === 'all' || destination.channels.includes(catalogChannel.value);
        const matchesBudget = !catalogBudgetOnly.value || destination.dailyBudgetTwd <= dailyBudgetTwd.value;
        return matchesQuery && matchesZone && matchesChannel && matchesBudget;
      });
    });
    const catalogGroups = computed(() => destinationZoneOptions
      .map((zone) => ({
        ...zone,
        destinations: filteredCatalogDestinations.value.filter((destination) => destination.zone === zone.id),
      }))
      .filter((zone) => zone.destinations.length));
    const visibleDestinations = computed(() => rankedDestinations.value.slice(0, visibleCount.value));
    const compareResults = computed(() => compareIds.value
      .map((id) => rankedDestinations.value.find((item) => item.destination.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item)));
    const selectedResult = computed(() => (
      rankedDestinations.value.find((item) => item.destination.id === selectedDestinationId.value)
      ?? rankedDestinations.value[0]
    ));
    const itinerary = computed(() => selectedResult.value
      ? buildItinerary(selectedResult.value.destination, plannerInput.value)
      : []);

    const runSearch = () => {
      searched.value = true;
      visibleCount.value = 6;
      compareIds.value = [];
      compareMessage.value = '';
      selectedDestinationId.value = rankedDestinations.value[0]?.destination.id ?? '';
      nextTick(() => document.querySelector('#global-search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const selectDestination = (id: string) => {
      selectedDestinationId.value = id;
      nextTick(() => document.querySelector('#itinerary-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const toggleCompare = (id: string) => {
      compareMessage.value = '';
      if (compareIds.value.includes(id)) {
        compareIds.value = compareIds.value.filter((item) => item !== id);
        return;
      }
      if (compareIds.value.length >= 3) {
        compareMessage.value = '最多比較 3 個目的地，請先移除一個。';
        return;
      }
      compareIds.value = [...compareIds.value, id];
    };

    const clearCompare = () => {
      compareIds.value = [];
      compareMessage.value = '';
    };

    const formatCurrency = (value: number) => `NT$${value.toLocaleString()}`;
    const tripBudget = (value: number) => value * days.value;
    const formatBestMonths = (destination: PlannerDestination) => `${destination.bestMonths.join('、')} 月`;
    const seasonLabel = (destination: PlannerDestination) => {
      if (destination.bestMonths.includes(month.value)) return '當月推薦';
      const nearestDistance = Math.min(...destination.bestMonths.map((item) => {
        const difference = Math.abs(item - month.value);
        return Math.min(difference, 12 - difference);
      }));
      return nearestDistance === 1 ? '鄰近推薦季' : '非主要季節';
    };
    const monthLabel = computed(() => monthOptions.find((item) => item.id === month.value)?.label ?? `${month.value} 月`);
    const originAirportLabel = computed(() => originAirportOptions.find(
      (item) => item.id === originAirport.value,
    )?.shortLabel ?? '桃園');
    const affiliateLinks = computed(() => {
      const place = selectedResult.value?.destination;
      const label = place ? `${place.city}・${place.country}` : '目的地';
      return [
        { provider: 'Klook', label: `${label} 體驗與交通`, cta: '搜尋活動', href: 'https://www.klook.com/' },
        { provider: 'KKday', label: `${label} 一日遊與票券`, cta: '搜尋票券', href: 'https://www.kkday.com/' },
        { provider: 'Trip.com', label: `${label} 住宿與移動`, cta: '搜尋住宿', href: 'https://www.trip.com/' },
      ];
    });

    return {
      destinationCatalogUpdatedAt,
      travelAccessUpdatedAt,
      destinationZoneOptions,
      catalogChannelOptions,
      originAirportOptions,
      maxTravelHourOptions,
      directPreferenceOptions,
      monthOptions,
      plannerDestinations,
      originAirport,
      directPreference,
      maxTravelHours,
      month,
      days,
      dailyBudgetTwd,
      searched,
      visibleCount,
      rankedDestinations,
      budgetCandidateCount,
      eligibleCandidateCount,
      minimumDailyBudget,
      emptyResultMessage,
      catalogQuery,
      catalogZone,
      catalogChannel,
      catalogBudgetOnly,
      filteredCatalogDestinations,
      catalogGroups,
      visibleDestinations,
      compareIds,
      compareResults,
      compareMessage,
      selectedDestinationId,
      selectedResult,
      itinerary,
      monthLabel,
      originAirportLabel,
      affiliateLinks,
      runSearch,
      selectDestination,
      toggleCompare,
      clearCompare,
      formatCurrency,
      tripBudget,
      formatBestMonths,
      seasonLabel,
    };
  },
  template: `
    <section id="global-planner" class="global-planner">
      <section class="planner-brief">
        <div class="planner-brief-copy">
          <p class="eyebrow">GLOBAL DESTINATION SEARCH</p>
          <h2>不要從三個答案裡選，<br />讓全球候選地一起接受評分。</h2>
          <p>人格決定怎麼規劃，任務頻道決定想看什麼；出發機場、交通時間、月份、天數與避雷條件負責可行性，最高預算則會直接排除超標目的地。</p>
        </div>

        <div class="planner-form" aria-label="全球目的地搜尋條件">
          <label>
            <span>從哪個機場出發？</span>
            <select v-model="originAirport">
              <option v-for="option in originAirportOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
          </label>
          <label>
            <span>預計幾月出發？</span>
            <select v-model.number="month">
              <option v-for="option in monthOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
          </label>
          <label>
            <span>旅行天數</span>
            <div class="number-control">
              <button type="button" aria-label="減少旅行天數" :disabled="days <= 2" @click="days -= 1">−</button>
              <b>{{ days }} 天</b>
              <button type="button" aria-label="增加旅行天數" :disabled="days >= 14" @click="days += 1">＋</button>
            </div>
          </label>
          <label>
            <span>單程交通時間上限</span>
            <select v-model.number="maxTravelHours">
              <option v-for="option in maxTravelHourOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
          </label>
          <label>
            <span>每人每日最高預算</span>
            <div class="budget-input"><span>NT$</span><input v-model.number="dailyBudgetTwd" type="number" min="1200" max="20000" step="500" inputmode="numeric" /></div>
            <small class="budget-scope">住宿＋餐食＋市內交通＋一般體驗</small>
          </label>
          <div class="planner-direct-field">
            <span>轉機接受度</span>
            <div class="planner-direct-options">
              <button
                v-for="option in directPreferenceOptions"
                :key="option.id"
                type="button"
                :class="{ selected: directPreference === option.id }"
                :aria-pressed="directPreference === option.id"
                :title="option.description"
                @click="directPreference = option.id"
              >{{ option.label }}</button>
            </div>
          </div>
          <button class="primary-button coral planner-submit" type="button" @click="runSearch">搜尋適合我的地球座標 →</button>
        </div>

        <div class="catalog-trust">
          <strong>{{ plannerDestinations.length }} 個候選目的地</strong>
          <span>資料版本 {{ destinationCatalogUpdatedAt }}</span>
          <span>航線估算版本 {{ travelAccessUpdatedAt }}</span>
          <span>國際機票、購物與高價特殊活動另計</span>
        </div>

        <details class="destination-catalog">
          <summary>查看全部 {{ plannerDestinations.length }} 個目的地 <span>＋</span></summary>
          <div class="catalog-toolbar">
            <label class="catalog-search">
              <span>目的地搜尋</span>
              <input v-model="catalogQuery" type="search" placeholder="輸入城市、國家或地區" />
            </label>
            <label>
              <span>旅行主題</span>
              <select v-model="catalogChannel">
                <option v-for="option in catalogChannelOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
              </select>
            </label>
            <label class="catalog-budget-toggle">
              <input v-model="catalogBudgetOnly" type="checkbox" />
              <span>只看每日 {{ formatCurrency(dailyBudgetTwd) }} 內</span>
            </label>
          </div>
          <div class="catalog-zone-tabs" aria-label="目的地區域">
            <button type="button" :class="{ selected: catalogZone === 'all' }" @click="catalogZone = 'all'">全部區域</button>
            <button v-for="zone in destinationZoneOptions" :key="zone.id" type="button" :class="{ selected: catalogZone === zone.id }" @click="catalogZone = zone.id">{{ zone.label }}</button>
          </div>
          <p class="catalog-result-count">找到 {{ filteredCatalogDestinations.length }} 個目的地</p>
          <p v-if="!filteredCatalogDestinations.length" class="catalog-empty">沒有符合目前條件的目的地，請放寬區域、主題或預算篩選。</p>
          <div v-else class="destination-catalog-groups">
            <section v-for="group in catalogGroups" :key="group.id">
              <h3>{{ group.label }} <small>{{ group.destinations.length }}</small></h3>
              <div>
                <article v-for="destination in group.destinations" :key="destination.id">
                  <div><b>{{ destination.city }}</b><span>{{ destination.country }}・{{ destination.area }}</span></div>
                  <strong>{{ formatCurrency(destination.dailyBudgetTwd) }}<small>／日</small></strong>
                  <p>{{ seasonLabel(destination) }}・建議 {{ destination.recommendedDays[0] }}–{{ destination.recommendedDays[1] }} 天</p>
                </article>
              </div>
            </section>
          </div>
        </details>
      </section>

      <section v-if="searched" id="global-search-results" class="planner-results">
        <div class="planner-section-heading">
          <div><p class="eyebrow">MATCHED COORDINATES</p><h2>{{ monthLabel }}的全球適配結果</h2><span class="budget-match-count">{{ eligibleCandidateCount }} 個目的地符合每日 {{ formatCurrency(dailyBudgetTwd) }}、{{ maxTravelHours }} 小時交通上限{{ directPreference === 'required' ? '與已知直飛' : '' }}</span></div>
          <p>從{{ originAirportLabel }}出發；超過預算或交通時間的目的地不會出現。其餘結果再依任務、人格、季節、避雷條件與移動負擔排序，且與聯盟佣金無關。</p>
        </div>

        <div v-if="rankedDestinations.length" class="destination-card-grid">
          <article
            v-for="(item, index) in visibleDestinations"
            :key="item.destination.id"
            class="planner-destination-card"
            :class="{ selected: selectedResult?.destination.id === item.destination.id, compared: compareIds.includes(item.destination.id) }"
          >
            <button class="destination-select" type="button" @click="selectDestination(item.destination.id)">
              <span class="destination-rank">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="destination-score"><b>{{ item.score }}</b><small>適配分</small></span>
              <span class="destination-card-copy">
                <small>{{ item.destination.country }}・{{ item.destination.area }}</small>
                <strong>{{ item.destination.city }}</strong>
                <em>{{ item.access.label }}・{{ seasonLabel(item.destination) }}</em>
                <span>{{ item.reasons[0] }}</span>
              </span>
              <span class="destination-budget">{{ formatCurrency(item.destination.dailyBudgetTwd) }}<small>／日・{{ days }} 天約 {{ formatCurrency(tripBudget(item.destination.dailyBudgetTwd)) }}</small></span>
            </button>
            <label class="destination-compare-toggle" @click.stop>
              <input type="checkbox" :checked="compareIds.includes(item.destination.id)" @change="toggleCompare(item.destination.id)" />
              <span>{{ compareIds.includes(item.destination.id) ? '已加入' : '比較' }}</span>
            </label>
          </article>
        </div>

        <div v-else class="planner-empty">
          <strong>目前沒有符合全部條件的目的地</strong>
          <p>{{ emptyResultMessage }}</p>
        </div>

        <button v-if="rankedDestinations.length && visibleCount < rankedDestinations.length" class="text-button planner-more" type="button" @click="visibleCount = 12">查看其餘候選地 ↓</button>
      </section>

      <section v-if="searched && compareResults.length" class="destination-comparison">
        <header>
          <div><p class="eyebrow">COMPARE SHORTLIST</p><h2>目的地比較</h2></div>
          <div><span>{{ compareResults.length }} / 3</span><button type="button" @click="clearCompare">清除</button></div>
        </header>
        <p v-if="compareMessage" class="compare-message">{{ compareMessage }}</p>
        <p v-else-if="compareResults.length === 1" class="compare-message">再加入 1–2 個目的地，就能快速比較差異。</p>
        <div class="comparison-grid" :class="'count-' + compareResults.length">
          <article v-for="item in compareResults" :key="item.destination.id">
            <header><div><small>{{ item.destination.country }}</small><h3>{{ item.destination.city }}</h3></div><b>{{ item.score }}<small>適配分</small></b></header>
            <dl>
              <div><dt>每日估算</dt><dd>{{ formatCurrency(item.destination.dailyBudgetTwd) }}</dd></div>
              <div><dt>{{ days }} 天估算</dt><dd>{{ formatCurrency(tripBudget(item.destination.dailyBudgetTwd)) }}</dd></div>
              <div><dt>出發季節</dt><dd>{{ seasonLabel(item.destination) }}</dd></div>
              <div><dt>單程交通</dt><dd>{{ item.access.label }}</dd></div>
              <div><dt>推薦月份</dt><dd>{{ formatBestMonths(item.destination) }}</dd></div>
              <div><dt>建議天數</dt><dd>{{ item.destination.recommendedDays[0] }}–{{ item.destination.recommendedDays[1] }} 天</dd></div>
            </dl>
            <p>{{ item.reasons[0] }}</p>
            <small class="comparison-caution">{{ item.cautions[0] }}</small>
            <button class="primary-button dark" type="button" @click="selectDestination(item.destination.id)">用這個目的地排旅程 →</button>
          </article>
        </div>
      </section>

      <section v-if="searched && selectedResult" id="itinerary-draft" class="itinerary-workspace">
        <header class="itinerary-header">
          <div>
            <p class="eyebrow">SELECTED DESTINATION</p>
            <h2>{{ selectedResult.destination.city }}</h2>
            <p>{{ selectedResult.destination.country }}・{{ selectedResult.destination.area }}｜{{ selectedResult.access.label }}｜{{ days }} 天初步行程</p>
          </div>
          <div class="selected-score"><b>{{ selectedResult.score }}</b><span>適配分</span></div>
        </header>

        <div class="planner-explanation">
          <section>
            <h3>為什麼推薦</h3>
            <ul><li v-for="reason in selectedResult.reasons" :key="reason">{{ reason }}</li></ul>
          </section>
          <section>
            <h3>先知道這些</h3>
            <ul><li v-for="caution in selectedResult.cautions" :key="caution">{{ caution }}</li></ul>
          </section>
          <section class="score-breakdown">
            <h3>分數怎麼來</h3>
            <div><span>任務興趣</span><i><b :style="{ width: (selectedResult.scoreParts.mission / 30 * 100) + '%' }"></b></i><strong>{{ selectedResult.scoreParts.mission }}/30</strong></div>
            <div><span>導航人格</span><i><b :style="{ width: (selectedResult.scoreParts.navigation / 20 * 100) + '%' }"></b></i><strong>{{ selectedResult.scoreParts.navigation }}/20</strong></div>
            <div><span>月份季節</span><i><b :style="{ width: (selectedResult.scoreParts.season / 15 * 100) + '%' }"></b></i><strong>{{ selectedResult.scoreParts.season }}/15</strong></div>
            <div><span>預算符合</span><i><b :style="{ width: (selectedResult.scoreParts.budget / 15 * 100) + '%' }"></b></i><strong>{{ selectedResult.scoreParts.budget }}/15</strong></div>
            <div><span>避雷可行</span><i><b :style="{ width: (selectedResult.scoreParts.practical / 10 * 100) + '%' }"></b></i><strong>{{ selectedResult.scoreParts.practical }}/10</strong></div>
            <div><span>旅程摩擦</span><i><b :style="{ width: (selectedResult.scoreParts.travelFriction / 10 * 100) + '%' }"></b></i><strong>{{ selectedResult.scoreParts.travelFriction }}/10</strong></div>
          </section>
        </div>

        <div class="itinerary-heading">
          <div><p class="eyebrow">ITINERARY DRAFT</p><h3>先排節奏，再補上可預訂地點</h3></div>
          <p>這是依目的地結構產生的第一版草案；正式上線後再用即時地點、營業時間與移動資料校正。</p>
        </div>
        <div class="itinerary-days">
          <article v-for="day in itinerary" :key="day.day" class="itinerary-day">
            <div><small>DAY</small><b>{{ String(day.day).padStart(2, '0') }}</b></div>
            <section>
              <h4>{{ day.title }}</h4>
              <p><span>上午</span>{{ day.morning }}</p>
              <p><span>下午</span>{{ day.afternoon }}</p>
              <p><span>晚上</span>{{ day.evening }}</p>
              <small>{{ day.note }}</small>
            </section>
          </article>
        </div>

        <aside class="planner-booking">
          <div><p class="eyebrow">BOOKABLE LAYER</p><h3>確認行程後，再比對可預訂商品</h3><p>目前先導向平台搜尋；取得聯盟帳號與資料權限後，再換成城市、日期與票券級的追蹤連結。</p></div>
          <div class="planner-booking-links">
            <a v-for="link in affiliateLinks" :key="link.provider" :href="link.href" target="_blank" rel="sponsored noopener"><span><b>{{ link.provider }}</b>{{ link.label }}</span><strong>{{ link.cta }} →</strong></a>
          </div>
        </aside>

        <p class="planner-disclaimer">每日預算是每人城市層級估算，包含雙人房分攤住宿、一般餐食、市內交通與基本體驗；不含國際機票、購物、旺季漲幅及潛水等高價特殊活動。直飛狀態與交通時間是 {{ travelAccessUpdatedAt }} 的規劃估算，不是即時航班承諾；航空公司可能季節性調整或停飛，預訂前需再次確認。簽證、治安事件、臨時閉館與醫療風險亦未即時串接。</p>
      </section>
    </section>
  `,
});
