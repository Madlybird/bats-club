import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Условия использования | Bats Club",
  description:
    "Условия использования Bats Club. Сайт управляется Sinbiox Limited, Гонконг.",
}

export default function TermsRuPage() {
  return (
    <InfoPageShell title="Условия использования">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club управляется компанией <span className="text-white font-semibold">Sinbiox Limited</span>, Гонконг. Оформляя заказ, вы соглашаетесь с условиями ниже.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Подлинность</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Все фигурки — оригинальные японские релизы из одной частной коллекции. Никаких реплик, бутлегов или перепродаж от третьих лиц.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Заказы и возвраты</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Все заказы являются окончательными. Если товар пришёл повреждённым, напишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          в течение 14 дней после получения посылки, приложив фото повреждений.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Доставка</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы доставляем только в поддерживаемые регионы — полный список в разделе <a href="/ru/faq" className="text-[#ff2d78] hover:opacity-80 transition-opacity">FAQ</a>. Заказы в неподдерживаемые регионы не могут быть выполнены.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Оплата и валюта</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Оплата обрабатывается безопасно через Stripe в долларах США. Цены указаны в USD; приблизительные суммы в местной валюте (если показаны) даны только для справки и могут немного отличаться от итоговой суммы списания вашим банком.
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
    </InfoPageShell>
  )
}
