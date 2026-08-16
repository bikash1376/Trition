import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { getTrelloToken } from "@/lib/trello/session";

export default async function Home() {
  const token = await getTrelloToken();
  if (token) redirect("/home");

  return <LandingPage />;
}
