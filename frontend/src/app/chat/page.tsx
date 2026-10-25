import { redirect } from "next/navigation";

export default function ChatRedirectPage() {
  redirect("/studio?tab=chat");
}
