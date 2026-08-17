import ForgotPasswordForm from "@/components/ForgotPasswordForm"
import { jp } from "@/lib/dict"

export default function ForgotPasswordJpPage() {
  return (
    <ForgotPasswordForm
      labels={{
        subtitle: jp.forgot_subtitle,
        heading: jp.forgot_heading,
        desc: jp.forgot_desc,
        email: jp.forgot_email,
        submit: jp.forgot_submit,
        sending: jp.forgot_sending,
        sentHeading: jp.forgot_sent_heading,
        sentDesc: jp.forgot_sent_desc,
        backToSignin: jp.forgot_back_to_signin,
        errorGeneric: jp.forgot_error_generic,
        loginHref: "/jp/login",
      }}
    />
  )
}
