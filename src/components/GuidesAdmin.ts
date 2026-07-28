import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import GuideArticle from './GuideArticle';
import { guideCategoryLabels, travelGuides } from '../data/guides';
import type { GuideBookingIdea, GuideCategory, GuideImage, GuideSection, TravelGuide } from '../data/guides';

const categories = Object.keys(guideCategoryLabels).filter((key) => key !== 'all') as GuideCategory[];
const providers: GuideBookingIdea['provider'][] = ['Klook', 'KKday', 'Trip.com'];
const today = () => new Date().toISOString().slice(0, 10);
const activeGuideStorageKey = 'trip-sync-admin-active-guide';
type ValidationIssue = { level: 'error' | 'warning'; guideSlug: string; guideTitle: string; message: string };
type ConfirmDialog = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
};
type DeletedParagraph = {
  guideSlug: string;
  sectionId: string;
  sectionTitle: string;
  index: number;
  text: string;
};

const cloneGuide = (guide: TravelGuide) => JSON.parse(JSON.stringify(guide)) as TravelGuide;
const linesToArray = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean);
const arrayToLines = (value?: string[]) => (value ?? []).join('\n');
const eventValue = (event: Event) => (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
const assetUrl = (src: string) => `${import.meta.env.BASE_URL}${src}`;

const slugify = (value: string) => value
  .trim()
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/_+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '') || `guide-${Date.now()}`;

const emptyImage = (): GuideImage => ({ src: '', alt: '', caption: '', layout: 'wide' });
const emptySection = (): GuideSection => ({
  id: `section-${Date.now()}`,
  title: '新的段落',
  paragraphs: [''],
});

const emptyGuide = (): TravelGuide => ({
  status: 'draft',
  slug: `new-guide-${Date.now()}`,
  title: '新的旅行指南',
  kicker: '',
  excerpt: '',
  destination: '',
  category: 'city',
  cover: '',
  coverAlt: '',
  accent: '#7194c3',
  days: '',
  budget: '',
  bestTime: '',
  readingMinutes: 6,
  updatedAt: today(),
  personalityFit: [],
  channelFit: [],
  idealFor: [],
  notFor: [],
  intro: [''],
  sections: [emptySection()],
  itinerary: [],
  checklist: [],
  bookingIdeas: [],
  sources: [],
  related: [],
});

export default defineComponent({
  name: 'GuidesAdmin',
  components: { GuideArticle },
  emits: {
    openGuide: (_slug: string) => true,
    openGuides: () => true,
  },
  setup(_, { emit }) {
    const guides = ref<TravelGuide[]>(travelGuides.map(cloneGuide));
    const activeSlug = ref(guides.value[0]?.slug ?? '');
    const activeGuide = computed(() => guides.value.find((guide) => guide.slug === activeSlug.value) ?? guides.value[0]);
    const selectedTab = ref<'edit' | 'preview' | 'json'>('edit');
    const status = ref('尚未儲存');
    const saving = ref(false);
    const apiAvailable = ref(false);
    const confirmDialog = ref<ConfirmDialog | null>(null);
    const lastDeletedParagraph = ref<DeletedParagraph | null>(null);
    const validationIssues = computed<ValidationIssue[]>(() => {
      const issues: ValidationIssue[] = [];
      const slugCounts = guides.value.reduce<Record<string, number>>((counts, guide) => {
        const slug = guide.slug.trim();
        if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
        return counts;
      }, {});
      const existingSlugs = new Set(guides.value.map((guide) => guide.slug.trim()).filter(Boolean));

      guides.value.forEach((guide) => {
        const guideTitle = guide.title.trim() || '未命名文章';
        const pushIssue = (level: ValidationIssue['level'], message: string) => issues.push({
          level,
          guideSlug: guide.slug,
          guideTitle,
          message,
        });

        if (!guide.slug.trim()) pushIssue('error', 'slug 空白，文章網址會壞掉。');
        if (guide.slug.trim() && slugCounts[guide.slug.trim()] > 1) pushIssue('error', `slug「${guide.slug.trim()}」重複。`);
        if (!guide.title.trim()) pushIssue('error', '標題空白，文章列表無法辨識。');
        if (!guide.cover.trim()) pushIssue('warning', '沒有封面圖；可以儲存，但前台卡片會缺少主要視覺。');
        if (guide.cover.trim() && !guide.coverAlt.trim()) pushIssue('warning', '封面圖沒有替代文字。');

        guide.sections.forEach((section, sectionIndex) => {
          if (!section.id.trim()) pushIssue('warning', `第 ${sectionIndex + 1} 個章節缺少段落 ID，目錄跳轉可能不準。`);
          if (section.image && !section.image.src.trim()) pushIssue('warning', `「${section.title || `章節 ${sectionIndex + 1}`}」已插入圖片，但圖片路徑是空的。`);
          if (section.image?.src.trim() && !section.image.alt.trim()) pushIssue('warning', `「${section.title || `章節 ${sectionIndex + 1}`}」的圖片沒有替代文字。`);
        });

        if (guide.closingImage && !guide.closingImage.src.trim()) pushIssue('warning', '已新增結尾圖片，但圖片路徑是空的。');
        if (guide.closingImage?.src.trim() && !guide.closingImage.alt.trim()) pushIssue('warning', '結尾圖片沒有替代文字。');

        guide.related.forEach((slug) => {
          if (slug.trim() && !existingSlugs.has(slug.trim())) pushIssue('warning', `相關文章 slug「${slug}」找不到對應文章。`);
        });
      });

      return issues;
    });
    const blockingIssues = computed(() => validationIssues.value.filter((issue) => issue.level === 'error'));
    const warningIssues = computed(() => validationIssues.value.filter((issue) => issue.level === 'warning'));

    const loadGuides = async () => {
      try {
        const response = await fetch('/api/admin/guides');
        if (!response.ok) throw new Error('API unavailable');
        guides.value = (await response.json() as TravelGuide[]).map((guide) => ({ ...guide, status: guide.status ?? 'published' }));
        const savedSlug = window.sessionStorage.getItem(activeGuideStorageKey);
        const currentSlug = activeSlug.value;
        activeSlug.value = [savedSlug, currentSlug].find((slug) => slug && guides.value.some((guide) => guide.slug === slug)) ?? guides.value[0]?.slug ?? '';
        apiAvailable.value = true;
        status.value = '已載入 guides.json';
      } catch {
        apiAvailable.value = false;
        status.value = '目前是靜態預覽模式；請用 pnpm dev 開啟後台儲存功能。';
      }
    };

    const saveGuides = async () => {
      if (blockingIssues.value.length) {
        status.value = `有 ${blockingIssues.value.length} 個必修問題，先修正後再儲存。`;
        selectedTab.value = 'edit';
        return;
      }
      const selectedSlugBeforeSave = activeGuide.value?.slug ?? activeSlug.value;
      window.sessionStorage.setItem(activeGuideStorageKey, selectedSlugBeforeSave);
      saving.value = true;
      try {
        guides.value = guides.value.map((guide) => ({
          ...guide,
          status: guide.status ?? 'published',
          updatedAt: guide.updatedAt || today(),
          sections: guide.sections.map((section) => ({
            ...section,
            paragraphs: section.paragraphs.filter((paragraph) => paragraph.trim()),
            bullets: section.bullets?.filter((bullet) => bullet.trim()),
          })),
        }));

        const response = await fetch('/api/admin/guides', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guides.value),
        });
        if (!response.ok) throw new Error(await response.text());
        if (guides.value.some((guide) => guide.slug === selectedSlugBeforeSave)) {
          activeSlug.value = selectedSlugBeforeSave;
          window.sessionStorage.setItem(activeGuideStorageKey, selectedSlugBeforeSave);
        }
        status.value = `已儲存 ${guides.value.length} 篇文章到 guides.json`;
        apiAvailable.value = true;
      } catch (error) {
        status.value = error instanceof Error ? `儲存失敗：${error.message}` : '儲存失敗';
      } finally {
        saving.value = false;
      }
    };

    const addGuide = () => {
      const guide = emptyGuide();
      guides.value.unshift(guide);
      activeSlug.value = guide.slug;
      selectedTab.value = 'edit';
      status.value = '已新增文章，記得儲存。';
    };

    const duplicateGuide = () => {
      if (!activeGuide.value) return;
      const guide = cloneGuide(activeGuide.value);
      guide.slug = `${guide.slug}-copy-${Date.now()}`;
      guide.title = `${guide.title} 複本`;
      guide.status = 'draft';
      guide.updatedAt = today();
      guides.value.unshift(guide);
      activeSlug.value = guide.slug;
      status.value = '已複製文章，記得儲存。';
    };

    const closeConfirmDialog = () => {
      confirmDialog.value = null;
    };

    const confirmDangerAction = () => {
      confirmDialog.value?.onConfirm();
      closeConfirmDialog();
    };

    const requestDangerAction = (dialog: ConfirmDialog) => {
      confirmDialog.value = dialog;
    };

    const deleteGuide = () => {
      const guide = activeGuide.value;
      if (!guide) return;
      requestDangerAction({
        title: '刪除整篇文章？',
        message: `「${guide.title || '未命名文章'}」會從後台文章列表移除。這個動作在按下「儲存全部」後才會寫入 guides.json。`,
        confirmText: '刪除文章',
        cancelText: '先不要',
        onConfirm: () => {
          guides.value = guides.value.filter((item) => item.slug !== guide.slug);
          activeSlug.value = guides.value[0]?.slug ?? '';
          status.value = '已刪除文章，記得儲存全部。';
        },
      });
    };

    const updateSlugFromTitle = () => {
      if (!activeGuide.value) return;
      const currentSlug = activeGuide.value.slug.trim();
      if (currentSlug && !currentSlug.startsWith('new-guide-')) return;
      const nextSlug = slugify(activeGuide.value.title);
      if (!guides.value.some((guide) => guide.slug === nextSlug && guide !== activeGuide.value)) {
        activeGuide.value.slug = nextSlug;
        activeSlug.value = nextSlug;
      }
    };

    const updateLines = (key: keyof TravelGuide, value: string) => {
      if (!activeGuide.value) return;
      (activeGuide.value as unknown as Record<string, string[]>)[key as string] = linesToArray(value);
    };

    const moveGuide = (from: number, direction: -1 | 1) => {
      const to = from + direction;
      if (to < 0 || to >= guides.value.length) return;
      const copy = [...guides.value];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      guides.value = copy;
    };

    const addSection = () => activeGuide.value?.sections.push(emptySection());
    const removeSection = (index: number) => {
      const section = activeGuide.value?.sections[index];
      if (!activeGuide.value || !section) return;
      requestDangerAction({
        title: '刪除整個章節？',
        message: `「${section.title || `章節 ${index + 1}`}」和裡面的 ${section.paragraphs.length} 個段落都會被移除。`,
        confirmText: '刪除章節',
        cancelText: '先不要',
        onConfirm: () => {
          activeGuide.value?.sections.splice(index, 1);
          status.value = '已刪除章節，記得儲存全部。';
        },
      });
    };
    const moveSection = (index: number, direction: -1 | 1) => {
      if (!activeGuide.value) return;
      const to = index + direction;
      if (to < 0 || to >= activeGuide.value.sections.length) return;
      const [section] = activeGuide.value.sections.splice(index, 1);
      activeGuide.value.sections.splice(to, 0, section);
    };

    const addParagraph = (section: GuideSection) => section.paragraphs.push('');
    const requestRemoveParagraph = (section: GuideSection, index: number) => {
      const preview = section.paragraphs[index]?.trim();
      requestDangerAction({
        title: '移除此段？',
        message: preview ? `這段文字會從「${section.title || '未命名章節'}」移除：${preview.slice(0, 42)}${preview.length > 42 ? '...' : ''}` : '這個空白段落會被移除。',
        confirmText: '移除此段',
        cancelText: '先不要',
        onConfirm: () => {
          const [text] = section.paragraphs.splice(index, 1);
          lastDeletedParagraph.value = {
            guideSlug: activeGuide.value?.slug ?? '',
            sectionId: section.id,
            sectionTitle: section.title || '未命名章節',
            index,
            text,
          };
          status.value = '已移除段落，可按「復原段落」救回來；確認沒問題再儲存全部。';
        },
      });
    };

    const restoreDeletedParagraph = () => {
      const deleted = lastDeletedParagraph.value;
      if (!deleted) return;
      const guide = guides.value.find((item) => item.slug === deleted.guideSlug);
      const section = guide?.sections.find((item) => item.id === deleted.sectionId);
      if (!guide || !section) {
        status.value = '找不到原本的文章或章節，無法復原段落。';
        return;
      }
      section.paragraphs.splice(Math.min(deleted.index, section.paragraphs.length), 0, deleted.text);
      activeSlug.value = guide.slug;
      selectedTab.value = 'edit';
      status.value = `已復原「${deleted.sectionTitle}」裡的段落，記得儲存全部。`;
      lastDeletedParagraph.value = null;
    };
    const updateSectionBullets = (section: GuideSection, value: string) => {
      section.bullets = linesToArray(value);
      if (!section.bullets.length) delete section.bullets;
    };

    const ensureSectionImage = (section: GuideSection) => {
      section.image = section.image ?? emptyImage();
      section.imageAfterParagraph = section.imageAfterParagraph ?? Math.max(0, section.paragraphs.length - 1);
    };

    const removeSectionImage = (section: GuideSection) => {
      requestDangerAction({
        title: '移除段落圖片？',
        message: `「${section.title || '未命名章節'}」裡的圖片設定會被移除，但圖片檔案本身不會從資料夾刪掉。`,
        confirmText: '移除圖片',
        cancelText: '先不要',
        onConfirm: () => {
          delete section.image;
          delete section.imageAfterParagraph;
          status.value = '已移除段落圖片設定，記得儲存全部。';
        },
      });
    };

    const addItinerary = () => activeGuide.value?.itinerary.push({ day: 'DAY 1', title: '', detail: '' });
    const addBookingIdea = () => activeGuide.value?.bookingIdeas.push({ provider: 'Klook', title: '', description: '', href: 'https://www.klook.com/' });
    const addSource = () => activeGuide.value?.sources.push({ label: '', url: '', note: '' });
    const removeItinerary = (index: number) => {
      const item = activeGuide.value?.itinerary[index];
      if (!activeGuide.value || !item) return;
      requestDangerAction({
        title: '刪除這天行程？',
        message: `${item.day || `第 ${index + 1} 天`}「${item.title || '未命名行程'}」會被移除。`,
        confirmText: '刪除行程',
        cancelText: '先不要',
        onConfirm: () => {
          activeGuide.value?.itinerary.splice(index, 1);
          status.value = '已刪除行程，記得儲存全部。';
        },
      });
    };
    const removeBookingIdea = (index: number) => {
      const item = activeGuide.value?.bookingIdeas[index];
      if (!activeGuide.value || !item) return;
      requestDangerAction({
        title: '刪除預訂項目？',
        message: `「${item.title || item.provider}」會從可預訂項目移除。`,
        confirmText: '刪除項目',
        cancelText: '先不要',
        onConfirm: () => {
          activeGuide.value?.bookingIdeas.splice(index, 1);
          status.value = '已刪除預訂項目，記得儲存全部。';
        },
      });
    };
    const removeSource = (index: number) => {
      const source = activeGuide.value?.sources[index];
      if (!activeGuide.value || !source) return;
      requestDangerAction({
        title: '刪除官方來源？',
        message: `「${source.label || source.url || `來源 ${index + 1}`}」會從資料來源列表移除。`,
        confirmText: '刪除來源',
        cancelText: '先不要',
        onConfirm: () => {
          activeGuide.value?.sources.splice(index, 1);
          status.value = '已刪除官方來源，記得儲存全部。';
        },
      });
    };
    const removeClosingImage = () => {
      if (!activeGuide.value?.closingImage) return;
      requestDangerAction({
        title: '移除結尾圖片？',
        message: '結尾圖片設定會被移除，但圖片檔案本身不會從資料夾刪掉。',
        confirmText: '移除圖片',
        cancelText: '先不要',
        onConfirm: () => {
          if (activeGuide.value) delete activeGuide.value.closingImage;
          status.value = '已移除結尾圖片設定，記得儲存全部。';
        },
      });
    };

    const uploadImage = async (event: Event, target: { src: string }, folder: 'guide-covers' | 'guide-images') => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      try {
        const response = await fetch('/api/admin/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, fileName: file.name, folder }),
        });
        if (!response.ok) throw new Error(await response.text());
        const payload = await response.json() as { src: string };
        target.src = payload.src;
        status.value = `已上傳圖片：${payload.src}`;
      } catch (error) {
        status.value = error instanceof Error ? `圖片上傳失敗：${error.message}` : '圖片上傳失敗';
      }
    };

    const downloadJson = () => {
      const blob = new Blob([`${JSON.stringify(guides.value, null, 2)}\n`], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'guides.json';
      anchor.click();
      URL.revokeObjectURL(url);
    };

    onMounted(loadGuides);
    watch(activeSlug, (slug) => {
      if (slug) window.sessionStorage.setItem(activeGuideStorageKey, slug);
    });

    return {
      activeGuide,
      activeSlug,
      addBookingIdea,
      addGuide,
      addItinerary,
      addParagraph,
      addSection,
      addSource,
      apiAvailable,
      arrayToLines,
      assetUrl,
      blockingIssues,
      categories,
      closeConfirmDialog,
      confirmDangerAction,
      confirmDialog,
      deleteGuide,
      downloadJson,
      duplicateGuide,
      emit,
      ensureSectionImage,
      eventValue,
      guideCategoryLabels,
      guides,
      lastDeletedParagraph,
      moveGuide,
      moveSection,
      providers,
      requestRemoveParagraph,
      removeBookingIdea,
      removeClosingImage,
      removeItinerary,
      removeSection,
      removeSectionImage,
      removeSource,
      restoreDeletedParagraph,
      saveGuides,
      saving,
      selectedTab,
      status,
      updateLines,
      updateSectionBullets,
      updateSlugFromTitle,
      uploadImage,
      validationIssues,
      warningIssues,
    };
  },
  template: `
    <main class="admin-shell" v-if="activeGuide">
      <header class="admin-topbar">
        <div>
          <p class="eyebrow">TRIP SYNC CMS</p>
          <h1>旅行指南後台</h1>
          <p>{{ status }}</p>
        </div>
        <div class="admin-actions">
          <a href="#/guides" @click.prevent="$emit('openGuides')">回指南</a>
          <button v-if="lastDeletedParagraph" type="button" @click="restoreDeletedParagraph">復原段落</button>
          <button type="button" @click="downloadJson">下載 JSON</button>
          <button class="primary-button coral" type="button" :disabled="saving" @click="saveGuides">
            {{ saving ? '儲存中' : blockingIssues.length ? '修正後儲存' : '儲存全部' }}
          </button>
        </div>
      </header>

      <div class="admin-floating-actions" aria-label="後台快速操作">
        <span>{{ blockingIssues.length ? blockingIssues.length + ' 個必修問題' : warningIssues.length ? warningIssues.length + ' 個提醒' : '內容可儲存' }}</span>
        <button v-if="lastDeletedParagraph" type="button" @click="restoreDeletedParagraph">復原段落</button>
        <button class="primary-button coral" type="button" :disabled="saving" @click="saveGuides">
          {{ saving ? '儲存中' : blockingIssues.length ? '修正後儲存' : '儲存全部' }}
        </button>
      </div>

      <section v-if="!apiAvailable" class="admin-alert">
        後台儲存需要用 <b>pnpm dev</b> 開啟。靜態網站仍可預覽與下載 JSON，但不能直接寫回專案檔案。
      </section>

      <section v-if="validationIssues.length" class="admin-validation">
        <div>
          <b>{{ blockingIssues.length ? '需要先修正' : '儲存前提醒' }}</b>
          <span>{{ blockingIssues.length }} 個必修問題，{{ warningIssues.length }} 個提醒</span>
        </div>
        <ul>
          <li v-for="issue in validationIssues.slice(0, 8)" :key="issue.guideSlug + issue.message" :class="'is-' + issue.level">
            <button type="button" @click="activeSlug = issue.guideSlug; selectedTab = 'edit'">{{ issue.guideTitle }}</button>
            <span>{{ issue.message }}</span>
          </li>
        </ul>
      </section>

      <div class="admin-layout">
        <aside class="admin-sidebar">
          <button class="admin-new" type="button" @click="addGuide">新增文章</button>
          <article v-for="(guide, index) in guides" :key="guide.slug" :class="{ active: guide.slug === activeSlug }">
            <button type="button" @click="activeSlug = guide.slug">
              <small>{{ guide.destination || '未填目的地' }}</small>
              <b>{{ guide.title }}</b>
              <span><em :class="'admin-status is-' + (guide.status ?? 'published')">{{ (guide.status ?? 'published') === 'draft' ? '草稿' : '已發布' }}</em>{{ guideCategoryLabels[guide.category] }} / {{ guide.updatedAt }}</span>
            </button>
            <div>
              <button type="button" title="上移" @click="moveGuide(index, -1)">↑</button>
              <button type="button" title="下移" @click="moveGuide(index, 1)">↓</button>
            </div>
          </article>
        </aside>

        <section class="admin-workspace">
          <nav class="admin-tabs">
            <button type="button" :class="{ active: selectedTab === 'edit' }" @click="selectedTab = 'edit'">編輯</button>
            <button type="button" :class="{ active: selectedTab === 'preview' }" @click="selectedTab = 'preview'">預覽</button>
            <button type="button" :class="{ active: selectedTab === 'json' }" @click="selectedTab = 'json'">JSON</button>
          </nav>

          <div v-if="selectedTab === 'edit'" class="admin-editor">
            <section class="admin-panel">
              <div class="admin-panel-heading">
                <h2>基本資料</h2>
                <div>
                  <button type="button" @click="duplicateGuide">複製</button>
                  <button type="button" class="danger" @click="deleteGuide">刪除</button>
                </div>
              </div>
              <div class="admin-grid">
                <label>標題<input v-model="activeGuide.title" @blur="updateSlugFromTitle" /></label>
                <label>網址 slug<input v-model="activeGuide.slug" /></label>
                <label>副標<input v-model="activeGuide.kicker" /></label>
                <label>目的地<input v-model="activeGuide.destination" /></label>
                <label>分類<select v-model="activeGuide.category"><option v-for="category in categories" :key="category" :value="category">{{ guideCategoryLabels[category] }}</option></select></label>
                <label>發布狀態<select v-model="activeGuide.status"><option value="published">已發布，前台可見</option><option value="draft">草稿，前台隱藏</option></select></label>
                <label>主色<input v-model="activeGuide.accent" type="color" /></label>
                <label>天數<input v-model="activeGuide.days" /></label>
                <label>預算<input v-model="activeGuide.budget" /></label>
                <label>季節<input v-model="activeGuide.bestTime" /></label>
                <label>閱讀分鐘<input v-model.number="activeGuide.readingMinutes" type="number" min="1" /></label>
                <label>更新日期<input v-model="activeGuide.updatedAt" type="date" /></label>
              </div>
              <label>摘要<textarea v-model="activeGuide.excerpt" rows="3"></textarea></label>
            </section>

            <section class="admin-panel">
              <div class="admin-panel-heading"><h2>封面圖片</h2></div>
              <div class="admin-image-row">
                <img v-if="activeGuide.cover" :src="assetUrl(activeGuide.cover)" :alt="activeGuide.coverAlt" />
                <div>
                  <label>圖片路徑<input v-model="activeGuide.cover" placeholder="guide-covers/example.jpg" /></label>
                  <label>替代文字<input v-model="activeGuide.coverAlt" /></label>
                  <input type="file" accept="image/*" @change="uploadImage($event, activeGuide, 'guide-covers')" />
                </div>
              </div>
            </section>

            <section class="admin-panel">
              <div class="admin-panel-heading"><h2>適合對象與標籤</h2></div>
              <div class="admin-grid">
                <label>人格適合，一行一個<textarea :value="arrayToLines(activeGuide.personalityFit)" rows="4" @input="updateLines('personalityFit', eventValue($event))"></textarea></label>
                <label>任務頻道，一行一個<textarea :value="arrayToLines(activeGuide.channelFit)" rows="4" @input="updateLines('channelFit', eventValue($event))"></textarea></label>
                <label>適合你，如果<textarea :value="arrayToLines(activeGuide.idealFor)" rows="4" @input="updateLines('idealFor', eventValue($event))"></textarea></label>
                <label>不適合，如果<textarea :value="arrayToLines(activeGuide.notFor)" rows="4" @input="updateLines('notFor', eventValue($event))"></textarea></label>
                <label>開頭段落，一行一段<textarea :value="arrayToLines(activeGuide.intro)" rows="5" @input="updateLines('intro', eventValue($event))"></textarea></label>
                <label>相關文章 slug，一行一個<textarea :value="arrayToLines(activeGuide.related)" rows="5" @input="updateLines('related', eventValue($event))"></textarea></label>
              </div>
            </section>

            <section class="admin-panel">
              <div class="admin-panel-heading"><h2>正文段落</h2><button type="button" @click="addSection">新增章節</button></div>
              <article v-for="(section, sectionIndex) in activeGuide.sections" :key="section.id" class="admin-section-editor">
                <div class="admin-section-toolbar">
                  <b>章節 {{ sectionIndex + 1 }}</b>
                  <span>
                    <button type="button" @click="moveSection(sectionIndex, -1)">上移</button>
                    <button type="button" @click="moveSection(sectionIndex, 1)">下移</button>
                    <button type="button" class="danger" @click="removeSection(sectionIndex)">刪除</button>
                  </span>
                </div>
                <div class="admin-grid">
                  <label>段落 ID<input v-model="section.id" /></label>
                  <label>標題<input v-model="section.title" /></label>
                </div>
                <div class="admin-paragraphs">
                  <label v-for="(paragraph, paragraphIndex) in section.paragraphs" :key="paragraphIndex">
                    段落 {{ paragraphIndex + 1 }}
                    <textarea v-model="section.paragraphs[paragraphIndex]" rows="4"></textarea>
                    <button type="button" class="danger" @click="requestRemoveParagraph(section, paragraphIndex)">移除此段</button>
                  </label>
                  <button type="button" @click="addParagraph(section)">新增段落</button>
                </div>
                <label>項目清單，一行一個<textarea :value="arrayToLines(section.bullets)" rows="4" @input="updateSectionBullets(section, eventValue($event))"></textarea></label>
                <label>實地經驗 / 提醒<textarea v-model="section.callout" rows="3"></textarea></label>
                <div class="admin-section-image">
                  <button v-if="!section.image" type="button" @click="ensureSectionImage(section)">插入圖片</button>
                  <div v-else>
                    <div class="admin-image-row">
                      <img v-if="section.image.src" :src="assetUrl(section.image.src)" :alt="section.image.alt" />
                      <div>
                        <label>圖片路徑<input v-model="section.image.src" /></label>
                        <label>替代文字<input v-model="section.image.alt" /></label>
                        <label>圖說<input v-model="section.image.caption" /></label>
                        <label>位置<select v-model.number="section.imageAfterParagraph"><option v-for="(_, index) in section.paragraphs" :key="index" :value="index">第 {{ index + 1 }} 段後</option></select></label>
                        <label>版型<select v-model="section.image.layout"><option value="wide">寬圖</option><option value="portrait">直圖</option></select></label>
                        <input type="file" accept="image/*" @change="uploadImage($event, section.image, 'guide-images')" />
                        <button type="button" class="danger" @click="removeSectionImage(section)">移除圖片</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section class="admin-panel">
              <div class="admin-panel-heading"><h2>建議行程</h2><button type="button" @click="addItinerary">新增</button></div>
              <article v-for="(item, index) in activeGuide.itinerary" :key="index" class="admin-repeat-row">
                <input v-model="item.day" placeholder="DAY 1" />
                <input v-model="item.title" placeholder="標題" />
                <textarea v-model="item.detail" rows="2" placeholder="細節"></textarea>
                <button type="button" class="danger" @click="removeItinerary(index)">刪除</button>
              </article>
            </section>

            <section class="admin-panel">
              <div class="admin-panel-heading"><h2>預訂檢查</h2></div>
              <label>一行一個<textarea :value="arrayToLines(activeGuide.checklist)" rows="5" @input="updateLines('checklist', eventValue($event))"></textarea></label>
            </section>

            <section class="admin-panel">
              <div class="admin-panel-heading"><h2>可預訂項目</h2><button type="button" @click="addBookingIdea">新增</button></div>
              <article v-for="(item, index) in activeGuide.bookingIdeas" :key="index" class="admin-repeat-row">
                <select v-model="item.provider"><option v-for="provider in providers" :key="provider" :value="provider">{{ provider }}</option></select>
                <input v-model="item.title" placeholder="標題" />
                <input v-model="item.href" placeholder="連結" />
                <textarea v-model="item.description" rows="2" placeholder="描述"></textarea>
                <button type="button" class="danger" @click="removeBookingIdea(index)">刪除</button>
              </article>
            </section>

            <section class="admin-panel">
              <div class="admin-panel-heading"><h2>官方來源</h2><button type="button" @click="addSource">新增</button></div>
              <article v-for="(source, index) in activeGuide.sources" :key="index" class="admin-repeat-row">
                <input v-model="source.label" placeholder="來源名稱" />
                <input v-model="source.url" placeholder="URL" />
                <textarea v-model="source.note" rows="2" placeholder="用途備註"></textarea>
                <button type="button" class="danger" @click="removeSource(index)">刪除</button>
              </article>
            </section>

            <section class="admin-panel">
              <div class="admin-panel-heading">
                <h2>結尾圖片</h2>
                <button v-if="!activeGuide.closingImage" type="button" @click="activeGuide.closingImage = { src: '', alt: '', caption: '', layout: 'wide' }">新增</button>
                <button v-else type="button" class="danger" @click="removeClosingImage">移除</button>
              </div>
              <div v-if="activeGuide.closingImage" class="admin-image-row">
                <img v-if="activeGuide.closingImage.src" :src="assetUrl(activeGuide.closingImage.src)" :alt="activeGuide.closingImage.alt" />
                <div>
                  <label>圖片路徑<input v-model="activeGuide.closingImage.src" /></label>
                  <label>替代文字<input v-model="activeGuide.closingImage.alt" /></label>
                  <label>圖說<input v-model="activeGuide.closingImage.caption" /></label>
                  <label>版型<select v-model="activeGuide.closingImage.layout"><option value="wide">寬圖</option><option value="portrait">直圖</option></select></label>
                  <input type="file" accept="image/*" @change="uploadImage($event, activeGuide.closingImage, 'guide-images')" />
                </div>
              </div>
            </section>
          </div>

          <div v-else-if="selectedTab === 'preview'" class="admin-preview">
            <GuideArticle :guide="activeGuide" :guides="guides" @open-guide="activeSlug = $event" @open-guides="selectedTab = 'edit'" @start-quiz="selectedTab = 'edit'" />
          </div>

          <pre v-else class="admin-json">{{ JSON.stringify(activeGuide, null, 2) }}</pre>
        </section>
      </div>

      <div v-if="confirmDialog" class="admin-swal-backdrop" role="presentation" @click.self="closeConfirmDialog">
        <section class="admin-swal" role="alertdialog" aria-modal="true" :aria-label="confirmDialog.title">
          <div class="admin-swal-icon">!</div>
          <h2>{{ confirmDialog.title }}</h2>
          <p>{{ confirmDialog.message }}</p>
          <div>
            <button type="button" @click="closeConfirmDialog">{{ confirmDialog.cancelText }}</button>
            <button type="button" class="danger" @click="confirmDangerAction">{{ confirmDialog.confirmText }}</button>
          </div>
        </section>
      </div>
    </main>
  `,
});
