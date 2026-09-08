// Self-contained i18n for the /art section (mirrors the lib/articleI18n.ts
// pattern — keeps ~25 art strings out of the 1000-line lib/dict.ts). The only
// art string that lives in dict.ts is `nav_art`, because <Navbar> reads dict.

export type ArtLocale = "en" | "ru" | "jp"

export interface ArtStrings {
  page_title: string
  page_desc: string
  heading: string           // the <h1> — lowercase, matches /archive style
  filter_all: string
  sort_newest: string
  sort_price_asc: string
  sort_price_desc: string
  search_ph: string
  results: string
  clear_search: string
  empty_title: string
  empty_sub: string
  badge_new: string
  badge_sold_out: string
  breadcrumb: string
  add_to_cart: string
  already_in_cart: string
  buy_now: string
  view_cart: string
  description: string
  details: string
  in_stock: string          // contains "{n}"
  last_one: string
  sold_out_note: string
  shipping_note: string
  spec_type: string
  spec_series: string
  spec_year: string
  spec_size: string
  spec_material: string
  spec_edition: string
  spec_availability: string
  mature_badge: string
  mature_reveal: string
  zoom_hint: string
}

export const ART_I18N: Record<ArtLocale, ArtStrings> = {
  en: {
    page_title: "Art",
    page_desc: "Original art by SINBIOX — posters, prints, postcards, stickers, canvas and zines. Ships worldwide.",
    heading: "art",
    filter_all: "All",
    sort_newest: "Newest",
    sort_price_asc: "Price: low to high",
    sort_price_desc: "Price: high to low",
    search_ph: "Search art…",
    results: "results",
    clear_search: "Clear search",
    empty_title: "Nothing here yet",
    empty_sub: "New work is added regularly — check back soon.",
    badge_new: "New",
    badge_sold_out: "Sold out",
    breadcrumb: "Art",
    add_to_cart: "Add to Cart",
    already_in_cart: "Already in cart",
    buy_now: "Buy Now",
    view_cart: "View Cart →",
    description: "Description",
    details: "Details",
    in_stock: "{n} in stock",
    last_one: "1 available — last one",
    sold_out_note: "Sold out.",
    shipping_note: "Ships worldwide · rolled in a tube or flat with a board · 14–28 working days",
    spec_type: "Type",
    spec_series: "Series",
    spec_year: "Year",
    spec_size: "Size",
    spec_material: "Material",
    spec_edition: "Edition",
    spec_availability: "Availability",
    mature_badge: "18+",
    mature_reveal: "Tap to reveal",
    zoom_hint: "Click to zoom",
  },
  ru: {
    page_title: "Арт",
    page_desc: "Оригинальный арт SINBIOX — постеры, принты, открытки, стикеры, холсты и зины. Доставка по миру.",
    heading: "арт",
    filter_all: "Все",
    sort_newest: "Новые",
    sort_price_asc: "Цена: по возрастанию",
    sort_price_desc: "Цена: по убыванию",
    search_ph: "Поиск по арту…",
    results: "результатов",
    clear_search: "Сбросить поиск",
    empty_title: "Пока пусто",
    empty_sub: "Новые работы добавляются регулярно — загляните позже.",
    badge_new: "Новое",
    badge_sold_out: "Продано",
    breadcrumb: "Арт",
    add_to_cart: "В корзину",
    already_in_cart: "Уже в корзине",
    buy_now: "Купить сейчас",
    view_cart: "Корзина →",
    description: "Описание",
    details: "Характеристики",
    in_stock: "В наличии: {n}",
    last_one: "Осталась 1 шт.",
    sold_out_note: "Продано.",
    shipping_note: "Доставка по миру · в тубусе или плоско с подложкой · 14–28 рабочих дней",
    spec_type: "Тип",
    spec_series: "Серия",
    spec_year: "Год",
    spec_size: "Размер",
    spec_material: "Материал",
    spec_edition: "Тираж",
    spec_availability: "Наличие",
    mature_badge: "18+",
    mature_reveal: "Нажмите, чтобы показать",
    zoom_hint: "Нажмите для увеличения",
  },
  jp: {
    page_title: "アート",
    page_desc: "SINBIOX のオリジナルアート — ポスター、プリント、ポストカード、ステッカー、キャンバス、 zine。海外発送可。",
    heading: "アート",
    filter_all: "すべて",
    sort_newest: "新着順",
    sort_price_asc: "価格が安い順",
    sort_price_desc: "価格が高い順",
    search_ph: "アートを検索…",
    results: "件",
    clear_search: "検索をクリア",
    empty_title: "まだ作品がありません",
    empty_sub: "新作は随時追加されます。またご覧ください。",
    badge_new: "新着",
    badge_sold_out: "売り切れ",
    breadcrumb: "アート",
    add_to_cart: "カートに追加",
    already_in_cart: "すでにカートにあります",
    buy_now: "今すぐ購入",
    view_cart: "カートを見る →",
    description: "説明",
    details: "詳細",
    in_stock: "在庫 {n} 点",
    last_one: "残り1点",
    sold_out_note: "売り切れ。",
    shipping_note: "海外発送 · 筒または板入れ平梱包 · 14〜28営業日",
    spec_type: "種類",
    spec_series: "シリーズ",
    spec_year: "年",
    spec_size: "サイズ",
    spec_material: "素材",
    spec_edition: "エディション",
    spec_availability: "在庫",
    mature_badge: "18+",
    mature_reveal: "タップして表示",
    zoom_hint: "クリックで拡大",
  },
}
