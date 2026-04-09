import LoginForm from "@/components/LoginForm"
import { ru } from "@/lib/dict"

export default function LoginRuPage() {
  return (
    <LoginForm
      labels={{
        heading: ru.login_heading,
        subtitle: ru.login_subtitle,
        email: ru.login_email,
        password: ru.login_password,
        submit: ru.login_submit,
        loading: ru.login_loading,
        noAccount: ru.login_no_account,
        joinLink: ru.login_join_link,
        registerHref: "/ru/register",
      }}
    />
  )
}
