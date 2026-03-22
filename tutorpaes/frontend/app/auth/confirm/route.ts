import { redirect } from "next/navigation";

export async function GET() {
  // Confirmation handled elsewhere or not needed; simply send to login
  redirect("/auth/login");
}
