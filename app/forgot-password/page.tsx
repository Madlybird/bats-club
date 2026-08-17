import ForgotPasswordForm from "@/components/ForgotPasswordForm"
import { en } from "@/lib/dict"

export default function ForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      labels={{
        subtitle: en.forgot_subtitle,
        heading: en.forgot_heading,
        desc: en.forgot_desc,
        email: en.forgot_email,
        submit: en.forgot_submit,
        sending: en.forgot_sending,
        sentHeading: en.forgot_sent_heading,
        sentDesc: en.forgot_sent_desc,
        backToSignin: en.forgot_back_to_signin,
        errorGeneric: en.forgot_error_generic,
        loginHref: "/login",
      }}
    />
  )
}
