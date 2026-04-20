import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Политика конфиденциальности | Bats Club",
  description:
    "Как Bats Club обрабатывает ваши персональные данные. Сайт управляется SINBIOX Limited.",
}

export default function PrivacyRuPage() {
  return (
    <InfoPageShell title="Политика конфиденциальности">
      <section>
        <p className="text-white/40 text-xs leading-relaxed">Последнее обновление: Апрель 2026</p>
      </section>

      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club управляется компанией <span className="text-white font-semibold">SINBIOX Limited</span>. В этой политике описано, какие данные мы собираем, как их используем и каковы ваши права.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">1. Какие данные мы собираем</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы собираем ваше имя, адрес электронной почты, адрес доставки, номер телефона, историю заказов и вишлист. Платёжные данные обрабатываются через Stripe и никогда не хранятся на наших серверах. Мы также собираем базовую аналитику: браузер, устройство и посещённые страницы.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">2. Как мы используем данные</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы используем данные для обработки заказов, отправки уведомлений о доставке и подтверждений заказов, уведомлений о появлении фигурок из вашего вишлиста, поддержки клиентов и улучшения сайта. Мы не продаём ваши данные.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">3. С кем мы делимся данными</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы передаём данные Stripe (обработка платежей), службам доставки (доставка заказов), нашему email-провайдеру (уведомления о заказах и доставке) и Google Analytics (анонимная статистика использования). Все третьи стороны связаны соглашениями о защите данных.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">4. Срок хранения данных</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Данные аккаунта и заказов хранятся пока аккаунт активен, а также 7 лет после закрытия для соблюдения налогового законодательства.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">5. Ваши права</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Вы имеете право на доступ, исправление, удаление, ограничение обработки и переносимость ваших данных, а также право отозвать согласие в любое время. Жители ЕЭЗ имеют дополнительные права по GDPR. Жители Калифорнии имеют права по CCPA. Мы не продаём персональные данные. Для реализации этих прав напишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">6. Безопасность данных</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы используем HTTPS, Stripe для платежей и внутренние средства контроля доступа для защиты ваших данных. Ни один метод передачи или хранения данных не может быть на 100% безопасным.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">7. Конфиденциальность детей</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Club предназначен для пользователей от 18 лет. Мы не собираем данные от несовершеннолетних. Если вы считаете, что несовершеннолетний предоставил нам данные, напишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          , и мы удалим их.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">8. Изменения политики</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Мы можем время от времени обновлять эту политику. О существенных изменениях мы сообщим по электронной почте. Актуальная версия всегда доступна по адресу{" "}
          <a href="/ru/privacy" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            batsclub.com/privacy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">9. Контакты</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Напишите на{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          . Bats Club управляется компанией SINBIOX Limited.
        </p>
      </section>
    </InfoPageShell>
  )
}
