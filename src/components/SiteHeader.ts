import { defineComponent, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { SitePageId } from '../data/sitePages';

export default defineComponent({
  name: 'SiteHeader',
  props: {
    activePage: {
      type: String as PropType<SitePageId | 'home' | 'guides' | 'guide' | 'admin'>,
      default: 'home',
    },
    mode: {
      type: String as PropType<'landing' | 'content'>,
      default: 'landing',
    },
  },
  emits: {
    navigate: (_page: SitePageId | 'home' | 'guides') => true,
    startQuiz: () => true,
  },
  setup(props, { emit }) {
    const menuOpen = ref(false);

    watch(() => props.activePage, () => {
      menuOpen.value = false;
    });

    const navigate = (page: SitePageId | 'home' | 'guides') => {
      menuOpen.value = false;
      emit('navigate', page);
    };

    const start = () => {
      menuOpen.value = false;
      emit('startQuiz');
    };

    return { menuOpen, navigate, start };
  },
  template: `
    <header class="site-header top-nav glass-panel" :class="{ 'content-nav': mode === 'content' }">
      <a class="brand brand-button" href="#/" aria-label="Trip Sync 首頁" @click.prevent="navigate('home')">
        <span class="brand-mark">TS</span>
        <span><b>TRIP SYNC</b><small>地球探索計畫</small></span>
      </a>

      <nav class="desktop-site-nav" aria-label="主要導覽">
        <a href="#/guides" :class="{ active: activePage === 'guides' || activePage === 'guide' }" @click.prevent="navigate('guides')">旅行指南</a>
        <a href="#/methodology" :class="{ active: activePage === 'methodology' }" @click.prevent="navigate('methodology')">推薦方法</a>
        <a href="#/about" :class="{ active: activePage === 'about' }" @click.prevent="navigate('about')">關於</a>
        <a href="#/contact" :class="{ active: activePage === 'contact' }" @click.prevent="navigate('contact')">聯絡</a>
        <button class="nav-quiz-button" type="button" @click="start">開始測驗</button>
      </nav>

      <button class="menu-toggle" type="button" aria-label="開啟網站選單" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
        <span></span><span></span><span></span>
      </button>

      <Transition name="menu-fade">
        <nav v-if="menuOpen" class="mobile-site-nav" aria-label="行動版主要導覽">
          <a href="#/guides" @click.prevent="navigate('guides')"><span>旅行指南</span><b>01</b></a>
          <a href="#/methodology" @click.prevent="navigate('methodology')"><span>推薦方法</span><b>02</b></a>
          <a href="#/about" @click.prevent="navigate('about')"><span>關於 TRIP SYNC</span><b>03</b></a>
          <a href="#/contact" @click.prevent="navigate('contact')"><span>聯絡與更正</span><b>04</b></a>
          <button class="mobile-quiz-button" type="button" @click="start">開始旅行人格測驗 →</button>
        </nav>
      </Transition>
    </header>
  `,
});
