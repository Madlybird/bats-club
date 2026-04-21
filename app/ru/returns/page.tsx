import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Политика возврата | Bats Club",
  description:
    "Политика возврата Bats Club. Возвраты принимаются для фигурок, повреждённых при доставке, в течение 14 дней. Сайт управляется SINBIOX Limited.",
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
