import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { en, ru, jp } from "@/lib/dict"
import WelcomeStep from "@/components/WelcomeStep"

// Landing page after "Continue with Google". New accounts pick a username
// here (once); returning users are forwarded straight to their profile.
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; src?: string }>
}) {
  const { lang: rawLang, src: rawSrc } = await searchParams
  const lang = rawLang === "ru" || rawLang === "jp" ? rawLang : "en"
  const prefix = lang === "en" ? "" : `/${lang}`
  const src = rawSrc && /^[a-z0-9_]{1,40}$/.test(rawSrc) ? rawSrc : "direct"
  const d = { en, ru, jp }[lang]

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect(`${prefix}/login`)

  return (
    <WelcomeStep
      userId={session.user.id}
      username={session.user.username}
      needsUsername={!!session.user.needsUsername}
      profilePrefix={`${prefix}/profile/`}
      src={src}
      labels={{
        heading: d.welcome_heading,
        body: d.welcome_body,
        username: d.welcome_username,
        usernameHint: d.register_username_hint,
        suggested: d.welcome_suggested,
        suggestedHint: d.welcome_suggested_hint,
        submit: d.welcome_continue,
        saving: d.welcome_saving,
      }}
    />
  )
}
