import { computed, defineComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { guideCategoryLabels } from '../data/guides';
import type { GuideCategory, TravelGuide } from '../data/guides';

export default defineComponent({
  name: 'GuidesIndex',
  props: {
    guides: {
      type: Array as PropType<TravelGuide[]>,
      required: true,
    },
  },
  emits: {
    openGuide: (_slug: string) => true,
    startQuiz: () => true,
  },
  setup(props, { emit }) {
    const activeCategory = ref<GuideCategory | 'all'>('all');
    const categories = computed(() => ['all', ...new Set(props.guides.map((guide) => guide.category))] as Array<GuideCategory | 'all'>);
    const filteredGuides = computed(() => activeCategory.value === 'all'
      ? props.guides
      : props.guides.filter((guide) => guide.category === activeCategory.value));
    const coverUrl = (guide: TravelGuide) => `${import.meta.env.BASE_URL}${guide.cover}`;
    const openGuide = (slug: string) => emit('openGuide', slug);

    return {
      activeCategory,
      categories,
      filteredGuides,
      guideCategoryLabels,
      coverUrl,
      openGuide,
    };
  },
  template: `
    <main class="guides-index">
      <header class="guides-index-hero">
        <div>
          <p class="eyebrow">TRIP SYNC FIELD NOTES</p>
          <h1>把人格結果，<br />走成真的旅行。</h1>
          <p>從第一次滑雪、海島自由行，到 45 天長旅行。每篇都先說適合誰、怎麼走，以及哪些地方不能只看漂亮照片。</p>
        </div>
        <aside>
          <b>{{ guides.length }}</b>
          <span>篇旅行初稿</span>
          <small>資料查核：2026-07-24</small>
        </aside>
      </header>

      <nav class="guide-category-tabs" aria-label="指南分類">
        <button v-for="category in categories" :key="category" type="button" :class="{ active: activeCategory === category }" @click="activeCategory = category">
          {{ guideCategoryLabels[category] }}
        </button>
      </nav>

      <section class="guide-card-grid" aria-live="polite">
        <article v-for="guide in filteredGuides" :key="guide.slug" class="guide-card" :style="{ '--guide-accent': guide.accent }">
          <a :href="'#/guides/' + guide.slug" @click.prevent="openGuide(guide.slug)">
            <div class="guide-card-cover"><img :src="coverUrl(guide)" :alt="guide.coverAlt" /></div>
            <div class="guide-card-copy">
              <div class="guide-card-meta"><span>{{ guideCategoryLabels[guide.category] }}</span><small>{{ guide.readingMinutes }} 分鐘閱讀</small></div>
              <h2>{{ guide.title }}</h2>
              <h3>{{ guide.kicker }}</h3>
              <p>{{ guide.excerpt }}</p>
              <div class="guide-card-facts"><span>{{ guide.days }}</span><span>{{ guide.destination }}</span></div>
              <b>閱讀指南 →</b>
            </div>
          </a>
        </article>
      </section>

      <section class="guide-method-band">
        <div><p class="eyebrow">EDITORIAL METHOD</p><h2>先縮小選擇，再開始預訂。</h2></div>
        <p>指南中的預算是規劃估值，不是即時報價；交通、入境與活動日期以文章底部的官方來源為準。合作連結不影響推薦順序。</p>
        <button class="primary-button coral" type="button" @click="$emit('startQuiz')">找出旅行人格</button>
      </section>
    </main>
  `,
});
