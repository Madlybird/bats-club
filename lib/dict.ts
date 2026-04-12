export interface Dict {
  // Hero
  hero_eyebrow: string
  hero_title: string
  hero_subtitle: string[]
  hero_body: string
  hero_cta: string
  hero_join: string
  // Floating tags
  tags: string[]
  // Value prop
  vp_heading1: string
  vp_heading2: string
  vp_body: string
  vp_stat1_label: string
  vp_stat1_desc: string
  vp_stat2_label: string
  vp_stat2_desc: string
  vp_stat3_label: string
  vp_stat3_desc: string
  // Recent
  recent_heading: string
  recent_link: string
  recent_for_sale: string
  // How it works
  how_heading: string
  how_steps: { num: string; title: string; body: string; cta: string; href: string }[]
  // CTA / Archive (homepage section)
  cta_heading1: string
  cta_heading2: string
  cta_body: string
  archive_heading: string
  archive_figures_suffix: string

  // ── Archive standalone page ──
  archive_page_title: string
  archive_collections: string
  archive_search_ph: string
  archive_series_label: string
  archive_character_label: string
  archive_mfg_label: string
  archive_results: string
  archive_clear: string
  archive_empty_title: string
  archive_empty_sub: string
  archive_clear_all_btn: string

  // ── Shop page ──
  shop_heading: string
  shop_listings_suffix: string
  shop_empty_title: string
  shop_empty_sub: string
  shop_popular_series: string
  shop_condition_label: string
  shop_sort_newest: string
  shop_sort_price_asc: string
  shop_sort_price_desc: string
  shop_condition_mint: string
  shop_condition_near_mint: string
  shop_condition_good: string
  shop_condition_fair: string
  shop_condition_poor: string
  shop_stock: string
  shop_add_to_cart: string
  shop_view_all: string
  shop_in_stock: string
  shop_out_of_stock: string
  shop_description: string
  shop_sold_by: string
  shop_figure_info: string
  shop_view_figure: string
  shop_view_cart: string
  shop_shipping_note: string
  shop_out_of_stock_btn: string

  // ── Articles page ──
  articles_heading: string
  articles_sub: string
  articles_empty_title: string
  articles_empty_sub: string
  articles_read_more: string

  // ── Figure detail page ──
  fig_breadcrumb: string
  fig_wishlisting: string
  fig_have: string
  fig_my_status: string
  fig_specs: string
  fig_from: string
  fig_for_sale: string
  fig_listings: string
  fig_view_shop: string
  fig_related: string
  fig_no_image: string
  fig_you_may_like: string
  fig_non_scale: string
  fig_spec_character: string
  fig_spec_series: string
  fig_spec_manufacturer: string
  fig_spec_scale: string
  fig_spec_year: string
  fig_spec_sculptor: string
  fig_spec_material: string
  fig_spec_description: string
  fig_status_have: string
  fig_status_wishlist: string
  fig_status_buy: string
  fig_added_wishlist: string
  fig_added_wishlist_cart: string
  fig_prize: string
  fig_unknown: string
  currency_approx: string

  // ── Navbar ──
  nav_archive: string
  nav_shop: string
  nav_articles: string
  nav_faq: string
  nav_signin: string
  nav_join: string

  // ── Login page ──
  login_heading: string
  login_subtitle: string
  login_email: string
  login_password: string
  login_submit: string
  login_loading: string
  login_no_account: string
  login_join_link: string

  // ── Profile page ──
  profile_collection: string
  profile_hunting: string
  profile_purchases: string
  profile_member_since: string
  profile_no_figures: string
  profile_browse_archive: string
  profile_edit: string
  profile_share: string
  profile_rarity_score: string
  profile_rarity_tooltip: string
  profile_rarity_percentile: string
  profile_stamp_card: string
  profile_stamp_tooltip: string
  profile_stamp_reward: string
  profile_stamps_left: string
  profile_public_wishlist: string
  profile_hunt_tooltip: string
  profile_hunt_empty: string
  profile_hunt_cta: string
  profile_collection_empty: string
  profile_collection_cta: string
  profile_also_hunting: string
  profile_view_all: string
  profile_for_sale: string
  profile_share_profile: string
  profile_series_dna_tooltip: string
  profile_stamp_claim: string
  profile_hunt_share: string

  // ── Share ──
  share_label: string

  // ── Article detail page ──
  article_published: string
  article_by: string
  article_figures_mentioned: string
  article_back: string

  // ── Cart page ──
  cart_heading: string
  cart_items_suffix: string
  cart_item_suffix: string
  cart_shipping_dest: string
  cart_country_ph: string
  cart_multi_discount: string
  cart_multi_discount_line: string
  cart_multi_discount_percent: string
  cart_upsell_banner: string
  cart_promo_heading: string
  cart_promo_ph: string
  cart_promo_apply: string
  cart_promo_remove: string
  cart_order_summary: string
  cart_subtotal: string
  cart_shipping: string
  cart_shipping_select: string
  cart_total: string
  cart_proceed: string
  cart_address_heading: string
  cart_field_fullname: string
  cart_field_addr1: string
  cart_field_addr2: string
  cart_field_city: string
  cart_field_state: string
  cart_field_zip: string
  cart_field_phone: string
  cart_pay: string
  cart_paying: string
  cart_stripe_note: string
  cart_empty_heading: string
  cart_empty_sub: string
  cart_go_shop: string

  // ── Register page ──
  register_heading: string
  register_subtitle: string
  register_name: string
  register_username: string
  register_username_hint: string
  register_email: string
  register_password: string
  register_password_hint: string
  register_submit: string
  register_loading: string
  register_has_account: string
  register_signin_link: string
}

// ─────────────────────────────────────────
// ENGLISH
// ─────────────────────────────────────────
export const en: Dict = {
  hero_eyebrow: "private collector archive",
  hero_title: "Bats Club.",
  hero_subtitle: ["rare anime", "figures"],
  hero_body: "10000+ authentic anime figures from a private collection",
  hero_cta: "enter the archive",
  hero_join: "join the club",
  tags: [
    "1990s Japan",
    "Scale figures",
    "Limited edition",
    "Private collector archive",
    "Kotobukiya",
    "Good Smile Company",
    "Wonder Festival",
    "Original figures",
    "Kaiyodo",
    "Limited edition",
    "Garage kit",
    "Wonder Festival exclusive",
  ],
  vp_heading1: "not a store.",
  vp_heading2: "an archive.",
  vp_body:
    "every figure comes from a real collection. no fakes. no resellers. only original japanese releases.",
  vp_stat1_label: "archived figures",
  vp_stat1_desc: "each figure catalogued with full data",
  vp_stat2_label: "anime series covered",
  vp_stat2_desc: "from 1990s classics to modern exclusives",
  vp_stat3_label: "years in collecting",
  vp_stat3_desc: "collector level selection and verification",
  recent_heading: "latest rare figures",
  recent_link: "view full archive →",
  recent_for_sale: "for sale",
  how_heading: "how it works",
  how_steps: [
    {
      num: "01",
      title: "explore the archive",
      body: "search rare anime figures by series, manufacturer, scale or year.",
      cta: "explore archive",
      href: "/archive",
    },
    {
      num: "02",
      title: "track your collection",
      body: "save your collection, build wishlist, discover rare pieces.",
      cta: "create account",
      href: "/register",
    },
    {
      num: "03",
      title: "buy when available",
      body: "buy directly when available. fixed shipping. verified condition.",
      cta: "view shop",
      href: "/shop",
    },
  ],
  cta_heading1: "find your",
  cta_heading2: "rare figure.",
  cta_body: "authentic figures. fixed shipping.",
  archive_heading: "full archive",
  archive_figures_suffix: "figures in the database",

  archive_page_title: "Archive",
  archive_collections: "Collections",
  archive_search_ph: "Search figures, characters, series…",
  archive_series_label: "Series",
  archive_character_label: "Character",
  archive_mfg_label: "Manufacturer",
  archive_results: "figures found",
  archive_clear: "Clear filters ×",
  archive_empty_title: "No figures found",
  archive_empty_sub: "Try adjusting your search or filters",
  archive_clear_all_btn: "Clear all filters",

  shop_heading: "Shop",
  shop_listings_suffix: "listings available",
  shop_empty_title: "No listings found",
  shop_empty_sub: "Try changing your filters",
  shop_popular_series: "Popular series",
  shop_condition_label: "Condition",
  shop_sort_newest: "Newest First",
  shop_sort_price_asc: "Price: Low to High",
  shop_sort_price_desc: "Price: High to Low",
  shop_condition_mint: "Mint",
  shop_condition_near_mint: "Near Mint",
  shop_condition_good: "Good",
  shop_condition_fair: "Fair",
  shop_condition_poor: "Poor",
  shop_stock: "Stock",
  shop_add_to_cart: "Add to Cart",
  shop_view_all: "View all",
  shop_in_stock: "in stock",
  shop_out_of_stock: "Out of stock",
  shop_description: "Description",
  shop_sold_by: "Sold by",
  shop_figure_info: "Figure Info",
  shop_view_figure: "View full figure details →",
  shop_view_cart: "View Cart →",
  shop_shipping_note: "+ shipping (calculated at checkout)",
  shop_out_of_stock_btn: "Out of Stock",

  articles_heading: "Articles",
  articles_sub: "Collector spotlights, reviews, and community content",
  articles_empty_title: "No articles published yet",
  articles_empty_sub: "Check back soon for collector content",
  articles_read_more: "Read More",

  fig_breadcrumb: "Archive",
  fig_wishlisting: "Wishlisting",
  fig_have: "Collectors Have It",
  fig_my_status: "My Collection Status",
  fig_specs: "Specifications",
  fig_from: "starting price",
  fig_for_sale: "for sale",
  fig_listings: "Available Listings",
  fig_view_shop: "View all →",
  fig_related: "Related Articles",
  fig_no_image: "No image available",
  fig_you_may_like: "You may also like",
  fig_non_scale: "Non-scale",
  fig_spec_character: "Character",
  fig_spec_series: "Series",
  fig_spec_manufacturer: "Manufacturer",
  fig_spec_scale: "Scale",
  fig_spec_year: "Year",
  fig_spec_sculptor: "Sculptor",
  fig_spec_material: "Material",
  fig_spec_description: "Description",
  fig_status_have: "Have It",
  fig_status_wishlist: "Wishlist",
  fig_status_buy: "Want to Buy",
  fig_added_wishlist: "Added to wishlist",
  fig_added_wishlist_cart: "Added to wishlist and cart!",
  fig_prize: "Prize figure",
  fig_unknown: "Unknown",
  currency_approx: "approx.",

  nav_archive: "Archive",
  nav_shop: "Shop",
  nav_articles: "Articles",
  nav_faq: "FAQ",
  nav_signin: "Sign In",
  nav_join: "Join Club",

  login_heading: "Sign In",
  login_subtitle: "Anime Figure Archive & Marketplace",
  login_email: "Email",
  login_password: "Password",
  login_submit: "Sign In",
  login_loading: "Signing in...",
  login_no_account: "Don't have an account?",
  login_join_link: "Join the Club",

  profile_collection: "Collection",
  profile_hunting: "Hunting",
  profile_purchases: "Purchases",
  profile_member_since: "Collector since",
  profile_no_figures: "No figures tracked yet",
  profile_browse_archive: "Browse Archive",
  profile_edit: "Edit profile",
  profile_share: "Copy link",
  profile_rarity_score: "Rarity Score",
  profile_rarity_tooltip: "Your rarity score is calculated based on how rare each figure in your collection is. The fewer collectors own a figure, the higher its rarity weight.",
  profile_rarity_percentile: "top {X}% of collectors",
  profile_stamp_card: "Stamp Card",
  profile_stamp_tooltip: "Every purchase earns 1 stamp. Collect 10 to unlock free worldwide shipping on your next order.",
  profile_stamp_reward: "Free worldwide shipping — applied automatically on order 10",
  profile_stamps_left: "{X} stamps left",
  profile_public_wishlist: "public wishlist",
  profile_hunt_tooltip: "Your wishlist is public so other collectors can see what you're looking for.",
  profile_hunt_empty: "Nothing on your hunt board yet. Add figures you're looking for!",
  profile_hunt_cta: "Explore Archive",
  profile_collection_empty: "Your collection is empty. Start exploring the archive!",
  profile_collection_cta: "Browse Archive",
  profile_also_hunting: "also hunting",
  profile_view_all: "View all",
  profile_for_sale: "for sale",
  profile_share_profile: "Share Profile",
  profile_series_dna_tooltip: "Auto-calculated from your collection, grouped by series and era. The hotter the series, the brighter it glows.",
  profile_stamp_claim: "Claim",
  profile_hunt_share: "Share",

  share_label: "Share",

  article_published: "Published",
  article_by: "by",
  article_figures_mentioned: "Figures Mentioned",
  article_back: "Back to Articles",

  cart_heading: "Cart",
  cart_items_suffix: "items",
  cart_item_suffix: "item",
  cart_shipping_dest: "Shipping Destination",
  cart_country_ph: "Search country…",
  cart_multi_discount: "Multi-item shipping discount: 40% off",
  cart_multi_discount_line: "Multi-item discount",
  cart_multi_discount_percent: "−40%",
  cart_upsell_banner: "Add one more figure and get 40% off shipping!",
  cart_promo_heading: "Promo Code",
  cart_promo_ph: "Enter code",
  cart_promo_apply: "Apply",
  cart_promo_remove: "Remove",
  cart_order_summary: "Order Summary",
  cart_subtotal: "Subtotal",
  cart_shipping: "Shipping",
  cart_shipping_select: "Select country",
  cart_total: "Total",
  cart_proceed: "Proceed to Checkout",
  cart_address_heading: "Shipping Address",
  cart_field_fullname: "Full Name *",
  cart_field_addr1: "Address Line 1 *",
  cart_field_addr2: "Address Line 2 (optional)",
  cart_field_city: "City *",
  cart_field_state: "State / Province *",
  cart_field_zip: "ZIP / Postal Code *",
  cart_field_phone: "Phone Number *",
  cart_pay: "Pay with Stripe",
  cart_paying: "Redirecting to Stripe...",
  cart_stripe_note: "Secure payment powered by Stripe",
  cart_empty_heading: "Your cart is empty",
  cart_empty_sub: "Browse the shop to find rare figures.",
  cart_go_shop: "Go to Shop",

  register_heading: "Create Account",
  register_subtitle: "Join the collector community",
  register_name: "Full Name",
  register_username: "Username",
  register_username_hint: "Letters, numbers, underscores, hyphens only",
  register_email: "Email",
  register_password: "Password",
  register_password_hint: "At least 6 characters",
  register_submit: "Join Bats Club",
  register_loading: "Creating account...",
  register_has_account: "Already have an account?",
  register_signin_link: "Sign In",
}

// ─────────────────────────────────────────
// RUSSIAN
// ─────────────────────────────────────────
export const ru: Dict = {
  hero_eyebrow: "архив частного коллекционера",
  hero_title: "Bats Club.",
  hero_subtitle: ["редкие аниме", "фигурки"],
  hero_body: "10000+ подлинных аниме фигурок из частной коллекции",
  hero_cta: "войти в архив",
  hero_join: "присоединиться",
  tags: [
    "Япония 1990-х",
    "Масштабные фигурки",
    "Нендороид",
    "Архив коллекционера",
    "Kotobukiya",
    "Good Smile Company",
    "Wonder Festival",
    "Оригинальные фигурки",
    "Kaiyodo",
    "Лимитированное издание",
    "Гаражный кит",
    "Эксклюзив Wonder Festival",
  ],
  vp_heading1: "не магазин.",
  vp_heading2: "архив.",
  vp_body:
    "каждая фигурка из реальной коллекции. никаких подделок. никаких перекупщиков. только оригинальные японские релизы.",
  vp_stat1_label: "фигурок в архиве",
  vp_stat1_desc: "каждая фигурка каталогизирована с полными данными",
  vp_stat2_label: "аниме-серий охвачено",
  vp_stat2_desc: "от классики 90-х до современных эксклюзивов",
  vp_stat3_label: "лет в коллекционировании",
  vp_stat3_desc: "отбор и верификация на уровне коллекционера",
  recent_heading: "последние редкие фигурки",
  recent_link: "весь архив →",
  recent_for_sale: "на продаже",
  how_heading: "как это работает",
  how_steps: [
    {
      num: "01",
      title: "исследуй архив",
      body: "ищи редкие аниме фигурки по серии, производителю, масштабу или году.",
      cta: "перейти в архив",
      href: "/archive",
    },
    {
      num: "02",
      title: "отслеживай коллекцию",
      body: "сохраняй коллекцию, создавай вишлист, открывай редкие экземпляры.",
      cta: "создать аккаунт",
      href: "/register",
    },
    {
      num: "03",
      title: "покупай когда доступно",
      body: "покупай напрямую когда доступно. фиксированная доставка. проверенное состояние.",
      cta: "в магазин",
      href: "/shop",
    },
  ],
  cta_heading1: "найди свою",
  cta_heading2: "редкую фигурку.",
  cta_body: "подлинные фигурки. фиксированная доставка.",
  archive_heading: "полный архив",
  archive_figures_suffix: "фигурок в базе данных",

  archive_page_title: "Архив",
  archive_collections: "Коллекции",
  archive_search_ph: "Поиск фигурок, персонажей, серий…",
  archive_series_label: "Серия",
  archive_character_label: "Персонаж",
  archive_mfg_label: "Производитель",
  archive_results: "найдено",
  archive_clear: "Сбросить фильтры ×",
  archive_empty_title: "Фигурки не найдены",
  archive_empty_sub: "Попробуйте изменить поисковый запрос или фильтры",
  archive_clear_all_btn: "Сбросить все фильтры",

  shop_heading: "Магазин",
  shop_listings_suffix: "листингов доступно",
  shop_empty_title: "Объявления не найдены",
  shop_empty_sub: "Попробуйте изменить фильтры",
  shop_popular_series: "Популярные серии",
  shop_condition_label: "Состояние",
  shop_sort_newest: "Сначала новые",
  shop_sort_price_asc: "Цена: по возрастанию",
  shop_sort_price_desc: "Цена: по убыванию",
  shop_condition_mint: "Идеал",
  shop_condition_near_mint: "Почти идеал",
  shop_condition_good: "Хорошее",
  shop_condition_fair: "Среднее",
  shop_condition_poor: "Плохое",
  shop_stock: "В наличии",
  shop_add_to_cart: "В корзину",
  shop_view_all: "Смотреть все",
  shop_in_stock: "в наличии",
  shop_out_of_stock: "Нет в наличии",
  shop_description: "Описание",
  shop_sold_by: "Продавец",
  shop_figure_info: "О фигурке",
  shop_view_figure: "Полная информация о фигурке →",
  shop_view_cart: "Корзина →",
  shop_shipping_note: "+ доставка (рассчитывается при оформлении заказа)",
  shop_out_of_stock_btn: "Нет в наличии",

  articles_heading: "Статьи",
  articles_sub: "Обзоры коллекционеров, рецензии и материалы сообщества",
  articles_empty_title: "Статьи ещё не опубликованы",
  articles_empty_sub: "Загляните позже за новыми материалами",
  articles_read_more: "Читать далее",

  fig_breadcrumb: "Архив",
  fig_wishlisting: "В вишлисте",
  fig_have: "Есть у коллекционеров",
  fig_my_status: "Мой статус в коллекции",
  fig_specs: "Характеристики",
  fig_from: "минимальная цена",
  fig_for_sale: "в продаже",
  fig_listings: "Активные объявления",
  fig_view_shop: "Все объявления →",
  fig_related: "Связанные статьи",
  fig_no_image: "Изображение недоступно",
  fig_you_may_like: "Вам также понравится",
  fig_non_scale: "Без масштаба",
  fig_spec_character: "Персонаж",
  fig_spec_series: "Серия",
  fig_spec_manufacturer: "Производитель",
  fig_spec_scale: "Масштаб",
  fig_spec_year: "Год",
  fig_spec_sculptor: "Скульптор",
  fig_spec_material: "Материал",
  fig_spec_description: "Описание",
  fig_status_have: "Есть у меня",
  fig_status_wishlist: "Вишлист",
  fig_status_buy: "Хочу купить",
  fig_added_wishlist: "Добавлено в вишлист",
  fig_added_wishlist_cart: "Добавлено в вишлист и корзину!",
  fig_prize: "Призовая фигурка",
  fig_unknown: "Неизвестно",
  currency_approx: "прибл.",

  nav_archive: "Архив",
  nav_shop: "Магазин",
  nav_articles: "Статьи",
  nav_faq: "FAQ",
  nav_signin: "Войти",
  nav_join: "Вступить",

  login_heading: "Вход",
  login_subtitle: "Архив аниме фигурок и маркетплейс",
  login_email: "Эл. почта",
  login_password: "Пароль",
  login_submit: "Войти",
  login_loading: "Вход...",
  login_no_account: "Нет аккаунта?",
  login_join_link: "Вступить в клуб",

  profile_collection: "Коллекция",
  profile_hunting: "Охота",
  profile_purchases: "Покупки",
  profile_member_since: "Коллекционер с",
  profile_no_figures: "Фигурки ещё не отслеживаются",
  profile_browse_archive: "Открыть архив",
  profile_edit: "Редактировать",
  profile_share: "Копировать ссылку",
  profile_rarity_score: "Редкость",
  profile_rarity_tooltip: "Ваш показатель редкости рассчитывается на основе того, насколько редка каждая фигурка в вашей коллекции. Чем меньше коллекционеров владеют фигуркой, тем выше её вес редкости.",
  profile_rarity_percentile: "топ {X}% коллекционеров",
  profile_stamp_card: "Карта штампов",
  profile_stamp_tooltip: "Каждая покупка даёт 1 штамп. Соберите 10 и получите бесплатную доставку по миру на следующий заказ.",
  profile_stamp_reward: "Бесплатная доставка по миру — применяется автоматически на 10-м заказе",
  profile_stamps_left: "осталось {X} штампов",
  profile_public_wishlist: "публичный вишлист",
  profile_hunt_tooltip: "Ваш вишлист публичный, чтобы другие коллекционеры могли видеть, что вы ищете.",
  profile_hunt_empty: "Вишлист пуст. Добавь фигурки которые ищешь!",
  profile_hunt_cta: "Исследовать архив",
  profile_collection_empty: "Коллекция пуста. Начни исследовать архив!",
  profile_collection_cta: "Открыть архив",
  profile_also_hunting: "тоже ищут",
  profile_view_all: "Смотреть все",
  profile_for_sale: "в продаже",
  profile_share_profile: "Поделиться профилем",
  profile_series_dna_tooltip: "Рассчитывается автоматически из вашей коллекции по сериям и эпохе.",
  profile_stamp_claim: "Получить",
  profile_hunt_share: "Поделиться",

  share_label: "Поделиться",

  article_published: "Опубликовано",
  article_by: "автор",
  article_figures_mentioned: "Упомянутые фигурки",
  article_back: "Назад к статьям",

  cart_heading: "Корзина",
  cart_items_suffix: "товара",
  cart_item_suffix: "товар",
  cart_shipping_dest: "Страна доставки",
  cart_country_ph: "Поиск страны…",
  cart_multi_discount: "Скидка на доставку: 40%",
  cart_multi_discount_line: "Скидка за несколько товаров",
  cart_multi_discount_percent: "−40%",
  cart_upsell_banner: "Добавь ещё одну фигурку и получи скидку 40% на доставку!",
  cart_promo_heading: "Промокод",
  cart_promo_ph: "Введите код",
  cart_promo_apply: "Применить",
  cart_promo_remove: "Удалить",
  cart_order_summary: "Сумма заказа",
  cart_subtotal: "Подытог",
  cart_shipping: "Доставка",
  cart_shipping_select: "Выберите страну",
  cart_total: "Итого",
  cart_proceed: "Перейти к оплате",
  cart_address_heading: "Адрес доставки",
  cart_field_fullname: "ФИО *",
  cart_field_addr1: "Адрес, строка 1 *",
  cart_field_addr2: "Адрес, строка 2 (необязательно)",
  cart_field_city: "Город *",
  cart_field_state: "Регион / Область *",
  cart_field_zip: "Почтовый индекс *",
  cart_field_phone: "Номер телефона *",
  cart_pay: "Оплатить через Stripe",
  cart_paying: "Переход к Stripe...",
  cart_stripe_note: "Безопасная оплата через Stripe",
  cart_empty_heading: "Корзина пуста",
  cart_empty_sub: "Загляните в магазин за редкими фигурками.",
  cart_go_shop: "В магазин",

  register_heading: "Создать аккаунт",
  register_subtitle: "Присоединяйся к сообществу коллекционеров",
  register_name: "Полное имя",
  register_username: "Имя пользователя",
  register_username_hint: "Буквы, цифры, подчёркивания, дефисы",
  register_email: "Эл. почта",
  register_password: "Пароль",
  register_password_hint: "Минимум 6 символов",
  register_submit: "Вступить в Bats Club",
  register_loading: "Создание аккаунта...",
  register_has_account: "Уже есть аккаунт?",
  register_signin_link: "Войти",
}

// ─────────────────────────────────────────
// JAPANESE
// ─────────────────────────────────────────
export const jp: Dict = {
  hero_eyebrow: "プライベートコレクターアーカイブ",
  hero_title: "Bats Club.",
  hero_subtitle: ["レアアニメ", "フィギュア"],
  hero_body: "プライベートコレクションから10,000点以上の本物のアニメフィギュア",
  hero_cta: "アーカイブへ",
  hero_join: "クラブに参加",
  tags: [
    "1990年代の日本",
    "スケールフィギュア",
    "限定版",
    "コレクターアーカイブ",
    "コトブキヤ",
    "グッドスマイルカンパニー",
    "ワンダーフェスティバル",
    "オリジナルフィギュア",
    "海洋堂",
    "限定版",
    "ガレージキット",
    "ワンフェス限定",
  ],
  vp_heading1: "ただの店ではない。",
  vp_heading2: "アーカイブだ。",
  vp_body:
    "すべてのフィギュアは実際のコレクションから。偽物なし。転売なし。日本のオリジナルリリースのみ。",
  vp_stat1_label: "登録フィギュア数",
  vp_stat1_desc: "すべてのフィギュアが完全データで記録済み",
  vp_stat2_label: "収録アニメシリーズ",
  vp_stat2_desc: "1990年代のクラシックから現代の限定品まで",
  vp_stat3_label: "コレクション歴（年）",
  vp_stat3_desc: "コレクターレベルの選定と鑑定",
  recent_heading: "最新のレアフィギュア",
  recent_link: "全アーカイブを見る →",
  recent_for_sale: "販売中",
  how_heading: "使い方",
  how_steps: [
    {
      num: "01",
      title: "アーカイブを探索",
      body: "シリーズ、メーカー、スケール、年代でレアフィギュアを検索。",
      cta: "アーカイブへ",
      href: "/archive",
    },
    {
      num: "02",
      title: "コレクションを管理",
      body: "コレクションを保存し、ウィッシュリストを作成してレア品を発見。",
      cta: "アカウント作成",
      href: "/register",
    },
    {
      num: "03",
      title: "在庫あり次第購入",
      body: "在庫があれば直接購入。送料固定。状態確認済み。",
      cta: "ショップへ",
      href: "/shop",
    },
  ],
  cta_heading1: "あなたの",
  cta_heading2: "レアフィギュアを探す。",
  cta_body: "本物のフィギュア。送料固定。",
  archive_heading: "全アーカイブ",
  archive_figures_suffix: "点のフィギュアがデータベースに登録",

  archive_page_title: "アーカイブ",
  archive_collections: "コレクション",
  archive_search_ph: "フィギュア、キャラクター、シリーズを検索…",
  archive_series_label: "シリーズ",
  archive_character_label: "キャラクター",
  archive_mfg_label: "メーカー",
  archive_results: "件見つかりました",
  archive_clear: "フィルターをリセット ×",
  archive_empty_title: "フィギュアが見つかりません",
  archive_empty_sub: "検索条件やフィルターを変えてみてください",
  archive_clear_all_btn: "すべてのフィルターをリセット",

  shop_heading: "ショップ",
  shop_listings_suffix: "件出品中",
  shop_empty_title: "出品が見つかりません",
  shop_empty_sub: "フィルターを変えてみてください",
  shop_popular_series: "人気シリーズ",
  shop_condition_label: "状態",
  shop_sort_newest: "新着順",
  shop_sort_price_asc: "価格：安い順",
  shop_sort_price_desc: "価格：高い順",
  shop_condition_mint: "ミント",
  shop_condition_near_mint: "ニアミント",
  shop_condition_good: "良い",
  shop_condition_fair: "普通",
  shop_condition_poor: "悪い",
  shop_stock: "在庫",
  shop_add_to_cart: "カートに追加",
  shop_view_all: "すべて見る",
  shop_in_stock: "在庫あり",
  shop_out_of_stock: "在庫切れ",
  shop_description: "説明",
  shop_sold_by: "販売者",
  shop_figure_info: "フィギュア情報",
  shop_view_figure: "フィギュアの詳細を見る →",
  shop_view_cart: "カートを見る →",
  shop_shipping_note: "+ 送料（注文時に計算）",
  shop_out_of_stock_btn: "在庫切れ",

  articles_heading: "記事",
  articles_sub: "コレクター紹介、レビュー、コミュニティコンテンツ",
  articles_empty_title: "まだ記事がありません",
  articles_empty_sub: "コレクターコンテンツをお楽しみに",
  articles_read_more: "続きを読む",

  fig_breadcrumb: "アーカイブ",
  fig_wishlisting: "ウィッシュリスト登録数",
  fig_have: "所有コレクター数",
  fig_my_status: "コレクションステータス",
  fig_specs: "スペック",
  fig_from: "最安値",
  fig_for_sale: "販売中",
  fig_listings: "出品一覧",
  fig_view_shop: "すべて見る →",
  fig_related: "関連記事",
  fig_no_image: "画像なし",
  fig_you_may_like: "おすすめ",
  fig_non_scale: "ノンスケール",
  fig_spec_character: "キャラクター",
  fig_spec_series: "シリーズ",
  fig_spec_manufacturer: "メーカー",
  fig_spec_scale: "スケール",
  fig_spec_year: "年",
  fig_spec_sculptor: "原型師",
  fig_spec_material: "素材",
  fig_spec_description: "説明",
  fig_status_have: "持っている",
  fig_status_wishlist: "ほしい",
  fig_status_buy: "買いたい",
  fig_added_wishlist: "ウィッシュリストに追加しました",
  fig_added_wishlist_cart: "ウィッシュリストとカートに追加しました！",
  fig_prize: "プライズフィギュア",
  fig_unknown: "不明",
  currency_approx: "約",

  nav_archive: "アーカイブ",
  nav_shop: "ショップ",
  nav_articles: "記事",
  nav_faq: "FAQ",
  nav_signin: "ログイン",
  nav_join: "参加する",

  login_heading: "ログイン",
  login_subtitle: "アニメフィギュアアーカイブ＆マーケットプレイス",
  login_email: "メールアドレス",
  login_password: "パスワード",
  login_submit: "ログイン",
  login_loading: "ログイン中...",
  login_no_account: "アカウントをお持ちでない方は",
  login_join_link: "クラブに参加",

  profile_collection: "コレクション",
  profile_hunting: "ハンティング",
  profile_purchases: "購入",
  profile_member_since: "コレクター歴",
  profile_no_figures: "フィギュアはまだ登録されていません",
  profile_browse_archive: "アーカイブを見る",
  profile_edit: "プロフィール編集",
  profile_share: "リンクをコピー",
  profile_rarity_score: "レアリティスコア",
  profile_rarity_tooltip: "レアリティスコアは、コレクション内の各フィギュアの希少性に基づいて計算されます。所有するコレクターが少ないほど、レアリティウェイトが高くなります。",
  profile_rarity_percentile: "コレクターのトップ{X}%",
  profile_stamp_card: "スタンプカード",
  profile_stamp_tooltip: "購入ごとに1スタンプ。10個集めると次の注文で世界無料配送が解放されます。",
  profile_stamp_reward: "世界無料配送 — 10回目の注文で自動適用",
  profile_stamps_left: "あと{X}スタンプ",
  profile_public_wishlist: "パブリックウィッシュリスト",
  profile_hunt_tooltip: "ウィッシュリストは公開されており、他のコレクターがあなたの探しているものを見ることができます。",
  profile_hunt_empty: "ハントボードは空です。探しているフィギュアを追加しよう！",
  profile_hunt_cta: "アーカイブを探索する",
  profile_collection_empty: "コレクションは空です。アーカイブを探索しよう！",
  profile_collection_cta: "アーカイブを見る",
  profile_also_hunting: "人も探しています",
  profile_view_all: "すべて見る",
  profile_for_sale: "販売中",
  profile_share_profile: "プロフィールをシェア",
  profile_series_dna_tooltip: "コレクションからシリーズと年代別に自動計算されます。",
  profile_stamp_claim: "受け取る",
  profile_hunt_share: "シェア",

  share_label: "シェア",

  article_published: "公開日",
  article_by: "著者",
  article_figures_mentioned: "登場フィギュア",
  article_back: "記事一覧に戻る",

  cart_heading: "カート",
  cart_items_suffix: "点",
  cart_item_suffix: "点",
  cart_shipping_dest: "配送先",
  cart_country_ph: "国を検索…",
  cart_multi_discount: "複数商品送料40%割引",
  cart_multi_discount_line: "複数商品割引",
  cart_multi_discount_percent: "−40%",
  cart_upsell_banner: "もう1つフィギュアを追加して送料40%オフ！",
  cart_promo_heading: "プロモコード",
  cart_promo_ph: "コードを入力",
  cart_promo_apply: "適用",
  cart_promo_remove: "削除",
  cart_order_summary: "注文内容",
  cart_subtotal: "小計",
  cart_shipping: "送料",
  cart_shipping_select: "国を選択",
  cart_total: "合計",
  cart_proceed: "チェックアウトへ",
  cart_address_heading: "配送先住所",
  cart_field_fullname: "お名前 *",
  cart_field_addr1: "住所1 *",
  cart_field_addr2: "住所2（任意）",
  cart_field_city: "市区町村 *",
  cart_field_state: "都道府県 *",
  cart_field_zip: "郵便番号 *",
  cart_field_phone: "電話番号 *",
  cart_pay: "Stripeで支払う",
  cart_paying: "Stripeへ移動中...",
  cart_stripe_note: "Stripeによる安全な決済",
  cart_empty_heading: "カートは空です",
  cart_empty_sub: "ショップでレアフィギュアを探してみましょう。",
  cart_go_shop: "ショップへ",

  register_heading: "アカウント作成",
  register_subtitle: "コレクターコミュニティに参加",
  register_name: "お名前",
  register_username: "ユーザー名",
  register_username_hint: "英数字、アンダースコア、ハイフンのみ",
  register_email: "メールアドレス",
  register_password: "パスワード",
  register_password_hint: "6文字以上",
  register_submit: "Bats Clubに参加",
  register_loading: "アカウント作成中...",
  register_has_account: "すでにアカウントをお持ちの方は",
  register_signin_link: "ログイン",
}
