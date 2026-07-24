import type { Archetype, Channel, Choice, CompatibilityProfile, Question, TravelSettingOption } from '../types';

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const answer = (
  id: string,
  title: string,
  description: string,
  accent: string,
  scene: string,
  explorationScore: number,
  imageId = id,
): Choice => ({ id, title, description, accent, scene, image: assetPath(`/quiz-options/${imageId}.jpg`), explorationScore });

export const questions: Question[] = [
  {
    id: 1,
    chapter: '訊號 01・降落座標',
    prompt: '地球傳來三組限時座標，你會降落在哪裡？',
    help: '不用選最合理的，選第一眼真正讓你心動的。',
    scoreWeight: 1,
    choices: [
      answer('q1-a', '剛被發現的小城', '資料不多，但看起來充滿未知驚喜。', '#ef785f', '未知座標', 2),
      answer('q1-b', '熟悉城市＋陌生近郊', '經典與新鮮感，各占一半。', '#6f91be', '近軌支線', 1),
      answer('q1-c', '交通成熟的熱門城市', '資訊完整，出發前就能掌握大部分情況。', '#c89a42', '穩定星港', 0),
    ],
  },
  {
    id: 2,
    chapter: '訊號 02・航線準備',
    prompt: '出發前一週，你的地球航線通常準備到什麼程度？',
    help: '想像是真的明天出發，而不是理想中的自己。',
    scoreWeight: 1,
    choices: [
      answer('q2-a', '只先訂第一晚', '其他抵達後再決定，新發現比原定計畫重要。', '#ef785f', '自由變軌', 2),
      answer('q2-b', '重點先訂，其餘留白', '需要方向，也想保留一些驚喜。', '#6f91be', '彈性航線', 1),
      answer('q2-c', '全部先確認好', '交通、住宿與票券都安排好才放鬆。', '#c89a42', '完整導航', 0),
    ],
  },
  {
    id: 3,
    chapter: '訊號 03・陌生味覺',
    prompt: '看不懂菜單的地球餐館，店員推薦一道陌生料理，你會？',
    help: '這題沒有勇敢或膽小，只有讓你舒服的選擇。',
    scoreWeight: 1,
    choices: [
      answer('q3-a', '就點它', '旅行就是要試試沒吃過的。', '#ef785f', '未知味覺', 2),
      answer('q3-b', '先問清楚再嘗試', '了解口味與食材，覺得可以就出發。', '#6f91be', '快速掃描', 1),
      answer('q3-c', '選多人推薦的', '熟悉或資訊完整的選擇讓我更自在。', '#c89a42', '可靠樣本', 0),
    ],
  },
  {
    id: 4,
    chapter: '訊號 04・社交電量',
    prompt: '行程突然多出一個自由下午，你最想怎麼恢復能量？',
    help: '不是問你合不合群，而是哪種狀態真正能讓你充電。',
    scoreWeight: 0,
    choices: [
      answer('q4-a', '加入一場在地小團活動', '和新認識的人一起體驗，會讓我更有精神。', '#ef785f', '人群點火', 0),
      answer('q4-b', '找一兩位同行者散步', '有人分享，也保留舒服的交流距離。', '#6f91be', '小隊共振', 0),
      answer('q4-c', '自己找間店或公園待著', '不必說話的自由時間，才是真的休息。', '#c89a42', '獨處充電', 0),
    ],
  },
  {
    id: 5,
    chapter: '訊號 05・航線中斷',
    prompt: '原定列車停駛，星圖出現一條沒研究過的替代路線，你會？',
    help: '安全確認沒有問題，現在只差你做決定。',
    scoreWeight: 1,
    choices: [
      answer('q5-a', '走走看', '意外航線可能才是今天的亮點。', '#ef785f', '驚喜變軌', 2),
      answer('q5-b', '確認資訊再決定', '有一點可靠訊號，我就願意改走。', '#6f91be', '短暫校準', 1),
      answer('q5-c', '回到熟悉區域', '或請旅遊服務人員協助安排。', '#c89a42', '返回基地', 0),
    ],
  },
  {
    id: 6,
    chapter: '訊號 06・小隊改道',
    prompt: '同行者突然想去完全不同的地方，你通常會？',
    help: '想像你們都很期待自己的選擇，而且時間只夠完成一種安排。',
    scoreWeight: 0,
    choices: [
      answer('q6-a', '一起重排行程', '各自保留最在意的地方，再找出兩人都能接受的路線。', '#ef785f', '共同變軌', 0),
      answer('q6-b', '分頭探索再集合', '不必勉強同步，約好時間與地點就可以。', '#6f91be', '雙線任務', 0),
      answer('q6-c', '維持原本的主線', '新願望另外找空檔，先守住原本共同決定的安排。', '#c89a42', '主線守航', 0),
    ],
  },
  {
    id: 7,
    chapter: '訊號 07・地球日誌',
    prompt: '任務結束後，你最希望怎麼記錄這趟地球旅行？',
    help: '這句話會成為你的星際旅行日誌標題。',
    scoreWeight: 0.5,
    choices: [
      answer('q7-a', '去了很少人知道的地方', '未知與獨特，會讓我覺得這趟很值得。', '#ef785f', '地圖之外', 2, 'q1-a'),
      answer('q7-b', '經典與驚喜都有', '該看的有看到，也遇見幾個意外。', '#6f91be', '雙軌平衡', 1, 'q1-b'),
      answer('q7-c', '一路順暢、舒服沒踩雷', '安心與品質就是最好的回憶。', '#c89a42', '完美著陸', 0, 'q1-c'),
    ],
  },
];

export const archetypes: Archetype[] = [
  {
    id: 'anchor', label: '安心靠岸型', cosmicTitle: '星港定錨者', english: 'THE HARBOR ANCHOR',
    description: '你會先確認住宿、交通與安全感，再放心探索。熟悉感不是保守，而是讓大腦真正開始休假的基地。',
    innerLine: '先讓我確定今晚睡哪裡。', motive: '你的心理推力來自休息、恢復與降低不確定性。',
    routeAdvice: '先鎖定可靠住宿與主要交通，再從基地向外安排短距離探索。',
    bigFiveSummary: '你的答案顯示開放性偏穩健，對計畫與可預測性的需求較高。你不是拒絕新鮮，而是有了可靠基地後，更能放心享受探索。',
    min: 0, max: 3, imageIndex: 0, accent: '#d6a64b', deep: '#243d62', soft: '#edf1f6',
    traits: ['基地優先', '資訊完整', '品質安心'],
    stats: [{ label: '安定需求', value: 96 }, { label: '路線掌握', value: 88 }, { label: '未知容許', value: 38 }],
  },
  {
    id: 'soft', label: '安心探路型', cosmicTitle: '近軌偵察者', english: 'THE ORBIT SCOUT',
    description: '你以熟悉為基地，再加入剛剛好的新鮮感。想前進，但會先知道怎麼回來。',
    innerLine: '看起來很有趣，我先查一下怎麼回來。', motive: '你的心理推力來自安全範圍內的成長與發現。',
    routeAdvice: '以成熟城市為主軸，加入一段陌生近郊、在地活動或自由散步。',
    bigFiveSummary: '你的開放性與計畫傾向相當均衡：願意接近陌生事物，也會先建立必要資訊。這讓你特別適合「有主線、可探路」的旅行。',
    min: 4, max: 6, imageIndex: 1, accent: '#7395c8', deep: '#405b86', soft: '#edf1fa',
    traits: ['穩定主線', '小幅冒險', '進退有據'],
    stats: [{ label: '安定需求', value: 79 }, { label: '路線彈性', value: 68 }, { label: '未知容許', value: 61 }],
  },
  {
    id: 'flex', label: '彈性開路型', cosmicTitle: '變軌航行者', english: 'THE ORBIT SHIFTER',
    description: '你需要方向，但不需要每一步都固定。原本路線和新選項可以同時存在，計畫是工具，不是規則。',
    innerLine: '方向有就好，途中改一下也沒關係。', motive: '你的心理推力來自自主感、選擇權與當下發現。',
    routeAdvice: '只先預約不能錯過的項目，每天保留至少三分之一空白時間。',
    bigFiveSummary: '你的開放性偏高，同時保有實際的方向感。你願意嘗試新路線，但更重視自己能否隨情況調整，而不是毫無準備地冒險。',
    min: 7, max: 9, imageIndex: 2, accent: '#ef785f', deep: '#a74737', soft: '#fff0eb',
    traits: ['方向明確', '隨時變軌', '現場決定'],
    stats: [{ label: '自主導航', value: 96 }, { label: '路線彈性', value: 98 }, { label: '未知容許', value: 78 }],
  },
  {
    id: 'seek', label: '未知追光型', cosmicTitle: '星際先行者', english: 'THE LIGHT SEEKER',
    description: '未知帶來的興奮高於不安。你會被地圖沒有畫完的地方、陌生文化與稀有體驗吸引。',
    innerLine: '那道光是什麼？先去看看再說。', motive: '你的心理推力來自新奇、突破邊界與自我擴張。',
    routeAdvice: '選一個真正陌生的主題，保留臨場決定空間，同時設定最基本的安全回程點。',
    bigFiveSummary: '你的開放性與新奇需求較高，面對不確定時更容易先感到好奇。新文化、少見體驗與尚未完成的地圖，通常比熟悉流程更能驅動你。',
    min: 10, max: 12, imageIndex: 3, accent: '#8b62c5', deep: '#583a89', soft: '#f2ecfb',
    traits: ['未知優先', '新奇驅動', '邊界探索'],
    stats: [{ label: '新奇渴望', value: 99 }, { label: '臨場反應', value: 91 }, { label: '未知容許', value: 98 }],
  },
];

export const compatibilityProfiles: CompatibilityProfile[] = [
  {
    archetypeId: 'anchor',
    bestMatchId: 'soft',
    bestReason: '對方願意先確認回程與基本安排，也會帶你在安心範圍裡多看一點。',
    frictionMatchId: 'seek',
    frictionReason: '你需要可預期的基地，對方卻容易臨時追著新發現改道；住宿、回程與風險容忍度最容易不同步。',
    travelAgreement: '先固定住宿與主要交通，再安排一天自由分隊；所有臨時改道都保留明確集合點。',
  },
  {
    archetypeId: 'soft',
    bestMatchId: 'flex',
    bestReason: '你提供穩定主線，對方擅長在路上加入驚喜，兩個人很容易玩得剛剛好。',
    frictionMatchId: 'seek',
    frictionReason: '你願意探路，但仍需要可靠訊號；對方可能在資訊不足時就先出發，讓你來不及建立安全感。',
    travelAgreement: '每天只開放一個未知行程，出發前先約好最晚決定時間與撤退方案。',
  },
  {
    archetypeId: 'flex',
    bestMatchId: 'seek',
    bestReason: '對方負責發現地圖外的新訊號，你則能把靈感整理成真的走得完的路線。',
    frictionMatchId: 'anchor',
    frictionReason: '你把計畫當可調整的工具，對方把計畫當安心保證；臨時更動容易被理解成不可靠。',
    travelAgreement: '先標出不能更動的預約，其餘時段明確標成可變動，改道前讓彼此都有否決權。',
  },
  {
    archetypeId: 'seek',
    bestMatchId: 'flex',
    bestReason: '對方跟得上你的好奇心，也能在你追光追太遠時，把大家順利帶回主航線。',
    frictionMatchId: 'anchor',
    frictionReason: '你會因未知而興奮，對方則需要先降低不確定性；臨時邀請與沒做功課的路線最容易引發壓力。',
    travelAgreement: '共同守住住宿與回程底線，另外留一段各自探索時間，不要求對方參加每一次冒險。',
  },
];

export const channels: Channel[] = [
  {
    id: 'luna', member: 'LUNA', title: '棲息基地頻道', role: '旅宿・療癒・慢旅行', image: assetPath('/characters/luna.jpg'),
    accent: '#7caebf', deep: '#244e5c', soft: '#e4f0f2', description: '住得舒服，才有力氣喜歡一座城市。', tags: ['海景旅宿', '溫泉 SPA', '自由散步'],
    destinations: [
      { city: '馬德拉', country: '葡萄牙', match: 96, reason: '海景、溫和氣候與舒服的度假節奏。' },
      { city: '箱根', country: '日本', match: 93, reason: '溫泉、山景與成熟的移動服務。' },
      { city: '薩丁尼亞', country: '義大利', match: 91, reason: '清澈海岸、精品旅宿與悠閒餐桌。' },
    ],
    affiliateSlots: [
      { provider: 'Trip.com', label: '海景與溫泉旅宿', cta: '查看舒適住宿', href: 'https://www.trip.com/' },
      { provider: 'Klook', label: '機場接送與包車', cta: '安排無痛抵達', href: 'https://www.klook.com/' },
      { provider: 'KKday', label: 'SPA 與療癒體驗', cta: '保留充電時間', href: 'https://www.kkday.com/' },
    ],
  },
  {
    id: 'rin', member: 'RIN', title: '城市訊號頻道', role: '街區・咖啡・獨立店家', image: assetPath('/characters/rin.jpg'),
    accent: '#e86f5f', deep: '#31485a', soft: '#f8dfd8', description: '沿著城市的小訊號，拐進值得停留的巷子。', tags: ['城市散步', '獨立店家', '展覽咖啡'],
    destinations: [
      { city: '里斯本', country: '葡萄牙', match: 97, reason: '坡道巷弄、設計小店與有性格的街區。' },
      { city: '墨爾本', country: '澳洲', match: 94, reason: '咖啡文化、展覽與藏在街角的創意。' },
      { city: '哥本哈根', country: '丹麥', match: 91, reason: '設計、單車與適合慢慢走的城市尺度。' },
    ],
    affiliateSlots: [
      { provider: 'Klook', label: '城市交通與通票', cta: '先把移動搞定', href: 'https://www.klook.com/' },
      { provider: 'KKday', label: '街區與設計導覽', cta: '打開隱藏路線', href: 'https://www.kkday.com/' },
      { provider: 'Trip.com', label: '好逛區域住宿', cta: '住進靈感中心', href: 'https://www.trip.com/' },
    ],
  },
  {
    id: 'mika', member: 'MIKA', title: '地球味覺頻道', role: '市場・美食・料理', image: assetPath('/characters/mika.jpg'),
    accent: '#ed7563', deep: '#264d43', soft: '#f8e3d5', description: '用味道讀懂一座城市，比打卡更接近生活。', tags: ['市場巡禮', '美食散步', '料理體驗'],
    destinations: [
      { city: '那不勒斯', country: '義大利', match: 97, reason: '街頭味道、傳統餐桌與真誠的地方料理。' },
      { city: '墨西哥城', country: '墨西哥', match: 95, reason: '市場、小吃與層次豐富的當代餐飲。' },
      { city: '大阪', country: '日本', match: 92, reason: '選擇密集，從市場一路吃到深夜。' },
    ],
    affiliateSlots: [
      { provider: 'KKday', label: '市場與美食導覽', cta: '跟著在地人吃', href: 'https://www.kkday.com/' },
      { provider: 'Klook', label: '餐券與料理體驗', cta: '先訂不能錯過的', href: 'https://www.klook.com/' },
      { provider: 'Trip.com', label: '美食區域住宿', cta: '住在宵夜附近', href: 'https://www.trip.com/' },
    ],
  },
  {
    id: 'tyler', member: 'TYLER', title: '自然能量頻道', role: '山海・森林・潛水', image: assetPath('/characters/tyler.jpg'),
    accent: '#e7ad3f', deep: '#3f6757', soft: '#e8f0e9', description: '讓風、陽光與水，把身體的能量充回來。', tags: ['自然體驗', '山海森林', '潛水划船'],
    destinations: [
      { city: '南島', country: '紐西蘭', match: 98, reason: '湖泊、步道與適合不同體力的自然體驗。' },
      { city: '亞速爾群島', country: '葡萄牙', match: 95, reason: '火山、海洋與不需要極限體力的冒險。' },
      { city: '瓜納卡斯特', country: '哥斯大黎加', match: 91, reason: '森林、海岸與豐富的野生自然。' },
    ],
    affiliateSlots: [
      { provider: 'Klook', label: '自然與海洋活動', cta: '選一條自然支線', href: 'https://www.klook.com/' },
      { provider: 'KKday', label: '小團戶外體驗', cta: '跟著教練出發', href: 'https://www.kkday.com/' },
      { provider: 'Trip.com', label: '自然旅宿與租車', cta: '住近風景一點', href: 'https://www.trip.com/' },
    ],
  },
  {
    id: 'nora', member: 'NORA', title: '文明記憶頻道', role: '老城・故事・手作', image: assetPath('/characters/nora.jpg'),
    accent: '#a99bc4', deep: '#3f4056', soft: '#ece7f2', description: '收藏地方留下的故事，而不只是景點名稱。', tags: ['故事散步', '博物館', '工藝文化'],
    destinations: [
      { city: '布拉格', country: '捷克', match: 97, reason: '老城尺度、建築層次與容易沉浸的歷史。' },
      { city: '伊斯坦堡', country: '土耳其', match: 95, reason: '文明交會、工藝、茶與豐富的城市故事。' },
      { city: '京都', country: '日本', match: 92, reason: '成熟文化體驗與保存細緻的地方記憶。' },
    ],
    affiliateSlots: [
      { provider: 'KKday', label: '文化與手作體驗', cta: '把故事帶回家', href: 'https://www.kkday.com/' },
      { provider: 'Klook', label: '博物館與古蹟票券', cta: '打開文化路線', href: 'https://www.klook.com/' },
      { provider: 'Trip.com', label: '老城與歷史區住宿', cta: '住進故事附近', href: 'https://www.trip.com/' },
    ],
  },
  {
    id: 'timo', member: 'TIMO', title: '航線導航頻道', role: '交通 PASS・票券・彈性組合', image: assetPath('/characters/timo.jpg'),
    accent: '#4c7898', deep: '#30343a', soft: '#e4eaed', description: '先把移動整理好，把自由留給真正想玩的地方。', tags: ['交通 PASS', '快速通關', '彈性路線'],
    destinations: [
      { city: '蘇黎世', country: '瑞士', match: 96, reason: '交通準確、跨城容易，適合彈性收集風景。' },
      { city: '新加坡', country: '新加坡', match: 94, reason: '資訊清楚、移動簡單，短天數也能玩完整。' },
      { city: '維也納', country: '奧地利', match: 91, reason: '交通網完整，文化景點之間切換順暢。' },
    ],
    affiliateSlots: [
      { provider: 'Klook', label: '景點通票與快通', cta: '一次整理熱門點', href: 'https://www.klook.com/' },
      { provider: 'KKday', label: '順路一日遊', cta: '交給路線高手', href: 'https://www.kkday.com/' },
      { provider: 'Trip.com', label: '機票、鐵路與住宿', cta: '先把大件事訂好', href: 'https://www.trip.com/' },
    ],
  },
  {
    id: 'popo', member: 'POPO', title: '同行氣氛頻道', role: '親友・節慶・共同回憶', image: assetPath('/characters/popo.jpg'),
    accent: '#d9a441', deep: '#514138', soft: '#f5e4c7', description: '讓每個同行的人都被照顧，也一起留下名場面。', tags: ['親友旅行', '節慶活動', '共同回憶'],
    destinations: [
      { city: '巴塞隆納', country: '西班牙', match: 96, reason: '熱鬧、好分享，也容易安排多人一起玩的內容。' },
      { city: '奧蘭多', country: '美國', match: 93, reason: '主題樂園與團體活動密集，適合一起歡呼。' },
      { city: '魁北克城', country: '加拿大', match: 90, reason: '季節節慶與適合留下共同回憶的氛圍。' },
    ],
    affiliateSlots: [
      { provider: 'Klook', label: '樂園與團體套票', cta: '安排一起玩的', href: 'https://www.klook.com/' },
      { provider: 'KKday', label: '節慶與特色體驗', cta: '加入當地氣氛', href: 'https://www.kkday.com/' },
      { provider: 'Trip.com', label: '多人住宿與交通', cta: '把大家安頓好', href: 'https://www.trip.com/' },
    ],
  },
];

export const paceOptions: TravelSettingOption[] = [
  { id: 'slow', label: '慢慢走', description: '每天 1～2 個重點' },
  { id: 'flex', label: '保留彈性', description: '重點先訂，其餘留白' },
  { id: 'full', label: '多看一點', description: '有效率地安排整天' },
];

export const companionOptions: TravelSettingOption[] = [
  { id: 'solo', label: '自己出發', description: '依自己的節奏移動' },
  { id: 'pair', label: '兩人同行', description: '一起決定，也保留各自空間' },
  { id: 'group', label: '親友小隊', description: '需要照顧不同需求' },
  { id: 'family', label: '家庭旅行', description: '長輩或孩子也能舒服參與' },
];

export const budgetOptions: TravelSettingOption[] = [
  { id: 'value', label: '精打細算', description: '能省則省，該玩的不省' },
  { id: 'balanced', label: '平衡配置', description: '住宿、交通與體驗平均分配' },
  { id: 'experience', label: '體驗優先', description: '難得出發，值得就安排' },
];

export const avoidOptions = [
  { id: 'crowd', label: '大量人群' },
  { id: 'water', label: '水上活動' },
  { id: 'walk', label: '長時間步行' },
  { id: 'queue', label: '排隊等待' },
  { id: 'early', label: '太早起床' },
  { id: 'sun', label: '長時間曝曬' },
];
