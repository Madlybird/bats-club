import LoginForm from "@/components/LoginForm"
import { en } from "@/lib/dict"

export default function LoginPage() {
  return (
    <LoginForm
      labels={{
        heading: en.login_heading,
        subtitle: en.login_subtitle,
        email: en.login_email,
        password: en.login_password,
        submit: en.login_submit,
        loading: en.login_loading,
        noAccount: en.login_no_account,
        joinLink: en.login_join_link,
        registerHref: "/register",
      }}
    />
  )
}
