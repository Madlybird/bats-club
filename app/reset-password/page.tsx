import ResetPasswordForm from "@/components/ResetPasswordForm"
import { en } from "@/lib/dict"

export default function ResetPasswordPage() {
  return (
    <ResetPasswordForm
      labels={{
        subtitle: en.reset_subtitle,
        heading: en.reset_heading,
        newPassword: en.reset_new_password,
        confirmPassword: en.reset_confirm_password,
        submit: en.reset_submit,
        updating: en.reset_updating,
        doneHeading: en.reset_done_heading,
        doneDesc: en.reset_done_desc,
        signinNow: en.reset_signin_now,
        errorMismatch: en.reset_error_mismatch,
        errorLength: en.reset_error_length,
        errorInvalidToken: en.reset_error_invalid_token,
        errorGeneric: en.reset_error_generic,
        loginHref: "/login",
      }}
    />
  )
}
