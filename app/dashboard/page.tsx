import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Award } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Entity cards configuration
  const entities = [
    {
      name: "Address",
      description: "Manage addresses for your organization",
      icon: MapPin,
      href: "/dashboard/address",
      count: null, // We could add count queries here later
    },
    {
      name: "Assignment",
      description: "Manage point assignments for beneficiaries",
      icon: Award,
      href: "/dashboard/assignment",
      count: null,
    },
    // Future entities can be added here
    // {
    //   name: "Users",
    //   description: "Manage user accounts and permissions",
    //   icon: Users,
    //   href: "/dashboard/users",
    //   count: null,
    // },
    // {
    //   name: "Products",
    //   description: "Manage your product catalog",
    //   icon: Package,
    //   href: "/dashboard/products",
    //   count: null,
    // },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Manage your entities from here.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity) => {
          const IconComponent = entity.icon;
          return (
            <Card key={entity.name} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {entity.name}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {entity.description}
                </CardDescription>
                <Button asChild className="w-full">
                  <Link href={entity.href}>
                    Manage {entity.name}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User info section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Your current session details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {data.user.email}</p>
              <p><strong>User ID:</strong> {data.user.id}</p>
              <p><strong>Last Sign In:</strong> {data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
