import { computed, defineComponent } from 'vue';
import type { PropType } from 'vue';
import type { TravelGuide } from '../data/guides';

export default defineComponent({
  name: 'GuideArticle',
  props: {
    guide: {
      type: Object as PropType<TravelGuide>,
      required: true,
    },
    guides: {
      type: Array as PropType<TravelGuide[]>,
      required: true,
    },
  },
  emits: {
    openGuide: (_slug: string) => true,
    openGuides: () => true,
    startQuiz: () => true,
  },
  setup(props, { emit }) {
    const coverUrl = computed(() => `${import.meta.env.BASE_URL}${props.guide.cover}`);
    const relatedGuides = computed(() => props.guide.related
      .map((slug) => props.guides.find((guide) => guide.slug === slug))
      .filter(Boolean) as TravelGuide[]);
    const articleImageUrl = (src: string) => `${import.meta.env.BASE_URL}${src}`;
    const relatedCoverUrl = (guide: TravelGuide) => `${import.meta.env.BASE_URL}${guide.cover}`;
    const scrollToSection = (id: string) => document.querySelector(`#guide-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return { coverUrl, relatedGuides, articleImageUrl, relatedCoverUrl, scrollToSection, emit };
  },
  template: `
    <main class="guide-article" :style="{ '--guide-accent': guide.accent }">
      <nav class="guide-breadcrumb" aria-label="麵包屑">
        <a href="#/guides" @click.prevent="$emit('openGuides')">旅行指南</a><span>/</span><b>{{ guide.destination }}</b>
      </nav>

      <header class="guide-article-hero">
        <div class="guide-article-heading">
          <p class="eyebrow">{{ guide.destination }} / {{ guide.days }}</p>
          <h1>{{ guide.title }}</h1>
          <h2>{{ guide.kicker }}</h2>
          <p>{{ guide.excerpt }}</p>
          <div class="guide-personality-row"><span v-for="item in guide.personalityFit" :key="item">{{ item }}</span></div>
        </div>
        <figure><img :src="coverUrl" :alt="guide.coverAlt" /><figcaption>TRIP SYNC FIELD NOTE / {{ guide.updatedAt }}</figcaption></figure>
      </header>

      <section class="guide-quick-facts">
        <div><small>建議天數</small><b>{{ guide.days }}</b></div>
        <div><small>每日預算</small><b>{{ guide.budget }}</b></div>
        <div><small>建議季節</small><b>{{ guide.bestTime }}</b></div>
        <div><small>任務頻道</small><b>{{ guide.channelFit.join('・') }}</b></div>
      </section>

      <div class="guide-reading-layout">
        <aside class="guide-toc">
          <p class="eyebrow">IN THIS GUIDE</p>
          <button v-for="(section, index) in guide.sections" :key="section.id" type="button" @click="scrollToSection(section.id)">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>{{ section.title }}
          </button>
          <button type="button" @click="scrollToSection('itinerary')"><span>＋</span>建議行程</button>
          <button type="button" @click="scrollToSection('sources')"><span>↗</span>官方來源</button>
        </aside>

        <article class="guide-reading-body">
          <section class="guide-intro">
            <p v-for="paragraph in guide.intro" :key="paragraph">{{ paragraph }}</p>
          </section>

          <section class="guide-fit-grid">
            <article><small>這篇適合你，如果</small><ul><li v-for="item in guide.idealFor" :key="item">{{ item }}</li></ul></article>
            <article><small>先換一條路，如果</small><ul><li v-for="item in guide.notFor" :key="item">{{ item }}</li></ul></article>
          </section>

          <section v-for="(section, index) in guide.sections" :id="'guide-' + section.id" :key="section.id" class="guide-prose-section">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <h2>{{ section.title }}</h2>
            <template v-for="(paragraph, paragraphIndex) in section.paragraphs" :key="paragraph">
              <p>{{ paragraph }}</p>
              <figure
                v-if="section.image && paragraphIndex === (section.imageAfterParagraph ?? section.paragraphs.length - 1)"
                class="guide-inline-image"
                :class="'is-' + (section.image.layout ?? 'wide')"
              >
                <img :src="articleImageUrl(section.image.src)" :alt="section.image.alt" loading="lazy" />
                <figcaption v-if="section.image.caption">{{ section.image.caption }}</figcaption>
              </figure>
            </template>
            <ul v-if="section.bullets"><li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li></ul>
            <aside v-if="section.callout"><b>TRIP SYNC 提醒</b><p>{{ section.callout }}</p></aside>
          </section>

          <section id="guide-itinerary" class="guide-itinerary-section">
            <div class="guide-section-heading"><p class="eyebrow">SUGGESTED ROUTE</p><h2>一條可以再改成你的行程</h2></div>
            <div class="guide-itinerary-list">
              <article v-for="item in guide.itinerary" :key="item.day"><b>{{ item.day }}</b><div><h3>{{ item.title }}</h3><p>{{ item.detail }}</p></div></article>
            </div>
          </section>

          <section class="guide-checklist">
            <div><p class="eyebrow">BEFORE YOU BOOK</p><h2>預訂前檢查</h2></div>
            <ul><li v-for="item in guide.checklist" :key="item">{{ item }}</li></ul>
          </section>

          <section class="guide-booking-layer">
            <div class="guide-section-heading"><p class="eyebrow">BOOKABLE LAYER</p><h2>行程確定後，再搜尋可預訂項目</h2><p>目前是一般平台入口，尚未加入聯盟追蹤碼。</p></div>
            <div>
              <a v-for="item in guide.bookingIdeas" :key="item.provider" :href="item.href" target="_blank" rel="noopener noreferrer">
                <small>{{ item.provider }}</small><strong>{{ item.title }}</strong><p>{{ item.description }}</p><span>前往平台 ↗</span>
              </a>
            </div>
            <p class="guide-affiliate-note">未來部分連結可能成為合作連結。若你完成預訂，TRIP SYNC 可能獲得佣金，但不會增加你的購買價格，也不影響推薦排序。</p>
          </section>

          <section id="guide-sources" class="guide-sources">
            <div class="guide-section-heading"><p class="eyebrow">OFFICIAL SOURCES</p><h2>這篇查核過的資料</h2><p>最後查核：{{ guide.updatedAt }}</p></div>
            <a v-for="source in guide.sources" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer"><span>{{ source.label }}</span><small>{{ source.note }}</small><b>↗</b></a>
          </section>

          <figure
            v-if="guide.closingImage"
            class="guide-closing-image"
            :class="'is-' + (guide.closingImage.layout ?? 'wide')"
          >
            <img :src="articleImageUrl(guide.closingImage.src)" :alt="guide.closingImage.alt" loading="lazy" />
            <figcaption v-if="guide.closingImage.caption">{{ guide.closingImage.caption }}</figcaption>
          </figure>
        </article>
      </div>

      <section v-if="relatedGuides.length" class="related-guides">
        <div class="guide-section-heading"><p class="eyebrow">KEEP EXPLORING</p><h2>下一篇可以從這裡走</h2></div>
        <div>
          <a v-for="item in relatedGuides" :key="item.slug" :href="'#/guides/' + item.slug" @click.prevent="$emit('openGuide', item.slug)">
            <img :src="relatedCoverUrl(item)" :alt="item.coverAlt" /><span><small>{{ item.destination }}</small><b>{{ item.title }}</b><em>{{ item.kicker }}</em></span>
          </a>
        </div>
      </section>
    </main>
  `,
});
