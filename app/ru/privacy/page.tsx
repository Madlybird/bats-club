import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Политика конфиденциальности | Bats Club",
  description:
    "Как Bats Club обрабатывает ваши персональные данные. Сайт управляется Sinbiox Limited, Гонконг.",
}

export default function PrivacyRuPage() {
  return (
    <InfoPageShell title="Политика конфиденциальности">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club управляется компанией <span className="text-white font-semibold">Sinbiox Limited</span>, Гонконг. В этом документе описано, какие данные мы собираем и как их используем.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Какие данные мы собираем</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы собираем ваше имя, адрес электронной почты и адрес доставки для обработки заказа. Платёжные данные обрабатываются через Stripe и никогда не хранятся на наших серверах.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Как мы используем данные</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы используем данные для обработки заказов, отправки уведомлений о статусе доставки и сообщения о том, что фигурки из вашего вишлиста стали доступны.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Третьи стороны</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Для работы сайта мы используем следующие сторонние сервисы: <span className="text-white">Stripe</span> (платежи), <span className="text-white">Supabase</span> (база данных и хранилище) и <span className="text-white">Vercel</span> (хостинг). Мы никому не продаём ваши данные.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Удаление аккаунта</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Для удаления аккаунта напишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>
    </InfoPageShell>
  )
}
