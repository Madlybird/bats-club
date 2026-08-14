import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "О нас | Bats Club",
  description:
    "Bats Club — частный архив винтажных аниме фигурок, продаваемых напрямую коллекционером, который его собрал. Не открытый маркетплейс.",
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
          Bats Club — частный архив винтажных аниме фигурок: более 10 000 подлинных японских оригиналов 1990–2000-х годов, собранных за пять лет одним коллекционером. Каждая фигурка в архиве отобрана вручную по редкости, эпохе и состоянию. Всё это — из одной коллекции.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Что такое Архив</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Архив — это полный каталог: каждая фигурка, которую задокументировала коллекция, независимо от того, продаётся она сейчас или хранится как справочный экземпляр. В нём есть фото, заметки о состоянии, детали серии и персонажа для по-настоящему редких фигурок, многие из которых сняты с производства 15–25 лет назад. Просматривать Архив — значит листать историю коллекционирования.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Не маркетплейс</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Club — не открытый маркетплейс. Каждая фигурка в Магазине продаётся напрямую коллекционером, который собрал архив, на условиях наших{" "}
          <a href="/ru/terms" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            Условий использования
          </a>
          . Здесь нет других продавцов, комиссионной продажи или сторонних объявлений. Магазин показывает только то, что сейчас продаётся из этой единственной коллекции.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Как работает Магазин</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Когда фигурка из коллекции готова к продаже, она выставляется с оценкой состояния (Идеал, Почти идеал, Хорошее, Среднее или Плохое) и собственными оригинальными фото, сделанными коллекционером. Каждое объявление — единичный уникальный экземпляр. После продажи фигурка переходит в Архив со статусом "продано" и остаётся там как запись. Если посылка приходит повреждённой, порядок действий описан в нашей{" "}
          <a href="/ru/returns" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            Политике возврата
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Почему именно эта коллекция</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Пять лет поиска означают, что подборка смещена в сторону редкого: фигурки, снятые с производства десятилетия назад, ограниченные тиражи, экземпляры, которые редко всплывают даже на площадках перепродажи. Архив строится ради глубины — документирования и в конечном счёте передачи в руки коллекционеров фигурок, которые для них важны, сохраняя их в обороте.
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
