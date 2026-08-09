import { redirect } from "next/navigation";
import { LoginHero } from "@/components/login-hero";
import { getTrelloToken } from "@/lib/trello/session";

export default async function LoginPage() {
  const token = await getTrelloToken();
  if (token) redirect("/");

  return <LoginHero />;
}
