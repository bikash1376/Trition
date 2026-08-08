import { redirect } from "next/navigation";
import { requireToken } from "@/lib/trello/guard";

export default async function Home() {
  await requireToken();
  redirect("/home");
}
