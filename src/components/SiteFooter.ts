import { defineComponent } from 'vue';
import type { SitePageId } from '../data/sitePages';

export default defineComponent({
  name: 'SiteFooter',
  emits: {
    navigate: (_page: SitePageId | 'home' | 'guides') => true,
  },
  setup(_, { emit }) {
    const navigate = (page: SitePageId | 'home' | 'guides') => emit('navigate', page);
    return { navigate };
  },
  template: `
    <footer class="site-footer">
      <div class="site-footer-intro">
        <a class="brand footer-brand" href="#/" @click.prevent="navigate('home')">
          <span class="brand-mark">TS</span>
          <span><b>TRIP SYNC</b><small>旅行人格 × 全球行程規劃</small></span>
        </a>
        <p>先理解你的旅行方式，再一起決定地球下一站。</p>
      </div>

      <nav class="site-footer-links" aria-label="網站資訊">
        <div><b>TRIP SYNC</b><a href="#/guides" @click.prevent="navigate('guides')">旅行指南</a><a href="#/about" @click.prevent="navigate('about')">關於我們</a><a href="#/methodology" @click.prevent="navigate('methodology')">推薦方法</a><a href="#/contact" @click.prevent="navigate('contact')">聯絡與更正</a></div>
        <div><b>透明資訊</b><a href="#/privacy" @click.prevent="navigate('privacy')">隱私權政策</a><a href="#/affiliate" @click.prevent="navigate('affiliate')">聯盟行銷揭露</a><a href="https://github.com/chienchien6/trip-sync-quiz" target="_blank" rel="noopener noreferrer">GitHub 專案 ↗</a></div>
      </nav>

      <div class="site-footer-bottom">
        <span>© 2026 TRIP SYNC</span>
        <span>目的地資料更新：2026-07-24</span>
        <span>旅行偏好分析，不是心理診斷</span>
      </div>
    </footer>
  `,
});
