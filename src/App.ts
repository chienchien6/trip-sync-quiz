import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import GlobalPlanner from './components/GlobalPlanner';
import GuideArticle from './components/GuideArticle';
import GuidesAdmin from './components/GuidesAdmin';
import GuidesIndex from './components/GuidesIndex';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';
import TrustPage from './components/TrustPage';
import {
  archetypes,
  avoidOptions,
  budgetOptions,
  channels,
  compatibilityProfiles,
  companionOptions,
  paceOptions,
  questions,
} from './data/tripSync';
import { sitePageIds, sitePages } from './data/sitePages';
import { guideBySlug, publishedTravelGuides } from './data/guides';
import type { Archetype, ChannelId, Choice, TravelSettingOption } from './types';
import type { SitePageId } from './data/sitePages';
import type { TravelGuide } from './data/guides';

type Step = 'landing' | 'quiz' | 'channels' | 'settings' | 'result';
type SiteRoute = SitePageId | 'home' | 'guides' | 'guide' | 'admin';

export default defineComponent({
  name: 'App',
  components: { GlobalPlanner, GuideArticle, GuidesAdmin, GuidesIndex, SiteFooter, SiteHeader, TrustPage },
  setup() {
    const step = ref<Step>('landing');
    const routeFromHash = (): { page: SiteRoute; guideSlug: string } => {
      const route = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).replace(/\/$/, '');
      if (!route || route === 'home') return { page: 'home', guideSlug: '' };
      if (route === 'admin') return { page: 'admin', guideSlug: '' };
      if (route === 'guides') return { page: 'guides', guideSlug: '' };
      if (route.startsWith('guides/')) {
        const guideSlug = route.slice('guides/'.length);
        return guideBySlug(guideSlug) ? { page: 'guide', guideSlug } : { page: 'not-found', guideSlug: '' };
      }
      return sitePageIds.includes(route as SitePageId)
        ? { page: route as SitePageId, guideSlug: '' }
        : { page: 'not-found', guideSlug: '' };
    };
    const initialRoute = routeFromHash();
    const sitePage = ref<SiteRoute>(initialRoute.page);
    const activeGuideSlug = ref(initialRoute.guideSlug);
    const activeGuide = computed(() => guideBySlug(activeGuideSlug.value));
    const activeSitePage = computed(() => sitePage.value === 'home' || sitePage.value === 'guides' || sitePage.value === 'guide' || sitePage.value === 'admin'
      ? sitePages.about
      : sitePages[sitePage.value]);
    const currentQuestionIndex = ref(0);
    const answers = ref<Record<number, string>>({});
    const selectedChannelIds = ref<ChannelId[]>([]);
    const pace = ref('flex');
    const companion = ref('pair');
    const budget = ref('balanced');
    const avoids = ref<string[]>([]);
    const toast = ref('');
    const shareCardOpen = ref(false);
    const shareCardBusy = ref(false);
    const shareCardUrl = ref('');
    const shareCardBlob = ref<Blob | null>(null);
    const explorerImageUrl = `${import.meta.env.BASE_URL}characters/explorers.png`;

    const updateDocumentMetadata = () => {
      const page = sitePage.value !== 'home' && sitePage.value !== 'guides' && sitePage.value !== 'guide' && sitePage.value !== 'admin'
        ? sitePages[sitePage.value]
        : null;
      const guide = sitePage.value === 'guide' ? activeGuide.value : null;
      const title = sitePage.value === 'admin'
        ? '旅行指南後台｜TRIP SYNC'
        : guide
        ? `${guide.title}｜TRIP SYNC 旅行指南`
        : sitePage.value === 'guides'
          ? '旅行指南｜TRIP SYNC'
          : page
            ? `${page.title}｜TRIP SYNC`
            : 'TRIP SYNC｜旅遊人格測驗與行程規劃助手';
      const description = guide?.excerpt
        ?? (sitePage.value === 'guides' ? 'TRIP SYNC 旅行指南：從人格、預算、交通與避雷條件，把目的地走成真正可執行的行程。' : page?.description)
        ?? 'TRIP SYNC 地球探索人格測驗與全球行程規劃助手，依人格、興趣、月份、預算及避雷條件推薦目的地。';
      const image = guide
        ? new URL(`${import.meta.env.BASE_URL}${guide.cover}`, window.location.origin).href
        : new URL(`${import.meta.env.BASE_URL}characters/explorers.png`, window.location.origin).href;
      const setMeta = (selector: string, content: string) => document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content);

      document.title = title;
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:title"]', title);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[property="og:type"]', guide ? 'article' : 'website');
      setMeta('meta[property="og:url"]', window.location.href);
      setMeta('meta[property="og:image"]', image);
      setMeta('meta[property="og:image:alt"]', guide?.coverAlt ?? 'TRIP SYNC 四位地球探索人格角色');
      setMeta('meta[name="twitter:title"]', title);
      setMeta('meta[name="twitter:description"]', description);
      setMeta('meta[name="twitter:image"]', image);

      const existingStructuredData = document.querySelector<HTMLScriptElement>('#page-structured-data');
      if (!guide) {
        existingStructuredData?.remove();
        return;
      }
      const structuredData = existingStructuredData ?? document.createElement('script');
      structuredData.id = 'page-structured-data';
      structuredData.type = 'application/ld+json';
      structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: guide.title,
        description: guide.excerpt,
        image,
        dateModified: guide.updatedAt,
        inLanguage: 'zh-Hant',
        author: { '@type': 'Person', name: 'Chien-Chien' },
        publisher: { '@type': 'Organization', name: 'TRIP SYNC' },
        mainEntityOfPage: window.location.href,
      });
      if (!existingStructuredData) document.head.appendChild(structuredData);
    };

    const syncSiteRoute = () => {
      const route = routeFromHash();
      sitePage.value = route.page;
      activeGuideSlug.value = route.guideSlug;
      if (sitePage.value !== 'home') step.value = 'landing';
      updateDocumentMetadata();
      nextTick(() => window.scrollTo({ top: 0 }));
    };

    const navigateToSitePage = (page: SitePageId | 'home' | 'guides') => {
      if (page === 'home') step.value = 'landing';
      const nextHash = page === 'home' ? '#/' : `#/${page}`;
      if (window.location.hash === nextHash) {
        sitePage.value = page;
        updateDocumentMetadata();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      window.location.hash = nextHash;
    };

    const navigateToGuide = (slug: string) => {
      const guide = guideBySlug(slug);
      if (!guide) {
        navigateToSitePage('not-found');
        return;
      }
      window.location.hash = `#/guides/${guide.slug}`;
    };

    onMounted(() => {
      updateDocumentMetadata();
      window.addEventListener('hashchange', syncSiteRoute);
    });

    onBeforeUnmount(() => window.removeEventListener('hashchange', syncSiteRoute));

    const currentQuestion = computed(() => questions[currentQuestionIndex.value]);
    const currentAnswer = computed(() => answers.value[currentQuestion.value.id]);
    const explorationScore = computed(() => {
      const weightedTotal = questions.reduce((total, question) => {
        const selected = question.choices.find((choice) => choice.id === answers.value[question.id]);
        return total + (selected?.explorationScore ?? 0) * question.scoreWeight;
      }, 0);
      const weightedMaximum = questions.reduce((total, question) => {
        const maximum = Math.max(...question.choices.map((choice) => choice.explorationScore));
        return total + maximum * question.scoreWeight;
      }, 0);
      return weightedMaximum ? Math.round((weightedTotal / weightedMaximum) * 12) : 0;
    });
    const archetype = computed(() => archetypes.find((item) => explorationScore.value >= item.min && explorationScore.value <= item.max) ?? archetypes[0]);
    const compatibility = computed(() => compatibilityProfiles.find((item) => item.archetypeId === archetype.value.id) ?? compatibilityProfiles[0]);
    const bestMatch = computed(() => archetypes.find((item) => item.id === compatibility.value.bestMatchId) ?? archetypes[0]);
    const frictionMatch = computed(() => archetypes.find((item) => item.id === compatibility.value.frictionMatchId) ?? archetypes[3]);
    const selectedChannels = computed(() => selectedChannelIds.value.map((id) => channels.find((channel) => channel.id === id)).filter(Boolean) as typeof channels);

    const progress = computed(() => {
      if (step.value === 'landing') return 0;
      if (step.value === 'quiz') return Math.round(((currentQuestionIndex.value + (currentAnswer.value ? 1 : 0)) / (questions.length + 2)) * 100);
      if (step.value === 'channels') return selectedChannelIds.value.length ? 89 : 78;
      return 100;
    });

    const socialProfiles = {
      'q4-a': { label: '人群點火型', description: '新的互動與共同體驗，通常能替你的旅程補充能量。' },
      'q4-b': { label: '小隊共振型', description: '你偏好少量而有品質的陪伴，分享與安靜都要剛剛好。' },
      'q4-c': { label: '獨處充電型', description: '保留不必配合別人的時間，能讓你重新找回旅行節奏。' },
    } as const;
    const coordinationProfiles = {
      'q6-a': { label: '一起重排型', description: '你傾向透過討論重新組合需求，讓同行者都保留重要體驗。' },
      'q6-b': { label: '分頭探索型', description: '你尊重彼此的旅行自主權，不需要每段行程都綁在一起。' },
      'q6-c': { label: '主線守航型', description: '你重視共同承諾，傾向先完成原本安排，再處理臨時願望。' },
    } as const;
    const socialProfile = computed(() => socialProfiles[answers.value[4] as keyof typeof socialProfiles] ?? socialProfiles['q4-b']);
    const coordinationProfile = computed(() => coordinationProfiles[answers.value[6] as keyof typeof coordinationProfiles] ?? coordinationProfiles['q6-a']);

    const phaseLabel = computed(() => {
      if (step.value === 'quiz') return `人格校準 ${currentQuestionIndex.value + 1} / ${questions.length}`;
      if (step.value === 'channels') return '本次任務頻道';
      if (step.value === 'settings') return '飛行條件設定';
      return '探索報告';
    });

    const settingLabel = (options: TravelSettingOption[], id: string) => options.find((item) => item.id === id)?.label ?? '';
    const avoidLabels = computed(() => avoids.value.map((id) => avoidOptions.find((item) => item.id === id)?.label).filter(Boolean));

    const showToast = (message: string) => {
      toast.value = message;
      window.setTimeout(() => { toast.value = ''; }, 2200);
    };

    const startQuiz = () => {
      sitePage.value = 'home';
      if (window.location.hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      updateDocumentMetadata();
      answers.value = {};
      currentQuestionIndex.value = 0;
      selectedChannelIds.value = [];
      pace.value = 'flex';
      companion.value = 'pair';
      budget.value = 'balanced';
      avoids.value = [];
      step.value = 'quiz';
      window.scrollTo({ top: 0 });
    };

    const selectAnswer = (choice: Choice) => {
      answers.value = { ...answers.value, [currentQuestion.value.id]: choice.id };
    };

    const nextQuestion = () => {
      if (!currentAnswer.value) return;
      if (currentQuestionIndex.value < questions.length - 1) currentQuestionIndex.value += 1;
      else step.value = 'channels';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => {
      if (step.value === 'quiz' && currentQuestionIndex.value > 0) currentQuestionIndex.value -= 1;
      else if (step.value === 'quiz') step.value = 'landing';
      else if (step.value === 'channels') {
        step.value = 'quiz';
        currentQuestionIndex.value = questions.length - 1;
      } else if (step.value === 'settings') step.value = 'channels';
      window.scrollTo({ top: 0 });
    };

    const toggleChannel = (id: ChannelId) => {
      if (selectedChannelIds.value.includes(id)) {
        selectedChannelIds.value = selectedChannelIds.value.filter((item) => item !== id);
        return;
      }
      if (selectedChannelIds.value.length >= 3) {
        showToast('最多選擇 3 個本次任務頻道');
        return;
      }
      selectedChannelIds.value = [...selectedChannelIds.value, id];
    };

    const toggleAvoid = (id: string) => {
      avoids.value = avoids.value.includes(id) ? avoids.value.filter((item) => item !== id) : [...avoids.value, id];
    };

    const finishChannels = () => {
      if (!selectedChannelIds.value.length) return;
      step.value = 'settings';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const finishQuiz = () => {
      step.value = 'result';
      nextTick(() => window.scrollTo({ top: 0 }));
    };

    const scrollToRecommendations = () => document.querySelector('#global-planner')?.scrollIntoView({ behavior: 'smooth' });

    const shareText = computed(() => {
      const frequencies = selectedChannels.value.map((channel) => channel.title.replace('頻道', '')).join(' × ');
      return `我的地球探索人格是「${archetype.value.label}・${archetype.value.cosmicTitle}」！本次任務主頻：${frequencies}。最合拍旅伴是${bestMatch.value.label}，最容易和${frictionMatch.value.label}不同步。`;
    });

    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load ${src}`));
      image.src = src;
    });

    const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
      const safeRadius = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + safeRadius, y);
      context.arcTo(x + width, y, x + width, y + height, safeRadius);
      context.arcTo(x + width, y + height, x, y + height, safeRadius);
      context.arcTo(x, y + height, x, y, safeRadius);
      context.arcTo(x, y, x + width, y, safeRadius);
      context.closePath();
    };

    const fillRoundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) => {
      roundedRect(context, x, y, width, height, radius);
      context.fillStyle = fill;
      context.fill();
    };

    const drawWrappedText = (
      context: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
      maxLines = 2,
    ) => {
      const lines: string[] = [];
      let line = '';
      for (const character of Array.from(text)) {
        const testLine = line + character;
        if (context.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = character;
          if (lines.length === maxLines) break;
        } else {
          line = testLine;
        }
      }
      if (lines.length < maxLines && line) lines.push(line);
      lines.slice(0, maxLines).forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
      return y + Math.min(lines.length, maxLines) * lineHeight;
    };

    const createResultCardBlob = async () => {
      await document.fonts?.ready;
      const explorerImage = await loadImage(explorerImageUrl);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable');

      const fontFamily = '"PingFang TC", "Microsoft JhengHei", Arial, sans-serif';
      context.fillStyle = archetype.value.soft;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = archetype.value.deep;
      context.fillRect(0, 0, 24, canvas.height);
      context.fillRect(0, 0, canvas.width, 18);

      context.fillStyle = archetype.value.deep;
      context.font = `900 30px ${fontFamily}`;
      context.fillText('TRIP SYNC', 72, 86);
      context.font = `800 20px ${fontFamily}`;
      context.fillStyle = '#64716d';
      context.fillText('地球探索人格報告', 72, 120);
      fillRoundedRect(context, 765, 60, 243, 54, 10, archetype.value.deep);
      context.fillStyle = '#ffffff';
      context.font = `900 19px ${fontFamily}`;
      context.textAlign = 'center';
      context.fillText('EARTH MODE  /  04', 886, 94);
      context.textAlign = 'left';

      context.fillStyle = archetype.value.deep;
      context.font = `900 74px ${fontFamily}`;
      context.fillText(archetype.value.label, 72, 222);
      context.fillStyle = '#1d2927';
      context.font = `850 34px ${fontFamily}`;
      context.fillText(archetype.value.cosmicTitle, 74, 274);
      context.fillStyle = '#64716d';
      context.font = `900 18px ${fontFamily}`;
      context.fillText(archetype.value.english, 74, 308);

      fillRoundedRect(context, 72, 338, 936, 416, 18, '#ffffff');
      const imageCrops = [
        { x: 20, y: 205, width: 490, height: 610 },
        { x: 480, y: 180, width: 430, height: 650 },
        { x: 885, y: 150, width: 500, height: 680 },
        { x: 1335, y: 30, width: 410, height: 820 },
      ];
      const crop = imageCrops[archetype.value.imageIndex];
      const maxImageWidth = 620;
      const maxImageHeight = 382;
      const imageScale = Math.min(maxImageWidth / crop.width, maxImageHeight / crop.height);
      const drawWidth = crop.width * imageScale;
      const drawHeight = crop.height * imageScale;
      context.drawImage(
        explorerImage,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        540 - drawWidth / 2,
        356 + (maxImageHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );

      context.fillStyle = archetype.value.deep;
      context.font = `850 30px ${fontFamily}`;
      context.fillText(`「${archetype.value.innerLine}」`, 72, 814);
      context.fillStyle = '#34433f';
      context.font = `700 23px ${fontFamily}`;
      drawWrappedText(context, archetype.value.description, 72, 858, 936, 36, 2);

      let traitX = 72;
      context.font = `850 18px ${fontFamily}`;
      archetype.value.traits.forEach((trait) => {
        const width = context.measureText(trait).width + 38;
        fillRoundedRect(context, traitX, 939, width, 42, 8, '#ffffff');
        context.fillStyle = archetype.value.deep;
        context.fillText(trait, traitX + 19, 967);
        traitX += width + 12;
      });

      context.fillStyle = '#64716d';
      context.font = `900 17px ${fontFamily}`;
      context.fillText('本次任務主頻', 72, 1030);
      context.fillStyle = '#1d2927';
      context.font = `850 25px ${fontFamily}`;
      context.fillText(selectedChannels.value.map((channel) => channel.member).join('  ×  ') || '待選擇', 72, 1068);

      fillRoundedRect(context, 72, 1104, 452, 166, 14, '#ffffff');
      fillRoundedRect(context, 540, 1104, 468, 166, 14, archetype.value.deep);
      context.fillStyle = archetype.value.accent;
      context.font = `900 17px ${fontFamily}`;
      context.fillText('最合拍旅伴', 98, 1142);
      context.fillStyle = archetype.value.deep;
      context.font = `900 31px ${fontFamily}`;
      context.fillText(bestMatch.value.label, 98, 1185);
      context.fillStyle = '#64716d';
      context.font = `700 17px ${fontFamily}`;
      drawWrappedText(context, compatibility.value.bestReason, 98, 1220, 396, 26, 2);

      context.fillStyle = '#ffffff';
      context.font = `900 17px ${fontFamily}`;
      context.fillText('最容易不同步', 566, 1142);
      context.font = `900 31px ${fontFamily}`;
      context.fillText(frictionMatch.value.label, 566, 1185);
      context.fillStyle = 'rgba(255, 255, 255, 0.76)';
      context.font = `700 17px ${fontFamily}`;
      drawWrappedText(context, compatibility.value.frictionReason, 566, 1220, 410, 26, 2);

      context.fillStyle = '#64716d';
      context.font = `800 17px ${fontFamily}`;
      context.fillText('人格決定導航方式，任務頻道決定這趟想看見什麼。', 72, 1320);
      context.textAlign = 'right';
      context.fillStyle = archetype.value.deep;
      context.font = `900 18px ${fontFamily}`;
      context.fillText('trip-sync-quiz', 1008, 1320);

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to create result card')), 'image/png');
      });
    };

    const openResultCardPreview = async () => {
      shareCardOpen.value = true;
      shareCardBusy.value = true;
      try {
        const blob = await createResultCardBlob();
        if (shareCardUrl.value) URL.revokeObjectURL(shareCardUrl.value);
        shareCardBlob.value = blob;
        shareCardUrl.value = URL.createObjectURL(blob);
      } catch {
        shareCardOpen.value = false;
        showToast('圖卡生成失敗，請稍後再試');
      } finally {
        shareCardBusy.value = false;
      }
    };

    const closeResultCardPreview = () => {
      shareCardOpen.value = false;
    };

    const shareResult = async () => {
      try {
        const blob = shareCardBlob.value ?? await createResultCardBlob();
        const file = new File([blob], `trip-sync-${archetype.value.id}.png`, { type: 'image/png' });
        const shareData = { title: 'TRIP SYNC 地球探索報告', text: shareText.value, files: [file] };
        if (navigator.share && navigator.canShare?.(shareData)) {
          await navigator.share(shareData);
          return;
        }
        await navigator.clipboard?.writeText(`${shareText.value} ${window.location.href}`);
        showToast('分享文字已複製，下載圖卡後就能上傳 IG');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        showToast('分享沒有完成，請再試一次');
      }
    };

    const alienStyle = (index: number) => ({ marginLeft: `-${index * 100}%` });
    const scrollToArchetypes = () => document.querySelector('#archetypes')?.scrollIntoView({ behavior: 'smooth' });
    const guideCoverUrl = (guide: TravelGuide) => `${import.meta.env.BASE_URL}${guide.cover}`;
    const resultVariables = computed(() => ({
      '--result-accent': archetype.value.accent,
      '--result-deep': archetype.value.deep,
      '--result-soft': archetype.value.soft,
    }));

    return {
      step,
      sitePage,
      activeSitePage,
      activeGuide,
      publishedTravelGuides,
      questions,
      archetypes,
      channels,
      paceOptions,
      companionOptions,
      budgetOptions,
      avoidOptions,
      currentQuestion,
      currentQuestionIndex,
      currentAnswer,
      progress,
      phaseLabel,
      archetype,
      compatibility,
      bestMatch,
      frictionMatch,
      explorationScore,
      socialProfile,
      coordinationProfile,
      selectedChannelIds,
      selectedChannels,
      pace,
      companion,
      budget,
      avoids,
      avoidLabels,
      toast,
      shareCardOpen,
      shareCardBusy,
      shareCardUrl,
      explorerImageUrl,
      navigateToSitePage,
      navigateToGuide,
      startQuiz,
      selectAnswer,
      nextQuestion,
      goBack,
      toggleChannel,
      toggleAvoid,
      finishChannels,
      finishQuiz,
      scrollToRecommendations,
      shareResult,
      openResultCardPreview,
      closeResultCardPreview,
      alienStyle,
      scrollToArchetypes,
      guideCoverUrl,
      resultVariables,
      settingLabel,
    };
  },
  template: `
    <main class="app-shell">
      <section v-if="sitePage !== 'home'" class="content-page-shell">
        <SiteHeader :active-page="sitePage" mode="content" @navigate="navigateToSitePage" @start-quiz="startQuiz" />
        <GuidesAdmin v-if="sitePage === 'admin'" @open-guide="navigateToGuide" @open-guides="navigateToSitePage('guides')" />
        <GuidesIndex v-else-if="sitePage === 'guides'" :guides="publishedTravelGuides" @open-guide="navigateToGuide" @start-quiz="startQuiz" />
        <GuideArticle v-else-if="sitePage === 'guide' && activeGuide" :guide="activeGuide" :guides="publishedTravelGuides" @open-guide="navigateToGuide" @open-guides="navigateToSitePage('guides')" @start-quiz="startQuiz" />
        <TrustPage v-else :page="activeSitePage" @navigate="navigateToSitePage" @start-quiz="startQuiz" />
        <SiteFooter v-if="sitePage !== 'admin'" @navigate="navigateToSitePage" />
      </section>

      <section v-else-if="step === 'landing'" class="landing-page">
        <SiteHeader :active-page="sitePage" @navigate="navigateToSitePage" @start-quiz="startQuiz" />

        <section class="hero-section">
          <img class="hero-crew" :src="explorerImageUrl" alt="安心靠岸、安心探路、彈性開路與未知追光四位地球探索者" />
          <div class="hero-haze"></div>
          <div class="hero-copy">
            <p class="eyebrow">EARTH EXPLORATION PROGRAM</p>
            <h1>重新啟動你的<br />地球探索模式</h1>
            <p class="hero-lead">我們都是降落地球的宇宙旅人。用 7 個旅行情境，找回你原本面對未知的導航方式。</p>
            <div class="hero-actions">
              <button class="primary-button coral" type="button" @click="startQuiz">開始校準 <span>約 90 秒</span></button>
              <button class="text-button" type="button" @click="scrollToArchetypes">先看四種模式 ↓</button>
            </div>
            <div class="hero-meta"><span>不需登入</span><span>4 種探索人格</span><span>7 個任務頻道</span><span>180 個目的地候選</span></div>
            <p class="method-note"><b>測驗依據</b> 參考 Big Five 五大人格中的開放性、盡責性與外向性，並結合旅行中的新奇／熟悉偏好。這是旅行偏好分析，不是心理診斷。</p>
          </div>
        </section>

        <section id="archetypes" class="archetype-section">
          <div class="section-heading">
            <div><p class="eyebrow">YOUR NAVIGATION SYSTEM</p><h2>你是怎麼靠近未知</h2></div>
            <p>人格描述相對穩定的探索方式；旅宿、美食、自然與文化，則是每趟旅行都可能重新選擇的任務重點。</p>
          </div>
          <div class="archetype-grid">
            <article v-for="item in archetypes" :key="item.id" class="archetype-card" :style="{ '--alien-accent': item.accent, '--alien-deep': item.deep, '--alien-soft': item.soft }">
              <div class="alien-window"><img :src="explorerImageUrl" :alt="item.label + ' ' + item.cosmicTitle" :style="alienStyle(item.imageIndex)" /></div>
              <div class="archetype-copy">
                <span>{{ item.english }}</span>
                <h3>{{ item.label }}</h3>
                <h4>{{ item.cosmicTitle }}</h4>
                <p>{{ item.description }}</p>
                <blockquote>「{{ item.innerLine }}」</blockquote>
              </div>
            </article>
          </div>
        </section>

        <section class="frequency-section">
          <div class="section-heading inverse">
            <div><p class="eyebrow">EARTH EXPLORATION CHANNELS</p><h2>人格只有一個，<br />這趟任務可以有很多重點。</h2></div>
            <p>七位地球觀測員不再替你定義人格，而是幫你選擇這次最想接收的旅行訊號。</p>
          </div>
          <div class="frequency-strip">
            <article v-for="channel in channels" :key="channel.id" :style="{ '--channel-accent': channel.accent, '--channel-deep': channel.deep }">
              <img :src="channel.image" :alt="channel.member + ' ' + channel.title" />
              <div><small>{{ channel.member }}</small><h3>{{ channel.title }}</h3><p>{{ channel.role }}</p></div>
            </article>
          </div>
        </section>

        <section class="home-guides-section">
          <div class="section-heading">
            <div><p class="eyebrow">FIELD NOTES FROM EARTH</p><h2>把靈感變成走得動的路線</h2></div>
            <div class="home-guides-intro">
              <p>不是目的地清單，而是從適合誰、交通怎麼接、預算放哪裡開始規劃。</p>
              <button class="text-button" type="button" @click="navigateToSitePage('guides')">看全部 {{ publishedTravelGuides.length }} 篇指南 →</button>
            </div>
          </div>
          <div class="home-guide-grid">
            <a v-for="guide in publishedTravelGuides.slice(0, 3)" :key="guide.slug" :href="'#/guides/' + guide.slug" :style="{ '--guide-accent': guide.accent }" @click.prevent="navigateToGuide(guide.slug)">
              <img :src="guideCoverUrl(guide)" :alt="guide.coverAlt" />
              <span><small>{{ guide.destination }} / {{ guide.days }}</small><b>{{ guide.title }}</b><em>{{ guide.kicker }}</em></span>
            </a>
          </div>
        </section>

        <section class="system-section">
          <article><b>01</b><h3>校準人格</h3><p>7 個故事情境，找出你如何面對陌生、風險、社交與改變。</p></article>
          <article><b>02</b><h3>打開頻道</h3><p>選擇 1～3 個這趟最重要的旅行主題，不必只當一種人。</p></article>
          <article><b>03</b><h3>設定條件</h3><p>加入節奏、同行方式、預算與避雷條件，讓推薦真的可行。</p></article>
          <div class="system-cta"><p>地球很大，先找回你的導航方式。</p><button class="primary-button dark" type="button" @click="startQuiz">開始地球任務 →</button></div>
        </section>
        <SiteFooter @navigate="navigateToSitePage" />
      </section>

      <template v-else-if="step !== 'result'">
        <header class="quiz-header glass-panel">
          <button class="icon-button" type="button" aria-label="返回上一頁" @click="goBack">←</button>
          <div class="progress-copy">
            <div><strong>{{ phaseLabel }}</strong><span>導航校準中</span></div>
            <div class="progress-track" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: progress + '%' }"></i></div>
          </div>
          <b class="progress-number">{{ progress }}%</b>
        </header>

        <section v-if="step === 'quiz'" class="quiz-page">
          <div class="quiz-content">
            <Transition name="question-slide" mode="out-in">
              <section :key="currentQuestion.id" class="question-stage">
                <div class="question-heading">
                  <p class="chapter-label">{{ currentQuestion.chapter }}</p>
                  <h1>{{ currentQuestion.prompt }}</h1>
                  <p>{{ currentQuestion.help }}</p>
                </div>
                <div class="answer-grid">
                  <button v-for="(choice, index) in currentQuestion.choices" :key="choice.id" class="answer-card" :class="{ selected: currentAnswer === choice.id, muted: currentAnswer && currentAnswer !== choice.id }" :style="{ '--choice-accent': choice.accent }" type="button" :aria-pressed="currentAnswer === choice.id" @click="selectAnswer(choice)">
                    <span class="answer-art">
                      <img :src="choice.image" alt="" decoding="async" />
                      <b class="answer-letter">{{ String.fromCharCode(65 + index) }}</b>
                      <small>{{ choice.scene }}</small>
                    </span>
                    <span class="answer-copy"><strong>{{ choice.title }}</strong><small>{{ choice.description }}</small></span>
                    <span class="answer-check">✓</span>
                  </button>
                </div>
              </section>
            </Transition>
          </div>
          <footer class="quiz-action glass-panel"><p>選擇最接近真實反應的一項。</p><button class="primary-button dark" type="button" :disabled="!currentAnswer" @click="nextQuestion">{{ currentQuestionIndex === questions.length - 1 ? '選擇本次任務' : '下一個訊號' }} →</button></footer>
        </section>

        <section v-else-if="step === 'channels'" class="mission-page">
          <div class="mission-heading"><p class="eyebrow">CHOOSE YOUR EARTH CHANNELS</p><h1>這次來到地球，<br />你最想探索什麼？</h1><p>選擇 1～3 個頻道。它們是本次旅行重點，不是固定人格。</p><b>{{ selectedChannelIds.length }} / 3</b></div>
          <div class="mission-grid">
            <button v-for="channel in channels" :key="channel.id" class="mission-card" :class="{ selected: selectedChannelIds.includes(channel.id) }" :style="{ '--channel-accent': channel.accent, '--channel-deep': channel.deep, '--channel-soft': channel.soft }" type="button" :aria-pressed="selectedChannelIds.includes(channel.id)" @click="toggleChannel(channel.id)">
              <img :src="channel.image" :alt="channel.member + ' ' + channel.title" />
              <span class="mission-card-copy"><small>{{ channel.member }}</small><strong>{{ channel.title }}</strong><em>{{ channel.role }}</em><span>{{ channel.description }}</span></span>
              <i class="mission-check">{{ selectedChannelIds.includes(channel.id) ? '✓' : '+' }}</i>
            </button>
          </div>
          <footer class="quiz-action glass-panel"><p>選中的頻道會決定目的地與體驗推薦。</p><button class="primary-button dark" type="button" :disabled="!selectedChannelIds.length" @click="finishChannels">設定旅行條件 →</button></footer>
        </section>

        <section v-else class="settings-page">
          <div class="settings-heading"><p class="eyebrow">FLIGHT CONDITIONS</p><h1>最後，設定這次的飛行條件。</h1><p>不用想太久，這些只影響本次推薦，不會改變你的人格。</p></div>
          <div class="settings-bento">
            <section class="setting-panel"><div><span>01</span><h2>一天想走多快？</h2></div><div class="segmented-options"><button v-for="option in paceOptions" :key="option.id" type="button" :class="{ selected: pace === option.id }" @click="pace = option.id"><strong>{{ option.label }}</strong><small>{{ option.description }}</small></button></div></section>
            <section class="setting-panel"><div><span>02</span><h2>這次和誰出發？</h2></div><div class="segmented-options four"><button v-for="option in companionOptions" :key="option.id" type="button" :class="{ selected: companion === option.id }" @click="companion = option.id"><strong>{{ option.label }}</strong><small>{{ option.description }}</small></button></div></section>
            <section class="setting-panel"><div><span>03</span><h2>怎麼分配預算？</h2></div><div class="segmented-options"><button v-for="option in budgetOptions" :key="option.id" type="button" :class="{ selected: budget === option.id }" @click="budget = option.id"><strong>{{ option.label }}</strong><small>{{ option.description }}</small></button></div></section>
            <section class="setting-panel avoid-panel"><div><span>04</span><h2>這趟想避開什麼？</h2><p>可複選，也可以完全不選。</p></div><div class="avoid-options"><button v-for="option in avoidOptions" :key="option.id" type="button" :class="{ selected: avoids.includes(option.id) }" :aria-pressed="avoids.includes(option.id)" @click="toggleAvoid(option.id)"><i>{{ avoids.includes(option.id) ? '✓' : '+' }}</i>{{ option.label }}</button></div></section>
          </div>
          <footer class="quiz-action glass-panel"><p>避雷條件只用於推薦，不會出現在分享文字。</p><button class="primary-button coral" type="button" @click="finishQuiz">生成探索報告 →</button></footer>
        </section>
      </template>

      <section v-else class="result-page" :style="resultVariables">
        <header class="result-nav glass-panel"><button class="brand brand-button" type="button" @click="navigateToSitePage('home')"><span class="brand-mark">TS</span><span><b>TRIP SYNC</b><small>地球探索報告</small></span></button><div><button class="icon-text-button" type="button" @click="openResultCardPreview">製作 IG 卡 ↗</button><button class="icon-text-button desktop-only" type="button" @click="startQuiz">重新校準</button></div></header>

        <div class="result-intro"><p class="eyebrow">YOUR EARTH EXPLORATION MODE</p><h1>你的宇宙導航系統，已重新上線。</h1></div>

        <div class="result-bento">
          <figure class="result-alien bento-panel"><div class="alien-window"><img :src="explorerImageUrl" :alt="archetype.label + ' ' + archetype.cosmicTitle" :style="alienStyle(archetype.imageIndex)" /></div><figcaption>{{ archetype.english }}</figcaption></figure>
          <section class="result-summary bento-panel">
            <div class="result-type-row"><span>地球探索人格</span><b>{{ explorationScore }} / 12</b></div>
            <p>{{ archetype.english }}</p><h2>{{ archetype.label }}</h2><h3>{{ archetype.cosmicTitle }}</h3>
            <p class="result-description">{{ archetype.description }}</p>
            <blockquote>「{{ archetype.innerLine }}」</blockquote>
            <div class="trait-row"><span v-for="trait in archetype.traits" :key="trait">{{ trait }}</span></div>
            <button class="primary-button result-button" type="button" @click="scrollToRecommendations">啟動全球目的地搜尋 ↓</button>
          </section>

          <section class="motive-panel bento-panel"><p class="eyebrow">你的探索推力</p><h3>{{ archetype.motive }}</h3><p>{{ archetype.routeAdvice }}</p></section>
          <section class="radar-panel bento-panel"><p class="eyebrow">導航雷達</p><div v-for="stat in archetype.stats" :key="stat.label" class="stat-row"><div><span>{{ stat.label }}</span><b>{{ stat.value }}</b></div><div class="stat-track"><i :style="{ width: stat.value + '%' }"></i></div></div></section>

          <section class="evidence-panel bento-panel">
            <div class="panel-heading"><div><p class="eyebrow">WHY THIS MODE</p><h3>為什麼你是這一型？</h3></div><span>主人格與本次同行習慣分開解讀</span></div>
            <p class="big-five-summary">{{ archetype.bigFiveSummary }}</p>
            <div class="signal-profile-grid">
              <article><small>社交電量</small><h4>{{ socialProfile.label }}</h4><p>{{ socialProfile.description }}</p></article>
              <article><small>同行協調</small><h4>{{ coordinationProfile.label }}</h4><p>{{ coordinationProfile.description }}</p></article>
              <article><small>判定方式</small><h4>導航人格 × 輔助訊號</h4><p>01、02、03、05 與低權重的 07 決定主人格；04、06 只補充你的社交與同行偏好。</p></article>
            </div>
            <details class="theory-details">
              <summary><span>我們怎麼判斷？</span><small>查看完整理論與四型對照</small></summary>
              <div class="theory-content">
                <p>本測驗參考 Big Five 人格架構中與旅行行為較相關的開放性、盡責性與外向性，並加入旅行情境裡的新奇／熟悉偏好。四種類型是方便理解旅行決策的趣味化標籤，不等同完整人格分類。</p>
                <div class="theory-table" role="table" aria-label="四種旅行人格與五大人格解讀">
                  <div class="theory-row theory-head" role="row"><b role="columnheader">旅行人格</b><b role="columnheader">最接近的五大人格解讀</b></div>
                  <div class="theory-row" role="row"><strong role="cell">安心靠岸型</strong><span role="cell">開放性偏低至中等，對秩序、資訊完整與可預測性的需求較高。</span></div>
                  <div class="theory-row" role="row"><strong role="cell">安心探路型</strong><span role="cell">開放性中等，準備與探索傾向均衡，喜歡在可靠範圍內接近新事物。</span></div>
                  <div class="theory-row" role="row"><strong role="cell">彈性開路型</strong><span role="cell">開放性偏高，重視自主與調整空間，會把計畫當成可變動的工具。</span></div>
                  <div class="theory-row" role="row"><strong role="cell">未知追光型</strong><span role="cell">開放性較高，新奇與刺激需求較強，對陌生環境的好奇通常高於不安。</span></div>
                </div>
                <p class="theory-caution">外向不等於愛冒險，獨處也不等於保守；因此社交電量不參與四型總分。結果只反映這次回答所呈現的旅行偏好，不供醫療、心理診斷或人員篩選使用。</p>
              </div>
            </details>
          </section>

          <section class="compatibility-panel bento-panel">
            <div class="panel-heading"><div><p class="eyebrow">TRAVEL COMPANION SYNC</p><h3>你的旅伴同步雷達</h3></div><span>不是誰比較好，而是面對未知的節奏是否一致</span></div>
            <div class="compatibility-grid">
              <article class="mate-card best-mate">
                <div class="mate-avatar"><div class="alien-window"><img :src="explorerImageUrl" :alt="bestMatch.label" :style="alienStyle(bestMatch.imageIndex)" /></div></div>
                <div><small>最合拍旅伴</small><h4>{{ bestMatch.label }}</h4><p>{{ compatibility.bestReason }}</p></div>
              </article>
              <article class="mate-card friction-mate">
                <div class="mate-avatar"><div class="alien-window"><img :src="explorerImageUrl" :alt="frictionMatch.label" :style="alienStyle(frictionMatch.imageIndex)" /></div></div>
                <div><small>最容易不同步</small><h4>{{ frictionMatch.label }}</h4><p>{{ compatibility.frictionReason }}</p></div>
              </article>
              <aside class="travel-agreement"><small>你們的同行協議</small><p>{{ compatibility.travelAgreement }}</p></aside>
            </div>
          </section>

          <section class="selected-frequencies bento-panel"><div class="panel-heading"><div><p class="eyebrow">THIS TRIP'S CHANNELS</p><h3>本次地球任務主頻</h3></div><span>這趟旅行的重點，不是固定人格</span></div><div class="selected-frequency-grid"><article v-for="channel in selectedChannels" :key="channel.id" :style="{ '--channel-accent': channel.accent, '--channel-deep': channel.deep }"><img :src="channel.image" :alt="channel.member + ' ' + channel.title" /><div><small>{{ channel.member }}</small><h4>{{ channel.title }}</h4><p>{{ channel.role }}</p><span v-for="tag in channel.tags" :key="tag">{{ tag }}</span></div></article></div></section>

          <section class="protocol-panel bento-panel"><p class="eyebrow">本次飛行設定</p><div class="protocol-row"><span>旅行節奏</span><b>{{ settingLabel(paceOptions, pace) }}</b></div><div class="protocol-row"><span>同行方式</span><b>{{ settingLabel(companionOptions, companion) }}</b></div><div class="protocol-row"><span>消費模式</span><b>{{ settingLabel(budgetOptions, budget) }}</b></div><div class="protocol-row"><span>避開條件</span><b>{{ avoidLabels.length ? avoidLabels.join('、') : '沒有特別限制' }}</b></div><small>避雷條件不會加入公開分享文字。</small></section>

          <GlobalPlanner
            :archetype-id="archetype.id"
            :channel-ids="selectedChannelIds"
            :pace="pace"
            :companion="companion"
            :budget-mode="budget"
            :avoid-ids="avoids"
          />
        </div>

        <footer class="result-footer"><p>人格描述你的導航方式，頻道決定這趟想看見的地球。</p><div><button class="primary-button dark" type="button" @click="openResultCardPreview">製作 IG 人格卡</button><button class="text-button" type="button" @click="startQuiz">重新校準</button></div></footer>
        <SiteFooter @navigate="navigateToSitePage" />
      </section>

      <div v-if="shareCardOpen" class="share-modal-backdrop" role="presentation" @click.self="closeResultCardPreview">
        <section class="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-card-title">
          <button class="share-modal-close" type="button" aria-label="關閉圖卡預覽" @click="closeResultCardPreview">×</button>
          <div class="share-card-preview">
            <p v-if="shareCardBusy">正在接收你的地球人格訊號…</p>
            <img v-else-if="shareCardUrl" :src="shareCardUrl" :alt="archetype.label + ' IG 人格結果卡'" />
          </div>
          <div class="share-modal-copy">
            <p class="eyebrow">1080 × 1350 / IG PORTRAIT</p>
            <h2 id="share-card-title">你的 IG 人格結果卡</h2>
            <p>圖卡包含探索人格、這次的任務頻道，以及最合拍與最容易不同步的旅伴。</p>
            <div class="share-modal-actions">
              <button class="primary-button dark" type="button" :disabled="shareCardBusy" @click="shareResult">分享圖卡</button>
              <a class="primary-button card-download" :class="{ disabled: shareCardBusy }" :href="shareCardUrl || undefined" :download="'trip-sync-' + archetype.id + '.png'">下載 PNG</a>
            </div>
            <small>避雷條件不會出現在公開圖卡中。</small>
          </div>
        </section>
      </div>

      <Transition name="toast"><div v-if="toast" class="toast-message" role="status">{{ toast }}</div></Transition>
    </main>
  `,
});
