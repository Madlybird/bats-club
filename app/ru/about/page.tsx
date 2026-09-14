import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "О нас",
  description:
    "Bats Club: публичный архив и студия под управлением SINBIOX, художника и коллекционера. Не открытый маркетплейс.",
  alternates: {
    canonical: "https://batsclub.com/ru/about",
    languages: {
      en: "https://batsclub.com/about",
      ru: "https://batsclub.com/ru/about",
      ja: "https://batsclub.com/jp/about",
      "x-default": "https://batsclub.com/about",
    },
  },
}

export default function AboutRuPage() {
  return (
    <InfoPageShell title="О Bats Club">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club: публичный архив и студия под управлением SINBIOX, художника и коллекционера. То, что начиналось как частная коллекция редких аниме-фигурок, теперь включает оригинальный арт, артбуки и коллекционные карточки: всё найденное, сохранённое или созданное одним и тем же человеком.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Что такое Архив</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          В Архиве собран полный каталог: каждая фигурка, которую задокументировала коллекция, независимо от того, продаётся она сейчас или хранится как справочный экземпляр, а скоро к ним присоединятся книги и карточки из той же коллекции. В нём есть фото, заметки о состоянии, детали серии и персонажа для по-настоящему редких фигурок, многие из которых сняты с производства 15–25 лет назад. Пролистывая Архив, вы пролистываете историю коллекционирования.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Что такое Студия</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Студия объединяет оригинальный арт от SINBIOX: постеры, принты, открытки и зины, созданные, а не собранные. Она стоит рядом с Архивом, а не внутри него. Один человек и два способа добавлять что-то в мир.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Не маркетплейс</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Club не является открытым маркетплейсом. Каждая фигурка в Магазине продаётся напрямую SINBIOX, который собрал архив, на условиях наших{" "}
          <a href="/ru/terms" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            Условий использования
          </a>
          . Здесь нет других продавцов, комиссионной продажи или сторонних объявлений. Магазин показывает только то, что сейчас продаётся из этой единственной коллекции.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Как работает Магазин</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Когда фигурка из коллекции готова к продаже, она выставляется с оценкой состояния (Идеал, Почти идеал, Хорошее, Среднее или Плохое) и собственными оригинальными фото, сделанными SINBIOX. Каждое объявление: единичный уникальный экземпляр. После продажи фигурка переходит в Архив со статусом "продано" и остаётся там как запись. У арта, книг и карточек свои условия состояния и доставки, они описаны в соответствующих разделах. Если посылка приходит повреждённой, порядок действий описан в нашей{" "}
          <a href="/ru/returns" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            Политике возврата
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Почему именно эта коллекция</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Пять лет поиска означают, что подборка смещена в сторону редкого: фигурки, снятые с производства десятилетия назад, ограниченные тиражи, экземпляры, которые редко всплывают даже на площадках перепродажи. Архив строится ради глубины: он документирует и в конечном счёте передаёт в руки коллекционеров фигурки, которые для них важны, сохраняя их в обороте.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Кто управляет Bats Club</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Club управляется компанией SINBIOX Limited, зарегистрированной в Гонконге. Оплата обрабатывается безопасно через Stripe.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Контакты</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Вопросы о фигурке, заказе или самой коллекции? Пишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          . Отвечаем в течение 2 рабочих дней.
        </p>
      </section>
    </InfoPageShell>
  )
}
