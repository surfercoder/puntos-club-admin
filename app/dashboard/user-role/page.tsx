"use client";

import { useEffect, useState } from "react";
import {
  getAllUserRoles,
  updateUserRole,
  getUsersCountByRole,
} from "@/actions/dashboard/user-role/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, RefreshCw, Users, UserCheck, Store, Shield, Smartphone } from "lucide-react";
import type { UserRole } from "@/types/user_role";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  final_user: <Smartphone className="h-4 w-4" />,
  cashier: <UserCheck className="h-4 w-4" />,
  owner: <Store className="h-4 w-4" />,
  collaborator: <Users className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
};

const ROLE_COLORS: Record<string, string> = {
  final_user: "bg-blue-100 text-blue-800",
  cashier: "bg-green-100 text-green-800",
  owner: "bg-purple-100 text-purple-800",
  collaborator: "bg-orange-100 text-orange-800",
  admin: "bg-red-100 text-red-800",
};

export default function UserRolePage() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCounts, setUserCounts] = useState<{
    appUserCounts: Record<string, number>;
    beneficiaryCount: number;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    display_name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [rolesResult, countsResult] = await Promise.all([
      getAllUserRoles(),
      getUsersCountByRole(),
    ]);

    if (rolesResult.success && rolesResult.data) {
      setRoles(rolesResult.data);
    }
    if (countsResult.success && countsResult.data) {
      setUserCounts(countsResult.data);
    }
    setLoading(false);
  };

  const handleOpenEdit = (role: UserRole) => {
    setEditingRole(role);
    setFormData({
      display_name: role.display_name,
      description: role.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingRole || !formData.display_name) {
      alert("Display name is required");
      return;
    }

    setSaving(true);

    const result = await updateUserRole(Number(editingRole.id), {
      display_name: formData.display_name,
      description: formData.description || undefined,
    });

    setSaving(false);

    if (result.success) {
      setDialogOpen(false);
      loadData();
    } else {
      alert(result.error || "Failed to update role");
    }
  };

  const getUserCount = (role: UserRole) => {
    if (!userCounts) return 0;
    if (role.name === "final_user") {
      return userCounts.beneficiaryCount;
    }
    return userCounts.appUserCounts[role.id] || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Roles</h1>
          <p className="text-muted-foreground">View and manage user role definitions</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {ROLE_ICONS[role.name] || <Users className="h-4 w-4" />}
                <CardTitle className="text-sm">{role.display_name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getUserCount(role)}</div>
              <p className="text-xs text-muted-foreground">users</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            System-defined user roles. You can edit display names and descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No roles found.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Type</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ROLE_ICONS[role.name] || <Users className="h-4 w-4" />}
                          <Badge className={ROLE_COLORS[role.name] || "bg-gray-100 text-gray-800"}>
                            {role.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{role.display_name}</TableCell>
                      <TableCell className="max-w-md">
                        {role.description || "No description"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{getUserCount(role)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the display name and description for this role.
              <br />
              <span className="text-xs text-muted-foreground">
                Note: The role type ({editingRole?.name}) cannot be changed.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Type</Label>
              <div className="flex items-center gap-2">
                {editingRole && ROLE_ICONS[editingRole.name]}
                <Badge className={editingRole ? ROLE_COLORS[editingRole.name] : ""}>
                  {editingRole?.name}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Role description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
