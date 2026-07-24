export type SitePageId = 'about' | 'methodology' | 'contact' | 'privacy' | 'affiliate' | 'not-found';

export interface SitePageSection {
  title: string;
  body: string[];
  bullets?: string[];
}

export interface SitePageLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface SitePage {
  id: SitePageId;
  eyebrow: string;
  title: string;
  lead: string;
  description: string;
  updatedAt?: string;
  highlights: string[];
  sections: SitePageSection[];
  links?: SitePageLink[];
  note?: string;
}

export const sitePages: Record<SitePageId, SitePage> = {
  about: {
    id: 'about',
    eyebrow: 'ABOUT TRIP SYNC',
    title: '讓旅行建議先理解你，再推薦地點。',
    lead: 'TRIP SYNC 是一個由獨立創作者 Chien-Chien 維護的旅行人格測驗與全球行程規劃工具。',
    description: '關於 TRIP SYNC 的使命、內容原則與目前提供的功能。',
    updatedAt: '2026-07-24',
    highlights: ['獨立開發', '180 個目的地', '不需登入'],
    sections: [
      {
        title: '我們想解決什麼',
        body: [
          '同一個熱門目的地，不會適合每一個人。有人需要完整資訊才安心，有人則希望保留臨時改變方向的空間。',
          'TRIP SYNC 先理解你面對陌生、風險與變動時的導航方式，再把當次旅行重點、預算、月份與避雷條件一起放進推薦。',
        ],
      },
      {
        title: '你可以在這裡做什麼',
        body: [
          '完成 7 個情境題，取得四種旅行導航人格之一；再選擇旅宿、美食、城市、自然、文化、娛樂或交通等任務頻道。',
          '規劃器會依出發地、天數、預算與旅行限制，從目前的目的地資料庫中篩選候選地點，並產生可以繼續調整的行程草稿。',
        ],
      },
      {
        title: '我們的內容原則',
        body: [
          '推薦的目標是幫助使用者做決定，不是把每個目的地包裝成人人適合。',
        ],
        bullets: [
          '清楚寫出適合與不適合的條件。',
          '預算與交通時間採保守估算，並標示更新日期。',
          '推薦排序不因聯盟佣金高低而改變。',
          '不把趣味人格結果描述成心理診斷。',
        ],
      },
    ],
    links: [
      { label: '查看推薦方法', href: 'methodology' },
      { label: '聯絡與內容更正', href: 'contact' },
    ],
  },
  methodology: {
    id: 'methodology',
    eyebrow: 'HOW RECOMMENDATIONS WORK',
    title: '人格是導航方式，條件決定這趟怎麼走。',
    lead: '推薦分成兩層：先理解相對穩定的探索偏好，再加入這趟旅行的現實條件。',
    description: 'TRIP SYNC 的人格測驗、目的地資料與推薦排序方法。',
    updatedAt: '2026-07-24',
    highlights: ['人格與任務分層', '預算硬性篩選', '佣金不影響排序'],
    sections: [
      {
        title: '第一層：旅行導航人格',
        body: [
          '測驗參考 Big Five 五大人格中與旅行行為較相關的開放性、盡責性與外向性，並結合旅行情境中的新奇感與熟悉感偏好。',
          '四種結果是「安心靠岸型、安心探路型、彈性開路型、未知追光型」。它們是幫助理解旅行決策的趣味化標籤，不等同完整人格分類。',
        ],
      },
      {
        title: '第二層：本次旅行條件',
        body: [
          '人格不會直接決定你只能喜歡哪一種旅行。旅宿、美食、城市、自然、文化、娛樂與交通被設計成當次任務頻道，可以每趟重新選擇。',
          '月份、每日預算、天數、同行方式、節奏、怕水、怕曬、不愛走路或討厭排隊等條件，會進一步調整候選目的地。',
        ],
      },
      {
        title: '目的地怎麼排序',
        body: [
          '系統先排除超過使用者每日預算上限或交通門檻的目的地，再比較任務符合度、人格適配、季節、避雷條件、移動負擔與家庭友善度。',
          '目前資料庫包含 180 個目的地。每日預算是住宿、當地交通與一般餐食的規劃估值，不是即時報價，也不包含國際機票。',
        ],
      },
      {
        title: '限制與使用方式',
        body: [
          '旅遊規定、匯率、航班與票價都可能快速變動。結果適合用來縮小選擇範圍，但預訂前仍應查閱官方入境規定、交通營運資訊與商品條款。',
          '本測驗不是醫療或心理診斷工具，也不應用於人員篩選或重大人生決策。',
        ],
      },
    ],
    links: [
      { label: 'IPIP 公開人格研究資源', href: 'https://ipip.ori.org/', external: true },
      { label: '查看隱私說明', href: 'privacy' },
    ],
    note: '方法與資料仍會持續修正。若發現預算、月份或交通資訊不合理，歡迎提供來源協助更正。',
  },
  contact: {
    id: 'contact',
    eyebrow: 'CONTACT & CORRECTIONS',
    title: '合作、回饋與資料更正，都從這裡開始。',
    lead: 'TRIP SYNC 目前由獨立創作者維護。為避免蒐集不必要的個人資料，現階段以 GitHub 公開議題作為主要聯絡管道。',
    description: '聯絡 TRIP SYNC、回報資料錯誤或提出合作需求。',
    updatedAt: '2026-07-24',
    highlights: ['資料更正', '合作提案', '功能回饋'],
    sections: [
      {
        title: '資料與功能回報',
        body: [
          '請附上目的地名稱、需要修正的欄位、建議內容與可信的參考來源。請勿在公開議題中留下護照、訂單、電話或其他敏感個人資料。',
        ],
      },
      {
        title: '品牌與內容合作',
        body: [
          '歡迎旅遊平台、地方體驗、旅宿與旅遊內容創作者提出合作。任何付費或受贈內容都會清楚標示，不會假裝成獨立編輯推薦。',
        ],
      },
      {
        title: '回覆方式',
        body: [
          '公開資料修正會優先在 GitHub 議題回覆。正式合作聯絡信箱將在自訂網域啟用後補上。',
        ],
      },
    ],
    links: [
      { label: '前往 GitHub 提出問題', href: 'https://github.com/chienchien6/trip-sync-quiz/issues', external: true },
      { label: '查看聯盟揭露', href: 'affiliate' },
    ],
  },
  privacy: {
    id: 'privacy',
    eyebrow: 'PRIVACY POLICY',
    title: '只留下規劃所需的訊號。',
    lead: '目前版本不要求註冊，也不會把你的測驗答案或旅行條件傳送到 TRIP SYNC 的伺服器。',
    description: 'TRIP SYNC 如何處理測驗答案、瀏覽資料與外部連結。',
    updatedAt: '2026-07-24',
    highlights: ['不需帳號', '答案不會上傳', '目前無廣告追蹤'],
    sections: [
      {
        title: '測驗與規劃資料',
        body: [
          '你的答案、任務頻道、預算與避雷條件只保留在當次瀏覽器記憶體中，用於即時計算結果。重新整理或關閉頁面後，這些內容不會由本站保存。',
          '產生分享圖卡時，圖片在你的裝置瀏覽器內建立；使用系統分享功能時，後續處理由你的裝置與所選應用程式決定。',
        ],
      },
      {
        title: 'Cookie 與分析工具',
        body: [
          '目前 TRIP SYNC 沒有自行設定 Cookie，也沒有安裝廣告像素或第三方流量分析工具。若未來加入分析、會員或收藏功能，本頁會先更新資料用途與保存方式。',
        ],
      },
      {
        title: '網站託管與外部連結',
        body: [
          '網站目前由 GitHub Pages 託管，託管服務可能依其政策處理基本連線與安全紀錄。',
          '前往 Klook、KKday、Trip.com 或其他外部網站後，資料處理由各平台的隱私政策與 Cookie 設定規範。',
        ],
      },
      {
        title: '你的選擇',
        body: [
          '你可以不填寫任何可識別個人的資料，也可以隨時關閉頁面清除當次測驗狀態。請勿透過公開回報管道提交訂單、證件或付款資訊。',
        ],
      },
    ],
    links: [
      { label: 'GitHub 隱私權聲明', href: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement', external: true },
      { label: '聯絡我們', href: 'contact' },
    ],
  },
  affiliate: {
    id: 'affiliate',
    eyebrow: 'AFFILIATE DISCLOSURE',
    title: '推薦先看適不適合，再看能不能預訂。',
    lead: 'TRIP SYNC 未來可能透過聯盟連結取得佣金，但這不會增加使用者的購買價格，也不會改變目的地推薦排序。',
    description: 'TRIP SYNC 的聯盟行銷、商業合作與推薦獨立性說明。',
    updatedAt: '2026-07-24',
    highlights: ['清楚標示', '價格不加價', '排序不看佣金'],
    sections: [
      {
        title: '目前狀態',
        body: [
          '目前網站提供的 Klook、KKday 與 Trip.com 連結是一般平台搜尋入口，尚未加入聯盟追蹤碼。取得合作資格後，相關連結會以「合作連結」清楚標示。',
        ],
      },
      {
        title: '聯盟連結如何運作',
        body: [
          '當你透過標示過的合作連結前往平台並完成符合條件的預訂，TRIP SYNC 可能從平台獲得佣金。通常不會因此增加你的付款金額。',
          '是否成立訂單、取消規則、價格與服務內容，都以合作平台及實際供應商的頁面為準。',
        ],
      },
      {
        title: '推薦獨立性',
        body: [
          '目的地排序先依預算、交通條件、旅行任務、人格適配、季節與避雷需求計算，不依平台佣金高低排列。',
          '付費合作、受贈體驗或邀請行程會在內容開頭明確標示。商業合作不保證獲得正面評價。',
        ],
      },
      {
        title: '預訂前請再次確認',
        body: [
          '票價、匯率、供應狀態與活動限制可能隨時變動。離開本站前往合作平台後，請再次確認日期、人數、語言、取消規則與保險需求。',
        ],
      },
    ],
    links: [
      { label: '查看推薦方法', href: 'methodology' },
      { label: '查看隱私說明', href: 'privacy' },
    ],
    note: '透明揭露不是附註，而是推薦系統的一部分。',
  },
  'not-found': {
    id: 'not-found',
    eyebrow: 'SIGNAL NOT FOUND / 404',
    title: '這個地球座標目前沒有資料。',
    lead: '連結可能已經移動，或這個頁面仍在建立中。你可以返回首頁重新開始探索。',
    description: '找不到指定頁面。',
    highlights: ['座標失效', '沒有遺失資料', '可以重新導航'],
    sections: [
      {
        title: '下一步',
        body: [
          '回到首頁進行旅行人格測驗，或查看我們如何產生目的地建議。',
        ],
      },
    ],
    links: [
      { label: '返回首頁', href: 'home' },
      { label: '查看推薦方法', href: 'methodology' },
    ],
  },
};

export const sitePageIds: SitePageId[] = ['about', 'methodology', 'contact', 'privacy', 'affiliate'];
