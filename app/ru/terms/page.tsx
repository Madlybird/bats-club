import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Условия использования | Bats Club",
  description:
    "Условия использования Bats Club. Сайт управляется SINBIOX Limited.",
}

export default function TermsRuPage() {
  return (
    <InfoPageShell title="Условия использования">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club управляется компанией <span className="text-white font-semibold">SINBIOX Limited</span>. Оформляя заказ, вы соглашаетесь с условиями ниже.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Подлинность</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Все фигурки — оригинальные японские релизы из одной частной коллекции. Никаких реплик, бутлегов или перепродаж от третьих лиц.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Доставка</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы доставляем только в поддерживаемые регионы. Максимум 3 фигурки в одном заказе. Стоимость зависит от направления и количества — полный прайс в <a href="/ru/faq" className="text-[#ff2d78] hover:opacity-80 transition-opacity">FAQ</a>. Ориентировочный срок доставки — 14–28 рабочих дней с трек-номером. Заказы в неподдерживаемые регионы возвращаются в полном объёме.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Таможенные пошлины и налоги</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Международные заказы могут облагаться таможенными пошлинами, импортными налогами и сборами страны назначения. Все эти расходы несёт получатель. Bats Club не контролирует эти сборы и не может предсказать их размер. Оформляя заказ, вы принимаете ответственность за возможные таможенные расходы. Если посылка будет возвращена нам из-за неоплаченных таможенных пошлин, стоимость первоначальной доставки возврату не подлежит.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Заказы и возвраты</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Все фигурки — уникальные единичные экземпляры. После оформления заказ нельзя изменить. Возвраты принимаются только для фигурок, повреждённых при доставке, в течение 14 дней после получения — см. <a href="/ru/returns" className="text-[#ff2d78] hover:opacity-80 transition-opacity">Политику возврата</a>.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Состояние товара</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Каждая фигурка — подержанная, из частной японской коллекции 1990–2000-х годов. Состояние указано на странице каждого товара: Идеал, Почти идеал, Хорошее, Среднее или Плохое. Оформляя заказ, вы принимаете указанное состояние.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Ограничения по заказу</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Максимум 3 фигурки в одном заказе. Если вам нужно больше 3, оформите несколько заказов или свяжитесь с{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Цены и наличие</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Все цены указаны в долларах США и могут быть изменены без предварительного уведомления. Цена фиксируется в момент оформления заказа. Наличие обновляется в реальном времени — проданные фигурки безвозвратно удаляются из магазина. Мы оставляем за собой право отменить заказ при ошибке в цене с полным возвратом средств.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Оплата и валюта</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Оплата обрабатывается безопасно через Stripe в долларах США. Цены указаны в USD; приблизительные суммы в местной валюте (если показаны) даны только для справки и могут немного отличаться от итоговой суммы списания вашим банком.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Применимое право</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Настоящие условия регулируются правом Специального административного района Гонконг. Все споры рассматриваются в юрисдикции Гонконга.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Изменения условий</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы можем изменить условия в любое время. Актуальная версия всегда доступна по адресу{" "}
          <a href="/ru/terms" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            batsclub.com/terms
          </a>
          . Продолжая использовать сайт, вы соглашаетесь с обновлёнными условиями.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Контакты</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Вопросы по условиям? Напишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>

      <section>
        <p className="text-white/40 text-xs leading-relaxed">Последнее обновление: Апрель 2026</p>
      </section>
    </InfoPageShell>
  )
}
