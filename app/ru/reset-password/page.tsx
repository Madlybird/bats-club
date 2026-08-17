import ResetPasswordForm from "@/components/ResetPasswordForm"
import { ru } from "@/lib/dict"

export default function ResetPasswordRuPage() {
  return (
    <ResetPasswordForm
      labels={{
        subtitle: ru.reset_subtitle,
        heading: ru.reset_heading,
        newPassword: ru.reset_new_password,
        confirmPassword: ru.reset_confirm_password,
        submit: ru.reset_submit,
        updating: ru.reset_updating,
        doneHeading: ru.reset_done_heading,
        doneDesc: ru.reset_done_desc,
        signinNow: ru.reset_signin_now,
        errorMismatch: ru.reset_error_mismatch,
        errorLength: ru.reset_error_length,
        errorInvalidToken: ru.reset_error_invalid_token,
        errorGeneric: ru.reset_error_generic,
        loginHref: "/ru/login",
      }}
    />
  )
}
