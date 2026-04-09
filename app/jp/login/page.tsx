import LoginForm from "@/components/LoginForm"
import { jp } from "@/lib/dict"

export default function LoginJpPage() {
  return (
    <LoginForm
      labels={{
        heading: jp.login_heading,
        subtitle: jp.login_subtitle,
        email: jp.login_email,
        password: jp.login_password,
        submit: jp.login_submit,
        loading: jp.login_loading,
        noAccount: jp.login_no_account,
        joinLink: jp.login_join_link,
        registerHref: "/jp/register",
      }}
    />
  )
}
