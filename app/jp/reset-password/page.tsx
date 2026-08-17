import ResetPasswordForm from "@/components/ResetPasswordForm"
import { jp } from "@/lib/dict"

export default function ResetPasswordJpPage() {
  return (
    <ResetPasswordForm
      labels={{
        subtitle: jp.reset_subtitle,
        heading: jp.reset_heading,
        newPassword: jp.reset_new_password,
        confirmPassword: jp.reset_confirm_password,
        submit: jp.reset_submit,
        updating: jp.reset_updating,
        doneHeading: jp.reset_done_heading,
        doneDesc: jp.reset_done_desc,
        signinNow: jp.reset_signin_now,
        errorMismatch: jp.reset_error_mismatch,
        errorLength: jp.reset_error_length,
        errorInvalidToken: jp.reset_error_invalid_token,
        errorGeneric: jp.reset_error_generic,
        loginHref: "/jp/login",
      }}
    />
  )
}
