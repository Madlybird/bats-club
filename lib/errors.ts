import { NextResponse } from "next/server"

/**
 * Logs the full error server-side (with stage + Postgres code/details/
 * hint) but returns ONLY a generic message + stage to the client, so we
 * never leak DB schema, column names, or internal hints to the browser.
 */
export function safeErrorResponse(scope: string, stage: string, error: any, status = 500) {
  console.error(`[${scope}] ${stage} failed`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  })
  return NextResponse.json({ error: "Request failed", stage }, { status })
}
