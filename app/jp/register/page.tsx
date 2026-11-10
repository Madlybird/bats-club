import RegisterForm from "@/components/RegisterForm"
import { jp } from "@/lib/dict"
import { googleAuthEnabled } from "@/lib/auth"

export default function RegisterJpPage() {
  return (
    <RegisterForm
      labels={{
        heading: jp.register_heading,
        subtitle: jp.register_subtitle,
        name: jp.register_name,
        username: jp.register_username,
        usernameHint: jp.register_username_hint,
        email: jp.register_email,
        password: jp.register_password,
        passwordHint: jp.register_password_hint,
        submit: jp.register_submit,
        loading: jp.register_loading,
        hasAccount: jp.register_has_account,
        signinLink: jp.register_signin_link,
        loginHref: "/jp/login",
      }}
      google={googleAuthEnabled ? { label: jp.auth_google, orLabel: jp.auth_or, lang: "jp" } : undefined}
    />
  )
}
