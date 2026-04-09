import RegisterForm from "@/components/RegisterForm"
import { ru } from "@/lib/dict"

export default function RegisterRuPage() {
  return (
    <RegisterForm
      labels={{
        heading: ru.register_heading,
        subtitle: ru.register_subtitle,
        name: ru.register_name,
        username: ru.register_username,
        usernameHint: ru.register_username_hint,
        email: ru.register_email,
        password: ru.register_password,
        passwordHint: ru.register_password_hint,
        submit: ru.register_submit,
        loading: ru.register_loading,
        hasAccount: ru.register_has_account,
        signinLink: ru.register_signin_link,
        loginHref: "/ru/login",
      }}
    />
  )
}
