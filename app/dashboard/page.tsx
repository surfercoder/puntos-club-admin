import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";


export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-primary/5 border border-primary/10 aspect-video rounded-xl" />
        <div className="bg-brand-pink/5 border border-brand-pink/10 aspect-video rounded-xl" />
        <div className="bg-brand-orange/5 border border-brand-orange/10 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}
