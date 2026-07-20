import { computed, defineComponent, nextTick, ref } from 'vue';
import {
  archetypes,
  avoidOptions,
  budgetOptions,
  channels,
  companionOptions,
  paceOptions,
  questions,
} from './data/tripSync';
import type { Archetype, ChannelId, Choice, TravelSettingOption } from './types';

type Step = 'landing' | 'quiz' | 'channels' | 'settings' | 'result';

export default defineComponent({
  name: 'App',
  setup() {
    const step = ref<Step>('landing');
    const currentQuestionIndex = ref(0);
    const answers = ref<Record<number, string>>({});
    const selectedChannelIds = ref<ChannelId[]>([]);
    const pace = ref('flex');
    const companion = ref('pair');
    const budget = ref('balanced');
    const avoids = ref<string[]>([]);
    const toast = ref('');

    const currentQuestion = computed(() => questions[currentQuestionIndex.value]);
    const currentAnswer = computed(() => answers.value[currentQuestion.value.id]);
    const explorationScore = computed(() => questions.reduce((total, question) => {
      const selected = question.choices.find((choice) => choice.id === answers.value[question.id]);
      return total + (selected?.explorationScore ?? 0);
    }, 0));
    const archetype = computed(() => archetypes.find((item) => explorationScore.value >= item.min && explorationScore.value <= item.max) ?? archetypes[0]);
    const selectedChannels = computed(() => selectedChannelIds.value.map((id) => channels.find((channel) => channel.id === id)).filter(Boolean) as typeof channels);

    const progress = computed(() => {
      if (step.value === 'landing') return 0;
      if (step.value === 'quiz') return Math.round(((currentQuestionIndex.value + (currentAnswer.value ? 1 : 0)) / 8) * 100);
      if (step.value === 'channels') return selectedChannelIds.value.length ? 88 : 75;
      return 100;
    });

    const phaseLabel = computed(() => {
      if (step.value === 'quiz') return `人格校準 ${currentQuestionIndex.value + 1} / ${questions.length}`;
      if (step.value === 'channels') return '本次任務頻道';
      if (step.value === 'settings') return '飛行條件設定';
      return '探索報告';
    });

    const destinationMatches = computed(() => {
      const chosen = selectedChannels.value.length ? selectedChannels.value : [channels[0]];
      const pool = chosen.flatMap((channel, channelIndex) => channel.destinations.map((destination, destinationIndex) => ({
        ...destination,
        channel,
        order: destinationIndex * chosen.length + channelIndex,
      })));
      const seen = new Set<string>();
      return pool
        .sort((a, b) => a.order - b.order)
        .filter((destination) => {
          if (seen.has(destination.city)) return false;
          seen.add(destination.city);
          return true;
        })
        .slice(0, 3)
        .map((destination, index) => ({ ...destination, match: Math.max(83, destination.match - index * 2) }));
    });

    const bookingSlots = computed(() => {
      const chosen = selectedChannels.value.length ? selectedChannels.value : [channels[0]];
      const providers = ['Klook', 'KKday', 'Trip.com'] as const;
      return providers.map((provider, index) => {
        const channel = chosen[index % chosen.length];
        return channel.affiliateSlots.find((slot) => slot.provider === provider) ?? channel.affiliateSlots[0];
      });
    });

    const settingLabel = (options: TravelSettingOption[], id: string) => options.find((item) => item.id === id)?.label ?? '';
    const avoidLabels = computed(() => avoids.value.map((id) => avoidOptions.find((item) => item.id === id)?.label).filter(Boolean));

    const showToast = (message: string) => {
      toast.value = message;
      window.setTimeout(() => { toast.value = ''; }, 2200);
    };

    const startQuiz = () => {
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

    const scrollToRecommendations = () => document.querySelector('#destination-matches')?.scrollIntoView({ behavior: 'smooth' });

    const shareResult = async () => {
      const frequencies = selectedChannels.value.map((channel) => channel.title.replace('頻道', '')).join(' × ');
      const text = `我的地球探索人格是「${archetype.value.label}・${archetype.value.cosmicTitle}」！本次任務主頻：${frequencies}。`;
      try {
        if (navigator.share) await navigator.share({ title: 'TRIP SYNC 地球探索報告', text, url: window.location.href });
        else {
          await navigator.clipboard.writeText(`${text} ${window.location.href}`);
          showToast('探索報告連結已複製');
        }
      } catch {
        // Closing the native share sheet should not surface an error.
      }
    };

    const alienStyle = (index: number) => ({ marginLeft: `-${index * 100}%` });
    const scrollToArchetypes = () => document.querySelector('#archetypes')?.scrollIntoView({ behavior: 'smooth' });
    const resultVariables = computed(() => ({
      '--result-accent': archetype.value.accent,
      '--result-deep': archetype.value.deep,
      '--result-soft': archetype.value.soft,
    }));

    return {
      step,
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
      explorationScore,
      selectedChannelIds,
      selectedChannels,
      pace,
      companion,
      budget,
      avoids,
      avoidLabels,
      destinationMatches,
      bookingSlots,
      toast,
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
      alienStyle,
      scrollToArchetypes,
      resultVariables,
      settingLabel,
    };
  },
  template: `
    <main class="app-shell">
      <section v-if="step === 'landing'" class="landing-page">
        <header class="top-nav glass-panel">
          <a class="brand" href="#" aria-label="Trip Sync 首頁">
            <span class="brand-mark">TS</span>
            <span><b>TRIP SYNC</b><small>地球探索計畫</small></span>
          </a>
          <button class="nav-link" type="button" @click="scrollToArchetypes">認識四種人格</button>
        </header>

        <section class="hero-section">
          <img class="hero-crew" src="/characters/explorers.png" alt="安心靠岸、安心探路、彈性開路與未知追光四位地球探索者" />
          <div class="hero-haze"></div>
          <div class="hero-copy">
            <p class="eyebrow">EARTH EXPLORATION PROGRAM</p>
            <h1>重新啟動你的<br />地球探索模式</h1>
            <p class="hero-lead">我們都是降落地球的宇宙旅人。用 6 個旅行情境，找回你原本面對未知的導航方式。</p>
            <div class="hero-actions">
              <button class="primary-button coral" type="button" @click="startQuiz">開始校準 <span>約 90 秒</span></button>
              <button class="text-button" type="button" @click="scrollToArchetypes">先看四種模式 ↓</button>
            </div>
            <div class="hero-meta"><span>不需登入</span><span>4 種探索人格</span><span>7 個任務頻道</span><span>全球目的地推薦</span></div>
          </div>
        </section>

        <section id="archetypes" class="archetype-section">
          <div class="section-heading">
            <div><p class="eyebrow">YOUR NAVIGATION SYSTEM</p><h2>你不是喜歡什麼，<br />而是怎麼靠近未知。</h2></div>
            <p>人格描述相對穩定的探索方式；旅宿、美食、自然與文化，則是每趟旅行都可能重新選擇的任務重點。</p>
          </div>
          <div class="archetype-grid">
            <article v-for="item in archetypes" :key="item.id" class="archetype-card" :style="{ '--alien-accent': item.accent, '--alien-deep': item.deep, '--alien-soft': item.soft }">
              <div class="alien-window"><img src="/characters/explorers.png" :alt="item.label + ' ' + item.cosmicTitle" :style="alienStyle(item.imageIndex)" /></div>
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

        <section class="system-section">
          <article><b>01</b><h3>校準人格</h3><p>6 個故事情境，找出你如何面對陌生、風險與改變。</p></article>
          <article><b>02</b><h3>打開頻道</h3><p>選擇 1～3 個這趟最重要的旅行主題，不必只當一種人。</p></article>
          <article><b>03</b><h3>設定條件</h3><p>加入節奏、同行方式、預算與避雷條件，讓推薦真的可行。</p></article>
          <div class="system-cta"><p>地球很大，先找回你的導航方式。</p><button class="primary-button dark" type="button" @click="startQuiz">開始地球任務 →</button></div>
        </section>
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
        <header class="result-nav glass-panel"><a class="brand" href="#" @click.prevent="step = 'landing'"><span class="brand-mark">TS</span><span><b>TRIP SYNC</b><small>地球探索報告</small></span></a><div><button class="icon-text-button" type="button" @click="shareResult">分享報告 ↗</button><button class="icon-text-button desktop-only" type="button" @click="startQuiz">重新校準</button></div></header>

        <div class="result-intro"><p class="eyebrow">YOUR EARTH EXPLORATION MODE</p><h1>你的宇宙導航系統，已重新上線。</h1></div>

        <div class="result-bento">
          <figure class="result-alien bento-panel"><div class="alien-window"><img src="/characters/explorers.png" :alt="archetype.label + ' ' + archetype.cosmicTitle" :style="alienStyle(archetype.imageIndex)" /></div><figcaption>{{ archetype.english }}</figcaption></figure>
          <section class="result-summary bento-panel">
            <div class="result-type-row"><span>地球探索人格</span><b>{{ explorationScore }} / 12</b></div>
            <p>{{ archetype.english }}</p><h2>{{ archetype.label }}</h2><h3>{{ archetype.cosmicTitle }}</h3>
            <p class="result-description">{{ archetype.description }}</p>
            <blockquote>「{{ archetype.innerLine }}」</blockquote>
            <div class="trait-row"><span v-for="trait in archetype.traits" :key="trait">{{ trait }}</span></div>
            <button class="primary-button result-button" type="button" @click="scrollToRecommendations">查看我的地球座標 ↓</button>
          </section>

          <section class="motive-panel bento-panel"><p class="eyebrow">你的探索推力</p><h3>{{ archetype.motive }}</h3><p>{{ archetype.routeAdvice }}</p></section>
          <section class="radar-panel bento-panel"><p class="eyebrow">導航雷達</p><div v-for="stat in archetype.stats" :key="stat.label" class="stat-row"><div><span>{{ stat.label }}</span><b>{{ stat.value }}</b></div><div class="stat-track"><i :style="{ width: stat.value + '%' }"></i></div></div></section>

          <section class="selected-frequencies bento-panel"><div class="panel-heading"><div><p class="eyebrow">THIS TRIP'S CHANNELS</p><h3>本次地球任務主頻</h3></div><span>這趟旅行的重點，不是固定人格</span></div><div class="selected-frequency-grid"><article v-for="channel in selectedChannels" :key="channel.id" :style="{ '--channel-accent': channel.accent, '--channel-deep': channel.deep }"><img :src="channel.image" :alt="channel.member + ' ' + channel.title" /><div><small>{{ channel.member }}</small><h4>{{ channel.title }}</h4><p>{{ channel.role }}</p><span v-for="tag in channel.tags" :key="tag">{{ tag }}</span></div></article></div></section>

          <section class="protocol-panel bento-panel"><p class="eyebrow">本次飛行設定</p><div class="protocol-row"><span>旅行節奏</span><b>{{ settingLabel(paceOptions, pace) }}</b></div><div class="protocol-row"><span>同行方式</span><b>{{ settingLabel(companionOptions, companion) }}</b></div><div class="protocol-row"><span>消費模式</span><b>{{ settingLabel(budgetOptions, budget) }}</b></div><div class="protocol-row"><span>避開條件</span><b>{{ avoidLabels.length ? avoidLabels.join('、') : '沒有特別限制' }}</b></div><small>避雷條件不會加入公開分享文字。</small></section>

          <section id="destination-matches" class="destinations-panel bento-panel"><div class="panel-heading"><div><p class="eyebrow">GLOBAL LANDING COORDINATES</p><h3>先從這三個地球座標開始</h3></div><span>依人格 × 頻道 × 本次條件初步推薦</span></div><article v-for="(destination, index) in destinationMatches" :key="destination.city" class="destination-row"><span>0{{ index + 1 }}</span><div><small>{{ destination.channel.title }}</small><h4>{{ destination.city }}</h4><p>{{ destination.country }} · {{ destination.reason }}</p></div><b>{{ destination.match }}%</b></article></section>

          <aside class="booking-panel bento-panel"><p class="eyebrow">推薦的任務裝備</p><h3>先看適合原因，再決定要不要訂</h3><a v-for="slot in bookingSlots" :key="slot.provider" :href="slot.href" target="_blank" rel="sponsored noopener"><span><b>{{ slot.provider }}</b>{{ slot.label }}</span><strong>{{ slot.cta }} →</strong></a><small>合作連結示意。正式上線時將清楚標示聯盟關係。</small></aside>
        </div>

        <footer class="result-footer"><p>人格描述你的導航方式，頻道決定這趟想看見的地球。</p><div><button class="primary-button dark" type="button" @click="shareResult">分享我的探索人格</button><button class="text-button" type="button" @click="startQuiz">重新校準</button></div></footer>
      </section>

      <Transition name="toast"><div v-if="toast" class="toast-message" role="status">{{ toast }}</div></Transition>
    </main>
  `,
});
