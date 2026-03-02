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

const ROLE_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  final_user: "outline",
  cashier: "default",
  owner: "secondary",
  collaborator: "secondary",
  admin: "destructive",
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
      alert("El nombre a mostrar es requerido");
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
      alert(result.error || "No se pudo actualizar el rol");
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
          <h1 className="text-2xl font-bold">Roles de Usuario</h1>
          <p className="text-muted-foreground">Ver y administrar definiciones de roles de usuario</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
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
              <p className="text-xs text-muted-foreground">usuarios</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Roles</CardTitle>
          <CardDescription>
            Roles definidos por el sistema. Puede editar nombres y descripciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron roles.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Rol</TableHead>
                    <TableHead>Nombre a Mostrar</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Usuarios</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ROLE_ICONS[role.name] || <Users className="h-4 w-4" />}
                          <Badge variant={ROLE_COLORS[role.name] ?? "secondary"}>
                            {role.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{role.display_name}</TableCell>
                      <TableCell className="max-w-md">
                        {role.description || "Sin descripción"}
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
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>
              Actualiza el nombre y descripción de este rol.
              <br />
              <span className="text-xs text-muted-foreground">
                Nota: El tipo de rol ({editingRole?.name}) no puede modificarse.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Rol</Label>
              <div className="flex items-center gap-2">
                {editingRole && ROLE_ICONS[editingRole.name]}
                <Badge className={editingRole ? ROLE_COLORS[editingRole.name] : ""}>
                  {editingRole?.name}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Nombre a Mostrar *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Nombre a mostrar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del rol"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
