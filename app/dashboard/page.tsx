import { 
  MapPin, 
  Award, 
  Users, 
  Building2, 
  Building, 
  Tag, 
  CheckCircle, 
  Package, 
  Layers, 
  ShoppingCart, 
  UserCheck, 
  History, 
  Gift, 
  Package2, 
  Shield,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";


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
      count: null,
    },
    {
      name: "Assignment",
      description: "Manage point assignments for beneficiaries",
      icon: Award,
      href: "/dashboard/assignment",
      count: null,
    },
    {
      name: "Beneficiary",
      description: "Manage beneficiaries and their information",
      icon: Users,
      href: "/dashboard/beneficiary",
      count: null,
    },
    {
      name: "Branch",
      description: "Manage branches and locations",
      icon: Building2,
      href: "/dashboard/branch",
      count: null,
    },
    {
      name: "Organization",
      description: "Manage organizations and their details",
      icon: Building,
      href: "/dashboard/organization",
      count: null,
    },
    {
      name: "Category",
      description: "Manage product categories and classifications",
      icon: Tag,
      href: "/dashboard/category",
      count: null,
    },
    {
      name: "Status",
      description: "Manage order statuses and workflow states",
      icon: CheckCircle,
      href: "/dashboard/status",
      count: null,
    },
    {
      name: "Product",
      description: "Manage your product catalog and inventory",
      icon: Package,
      href: "/dashboard/product",
      count: null,
    },
    {
      name: "Subcategory",
      description: "Manage product subcategories and classifications",
      icon: Layers,
      href: "/dashboard/subcategory",
      count: null,
    },
    {
      name: "App Order",
      description: "Manage application orders and tracking",
      icon: ShoppingCart,
      href: "/dashboard/app_order",
      count: null,
    },
    {
      name: "App User",
      description: "Manage application users and accounts",
      icon: UserCheck,
      href: "/dashboard/app_user",
      count: null,
    },
    {
      name: "History",
      description: "View and manage order history and changes",
      icon: History,
      href: "/dashboard/history",
      count: null,
    },
    {
      name: "Redemption",
      description: "Manage product redemptions and rewards",
      icon: Gift,
      href: "/dashboard/redemption",
      count: null,
    },
    {
      name: "Stock",
      description: "Manage inventory stock levels and availability",
      icon: Package2,
      href: "/dashboard/stock",
      count: null,
    },
    {
      name: "User Permission",
      description: "Manage user permissions and access control",
      icon: Shield,
      href: "/dashboard/user_permission",
      count: null,
    },
    {
      name: "Users",
      description: "Manage all users (owners, collaborators, cashiers, beneficiaries)",
      icon: UsersRound,
      href: "/dashboard/users",
      count: null,
    },
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
            <div className="space-y-4">
              <div className="space-y-2">
                <p><strong>Email:</strong> {data.user.email}</p>
                <p><strong>User ID:</strong> {data.user.id}</p>
                <p><strong>Last Sign In:</strong> {data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
              </div>
              <div className="pt-2">
                <LogoutButton />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
