import RegisterForm from "@/components/RegisterForm"
import { en } from "@/lib/dict"

export default function RegisterPage() {
  return (
    <RegisterForm
      labels={{
        heading: en.register_heading,
        subtitle: en.register_subtitle,
        name: en.register_name,
        username: en.register_username,
        usernameHint: en.register_username_hint,
        email: en.register_email,
        password: en.register_password,
        passwordHint: en.register_password_hint,
        submit: en.register_submit,
        loading: en.register_loading,
        hasAccount: en.register_has_account,
        signinLink: en.register_signin_link,
        loginHref: "/login",
      }}
    />
  )
}
