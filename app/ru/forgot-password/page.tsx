import ForgotPasswordForm from "@/components/ForgotPasswordForm"
import { ru } from "@/lib/dict"

export default function ForgotPasswordRuPage() {
  return (
    <ForgotPasswordForm
      labels={{
        subtitle: ru.forgot_subtitle,
        heading: ru.forgot_heading,
        desc: ru.forgot_desc,
        email: ru.forgot_email,
        submit: ru.forgot_submit,
        sending: ru.forgot_sending,
        sentHeading: ru.forgot_sent_heading,
        sentDesc: ru.forgot_sent_desc,
        backToSignin: ru.forgot_back_to_signin,
        errorGeneric: ru.forgot_error_generic,
        loginHref: "/ru/login",
      }}
    />
  )
}
