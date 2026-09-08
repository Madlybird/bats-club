import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Политика возврата",
  description:
    "Политика возврата Bats Club. Возвраты принимаются для фигурок, повреждённых при доставке, в течение 14 дней. Сайт управляется SINBIOX Limited.",
  alternates: {
    canonical: "https://batsclub.com/ru/returns",
    languages: {
      en: "https://batsclub.com/returns",
      ru: "https://batsclub.com/ru/returns",
      ja: "https://batsclub.com/jp/returns",
      "x-default": "https://batsclub.com/returns",
    },
  },
}

export default function ReturnsRuPage() {
  return (
    <InfoPageShell title="Политика возврата">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club управляется компанией <span className="text-white font-semibold">SINBIOX Limited</span>. В этом документе описано, когда и как можно оформить возврат.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Срок возврата</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Запрос на возврат можно подать в течение 14 дней с момента получения посылки.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Что мы принимаем</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы принимаем возвраты только для фигурок, повреждённых при доставке.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Что мы не принимаем</h2>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-1">
          <li>Возвраты из-за состояния, указанного на странице товара</li>
          <li>Запросы на возврат, поданные позже 14 дней после получения</li>
          <li>Обмены</li>
        </ul>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Арт</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Политика на этой странице применяется к арту (<a href="/ru/art" className="text-[#ff2d78] hover:opacity-80 transition-opacity">раздел «Арт»</a>) со следующими уточнениями:
        </p>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
          <li>Арт продаётся как новый, напрямую от художника. Возврат принимается только для работ, повреждённых при доставке или с производственным дефектом, при обращении в течение 14 дней после получения, с видео распаковки, соответствующим требованиям на этой странице.</li>
          <li>Не являются браком и не подлежат возврату: незначительные отличия в цвете, подрезке или отделке печатных работ; небольшие расхождения между изображением на экране и напечатанной работой.</li>
          <li>Возврат «передумал» и обмен не принимаются.</li>
          <li>Для одобренных возвратов стоимость обратной доставки оплачиваем мы. Возврат средств производится в течение 5–10 рабочих дней на исходный способ оплаты.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Как оформить возврат</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Напишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          номер заказа, чёткие фотографии повреждений и краткое описание. Мы отвечаем в течение 2 рабочих дней.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Требование к видео распаковки</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Для защиты обеих сторон в случае повреждений при транспортировке мы просим покупателей записывать видео распаковки. Видео должно быть:
        </p>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
          <li>Непрерывным, без монтажа (один дубль, без склеек)</li>
          <li>Чётко показывать этикетку с вашим адресом до вскрытия посылки</li>
          <li>Полностью фиксировать процесс распаковки от запечатанной коробки до содержимого</li>
        </ul>
        <p className="text-white/60 text-sm leading-relaxed mt-3">
          Возвраты по причине повреждений при транспортировке принимаются только при наличии видео распаковки, соответствующего этим требованиям.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mt-3">
          Также мы не принимаем возвраты:
        </p>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
          <li>За состояние, которое было указано в описании или видно на фото (потёртости, износ коробки и т.д.)</li>
          <li>За возрастные изменения материалов: хрупкость пластика или износ, связанные с возрастом винтажных изделий (10–20+ лет)</li>
          <li>За запечатанные товары (MISB), у которых покупатель нарушил заводские пломбы</li>
        </ul>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Повреждения при доставке и ответственность перевозчика</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Club не несёт ответственности за повреждения, возникшие по вине почтовой службы или курьера во время доставки. Сюда относятся помятая или сломанная внешняя коробка, грубое или небрежное обращение при доставке и подобные ситуации, которые происходят после того, как посылка отправлена от нас. Ответственность за обращение с посылкой и её состояние во время транспортировки лежит на службе доставки, а не на Bats Club.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mt-3">
          По всем вопросам и претензиям, связанным с такими повреждениями, необходимо обращаться напрямую в почтовую службу или курьерскую компанию, так как именно они отвечают за посылку, пока она находится у них, и рассматривают подобные обращения по своим правилам.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Обратная доставка</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Для одобренных возвратов стоимость обратной доставки оплачиваем мы.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Возврат средств</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Возврат средств производится в течение 5–10 рабочих дней на исходный способ оплаты. Стоимость доставки не возвращается, кроме случаев, когда заказ отменён до отправки.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Комиссия за возврат</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы не взимаем комиссии за возврат товара.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Контакты</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Вопросы? Напишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>
    </InfoPageShell>
  )
}
