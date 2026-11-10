// Self-contained i18n for the /books section (same pattern as lib/art-i18n.ts).
// The nav label lives in lib/dict.ts (`nav_books`) because <Navbar> reads dict.

export type BooksLocale = "en" | "ru" | "jp"

export interface BooksStrings {
  page_title: string
  page_desc: string
  heading: string
  intro: string
  filter_all: string
  filters: string
  filter_series: string
  filter_language: string
  filter_condition: string
  filter_price: string
  filter_any: string
  price_under_30: string
  price_30_60: string
  price_over_60: string
  presets: string
  preset_new: string
  preset_under_30: string
  preset_with_obi: string
  preset_japanese: string
  reset_filters: string
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
  one_copy: string
  sold_out_note: string
  shipping_note: string
  from_collection: string
  same_series: string
  spec_type: string
  spec_author: string
  spec_publisher: string
  spec_series: string
  spec_year: string
  spec_language: string
  spec_pages: string
  spec_size: string
  spec_binding: string
  spec_isbn: string
  spec_condition: string
  spec_includes: string
  spec_weight: string
  condition_names: Record<string, string>
  zoom_hint: string
}

export const BOOKS_I18N: Record<BooksLocale, BooksStrings> = {
  en: {
    page_title: "Books — Artbooks, Photobooks, Zines & Cards",
    page_desc:
      "Second-hand artbooks, photobooks, zines, magazines and art cards from a private anime collection. One copy each, graded condition, ships worldwide.",
    heading: "books",
    intro: "Artbooks, photobooks, zines and cards from my own collection. One copy of each.",
    filter_all: "All",
    filters: "Filters",
    filter_series: "Series",
    filter_language: "Language",
    filter_condition: "Condition",
    filter_price: "Price",
    filter_any: "Any",
    price_under_30: "Under $30",
    price_30_60: "$30–60",
    price_over_60: "Over $60",
    presets: "Quick picks",
    preset_new: "New arrivals",
    preset_under_30: "Under $30",
    preset_with_obi: "With obi",
    preset_japanese: "Japanese editions",
    reset_filters: "Reset filters",
    sort_newest: "Newest",
    sort_price_asc: "Price: low to high",
    sort_price_desc: "Price: high to low",
    search_ph: "Search title, artist, series…",
    results: "results",
    clear_search: "Clear search",
    empty_title: "Nothing here yet",
    empty_sub: "New books are added regularly — check back soon.",
    badge_new: "New",
    badge_sold_out: "Sold",
    breadcrumb: "Books",
    add_to_cart: "Add to cart",
    already_in_cart: "Already in your cart",
    buy_now: "Buy now",
    view_cart: "View cart",
    description: "Description",
    details: "Details",
    one_copy: "One copy",
    sold_out_note: "This copy has found a new home.",
    shipping_note: "Shipping is calculated by weight at checkout. Ships worldwide from Thailand, tracked.",
    from_collection: "From my collection",
    same_series: "From the same series",
    spec_type: "Type",
    spec_author: "Artist / author",
    spec_publisher: "Publisher",
    spec_series: "Series",
    spec_year: "Year",
    spec_language: "Language",
    spec_pages: "Pages",
    spec_size: "Size",
    spec_binding: "Binding",
    spec_isbn: "ISBN",
    spec_condition: "Condition",
    spec_includes: "Includes",
    spec_weight: "Shipping weight",
    condition_names: { New: "New", "Like New": "Like New", "Very Good": "Very Good", Good: "Good", Fair: "Fair" },
    zoom_hint: "Tap to zoom",
  },
  ru: {
    page_title: "Книги — артбуки, фотокниги, зины и карточки",
    page_desc:
      "Артбуки, фотокниги, зины, журналы и арт-карточки из частной аниме-коллекции. По одному экземпляру, с оценкой состояния, доставка по всему миру.",
    heading: "книги",
    intro: "Артбуки, фотокниги, зины и карточки из моей коллекции. Каждая в одном экземпляре.",
    filter_all: "Все",
    filters: "Фильтры",
    filter_series: "Серия",
    filter_language: "Язык",
    filter_condition: "Состояние",
    filter_price: "Цена",
    filter_any: "Любая",
    price_under_30: "До $30",
    price_30_60: "$30–60",
    price_over_60: "Дороже $60",
    presets: "Быстрый выбор",
    preset_new: "Новые поступления",
    preset_under_30: "До $30",
    preset_with_obi: "С оби",
    preset_japanese: "Японские издания",
    reset_filters: "Сбросить фильтры",
    sort_newest: "Сначала новые",
    sort_price_asc: "Цена: по возрастанию",
    sort_price_desc: "Цена: по убыванию",
    search_ph: "Название, художник, серия…",
    results: "результатов",
    clear_search: "Очистить поиск",
    empty_title: "Пока ничего нет",
    empty_sub: "Новые книги добавляются регулярно — загляните позже.",
    badge_new: "Новинка",
    badge_sold_out: "Продано",
    breadcrumb: "Книги",
    add_to_cart: "В корзину",
    already_in_cart: "Уже в корзине",
    buy_now: "Купить сейчас",
    view_cart: "Перейти в корзину",
    description: "Описание",
    details: "Характеристики",
    one_copy: "Один экземпляр",
    sold_out_note: "Этот экземпляр уже нашёл нового владельца.",
    shipping_note: "Доставка рассчитывается по весу при оформлении. Отправка из Таиланда по всему миру, с трекингом.",
    from_collection: "Из моей коллекции",
    same_series: "Из той же серии",
    spec_type: "Тип",
    spec_author: "Художник / автор",
    spec_publisher: "Издательство",
    spec_series: "Серия",
    spec_year: "Год",
    spec_language: "Язык",
    spec_pages: "Страниц",
    spec_size: "Размер",
    spec_binding: "Переплёт",
    spec_isbn: "ISBN",
    spec_condition: "Состояние",
    spec_includes: "Комплектация",
    spec_weight: "Вес для доставки",
    condition_names: { New: "Новое", "Like New": "Как новое", "Very Good": "Очень хорошее", Good: "Хорошее", Fair: "Удовлетворительное" },
    zoom_hint: "Нажмите, чтобы увеличить",
  },
  jp: {
    page_title: "本 — 画集・写真集・ZINE・カード",
    page_desc:
      "個人のアニメコレクションから、画集・写真集・ZINE・雑誌・アートカードを出品。すべて1点もの、状態表記あり、世界発送対応。",
    heading: "本",
    intro: "私のコレクションから、画集・写真集・ZINE・カードを。すべて1点ものです。",
    filter_all: "すべて",
    filters: "絞り込み",
    filter_series: "シリーズ",
    filter_language: "言語",
    filter_condition: "状態",
    filter_price: "価格",
    filter_any: "指定なし",
    price_under_30: "$30未満",
    price_30_60: "$30〜60",
    price_over_60: "$60以上",
    presets: "クイック選択",
    preset_new: "新着",
    preset_under_30: "$30未満",
    preset_with_obi: "帯付き",
    preset_japanese: "日本語版",
    reset_filters: "条件をリセット",
    sort_newest: "新着順",
    sort_price_asc: "価格の安い順",
    sort_price_desc: "価格の高い順",
    search_ph: "タイトル・作家・シリーズで検索…",
    results: "件",
    clear_search: "検索をクリア",
    empty_title: "まだ出品がありません",
    empty_sub: "定期的に追加しています。またお越しください。",
    badge_new: "新着",
    badge_sold_out: "売却済",
    breadcrumb: "本",
    add_to_cart: "カートに入れる",
    already_in_cart: "すでにカートに入っています",
    buy_now: "今すぐ購入",
    view_cart: "カートを見る",
    description: "説明",
    details: "詳細",
    one_copy: "1点もの",
    sold_out_note: "この本は新しい持ち主のもとへ旅立ちました。",
    shipping_note: "送料は重量に応じてチェックアウト時に計算されます。タイから追跡付きで世界発送。",
    from_collection: "私のコレクションから",
    same_series: "同じシリーズ",
    spec_type: "種類",
    spec_author: "作家・著者",
    spec_publisher: "出版社",
    spec_series: "シリーズ",
    spec_year: "発行年",
    spec_language: "言語",
    spec_pages: "ページ数",
    spec_size: "サイズ",
    spec_binding: "製本",
    spec_isbn: "ISBN",
    spec_condition: "状態",
    spec_includes: "付属品",
    spec_weight: "発送重量",
    condition_names: { New: "新品", "Like New": "未使用に近い", "Very Good": "非常に良い", Good: "良い", Fair: "可" },
    zoom_hint: "タップで拡大",
  },
}
