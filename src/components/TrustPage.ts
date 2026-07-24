import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import type { SitePage, SitePageId } from '../data/sitePages';

export default defineComponent({
  name: 'TrustPage',
  props: {
    page: {
      type: Object as PropType<SitePage>,
      required: true,
    },
  },
  emits: {
    navigate: (_page: SitePageId | 'home') => true,
    startQuiz: () => true,
  },
  setup(_, { emit }) {
    const followLink = (href: string) => emit('navigate', href as SitePageId | 'home');

    return { followLink };
  },
  template: `
    <article class="trust-page">
      <header class="trust-hero">
        <div class="trust-hero-copy">
          <p class="eyebrow">{{ page.eyebrow }}</p>
          <h1>{{ page.title }}</h1>
          <p>{{ page.lead }}</p>
          <div class="trust-highlights"><span v-for="item in page.highlights" :key="item">{{ item }}</span></div>
        </div>
        <aside class="trust-status">
          <span>PUBLIC RECORD</span>
          <b>{{ page.id === 'not-found' ? '404' : 'TS / 01' }}</b>
          <p v-if="page.updatedAt">最後更新<br /><strong>{{ page.updatedAt }}</strong></p>
          <p v-else>地球探索<br /><strong>重新導航</strong></p>
        </aside>
      </header>

      <div class="trust-content">
        <section v-for="(section, index) in page.sections" :key="section.title" class="trust-section">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h2>{{ section.title }}</h2>
            <p v-for="paragraph in section.body" :key="paragraph">{{ paragraph }}</p>
            <ul v-if="section.bullets">
              <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
            </ul>
          </div>
        </section>
      </div>

      <aside v-if="page.note" class="trust-note"><b>編輯備註</b><p>{{ page.note }}</p></aside>

      <footer class="trust-actions">
        <div><p class="eyebrow">NEXT SIGNAL</p><h2>{{ page.id === 'not-found' ? '回到已知座標。' : '繼續探索 TRIP SYNC。' }}</h2></div>
        <div>
          <template v-for="link in page.links" :key="link.label">
            <a v-if="link.external" class="trust-link-button external" :href="link.href" target="_blank" rel="noopener noreferrer">{{ link.label }} <span>↗</span></a>
            <a v-else class="trust-link-button" :href="'#/' + link.href" @click.prevent="followLink(link.href)">{{ link.label }} <span>→</span></a>
          </template>
          <button v-if="page.id !== 'not-found'" class="primary-button coral" type="button" @click="$emit('startQuiz')">開始測驗</button>
        </div>
      </footer>
    </article>
  `,
});
