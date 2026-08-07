import { createClient } from "@supabase/supabase-js"
import fs from "fs"
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

const MAID_CAFE = [
  "109c1628-7c59-497b-8728-ed32c4646037","1393daa7-00c9-4ee8-b6a0-e6404d3bd961","fee35858-c873-4214-8989-186a90fd2cd0",
  "8ff2823c-95f1-4779-9c84-d93dd5623253","4f01871b-9975-48d2-a4a7-8bba8dd179f2","43a89e57-2add-4852-a454-d8c403da4652",
  "3ff32945-f82f-4aee-9b23-31b6dd9dd9f1","622b71e3-b134-40f4-81c9-c1e6a629979e","6629e525-de60-4a88-a595-7f1608a46b35",
  "8cd49275-a6ef-4523-8f14-ce9459166581","bcf58700-e064-4041-8c6f-5339b701067c","dc579aba-39f7-4548-8bfa-481ba13cb56c",
  "11319b13-b219-476f-9078-e47cf3f2cd86","82dbf892-2dd9-4e4d-8006-e3de61c229ba","a8688e71-b7be-48bd-b703-eda8ccfbbdc4",
  "dfd77fb3-216e-49ab-a4b9-bf7af750840b","0cce3217-a314-442e-95e0-8a92bb0252e9",
]
const VINTAGE_GASHAPON = [
  "38052be6-1aa5-44e0-a7cf-277053b9010f","0b1603e3-fb10-48a3-b4ad-ac37ebc84159","ca68cffd-596a-4633-9a59-ff3fe8499c7f",
  "a4a4d559-0809-40c9-a836-7e5d4acca2a6","bbdd85b3-00fb-4508-a353-0dc7c4cf2b16","55312e81-260b-40ca-a047-9e86d9e85d13",
  "3c5c1743-11b4-44a0-9348-6480ce274906","202b02ce-933f-4d00-8279-b276239975ac","a715ef5e-0c2c-40c1-9aa9-c5eaf8a42eff",
  "5aad59f5-b8bf-49f6-8e79-c3c9978fef3e","13457623-6528-4686-ac03-1ac002ed20a9","4980861a-ce74-40d9-a097-4bd7ef9f6084",
  "aad36c58-8bf7-4cdb-8034-c64355b8a7a8","2695fabb-b7a5-4719-add8-b753a3d72239","58976d3f-a9e0-4552-a3f8-aca7c71fd87c",
  "788c26e2-06cb-4352-b0d6-05d081d6c7fe","7080e1e9-c466-4b85-9e56-a46297d08913","9e944e60-59b7-4c3f-9a0d-f4175ff1f6e9",
  "f07334d9-67b4-46f3-80bf-e0ca01e50d40","c8b39493-30a7-4b55-84ed-1284a2890aee","b5d81cde-3103-49ec-ac8b-1f0da2bc95d3",
  "0a6f1880-16c3-49ad-b031-1db9ee8dfd5b","ddf02571-70af-4d8a-94f0-42a8beca1259","28dcd8a1-6fe2-4a68-8730-de5185dabcbb",
  "f2abca8c-2212-4d46-afb4-3da675a68387","3bc5e54a-1163-49c9-bfa4-7a80cc9868ca","5e99bff9-6883-47da-9417-7df3e8637b19",
  "a55bf08d-3702-4ad0-a93f-051df611670f","5acb51e0-a26a-4534-892e-a16b8fabc3ab","13da794e-adad-4b20-aa1e-b78e560aec87",
  "8b78fda4-0dbf-4be2-b5b2-f045acff2f4c","21952e20-41af-47ce-95f2-f33ebb21f927","76152063-9bd7-474d-b33a-9ec294a8e269",
  "1a2c5abe-476e-4a01-be04-e6d6ad37a2d8","11319b13-b219-476f-9078-e47cf3f2cd86","2e3657b9-b579-4b32-a328-1d9d28e8de46",
  "bee7fd14-4ad3-4e5e-8f6a-ed3322befb3c","1a044a95-995f-4996-87da-af558d2c0cf5","26f1b99f-9f6f-4217-ac10-7d1f93017464",
  "608411c4-abbe-49a0-932b-8b50779e143d","75e7f658-1bc9-4e22-97fb-a63f84dab577","648cb601-867e-4ab5-8aaf-730de7465001",
]

async function reconcile(slug, expected) {
  const { data: c, error: cErr } = await supabase.from("collections").select("id").eq("slug", slug).single()
  if (cErr) throw cErr

  const { error: delErr } = await supabase.from("collection_figures").delete().eq("collection_id", c.id)
  if (delErr) throw delErr

  const rows = expected.map((figure_id, i) => ({ collection_id: c.id, figure_id, position: i }))
  const { error: insErr } = await supabase.from("collection_figures").insert(rows)
  if (insErr) throw insErr

  const { data: check, error: checkErr } = await supabase
    .from("collection_figures")
    .select("figure_id")
    .eq("collection_id", c.id)
  if (checkErr) throw checkErr
  console.log(`${slug}: reconciled to ${check.length} rows (expected ${expected.length})`)
}

await reconcile("maid-cafe", MAID_CAFE)
await reconcile("vintage-gashapon", VINTAGE_GASHAPON)
