import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { LogoutButton } from "./logout-button";
import { Button } from "./ui/button";

export async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <LogoutButton />
    </div>
  ) : (
    <Button asChild size="sm" variant="outline">
      <Link href="/auth/login">Sign in</Link>
    </Button>
  );
}
