"use client";

import { useEffect, useReducer } from "react";
import { useTranslations } from "next-intl";
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

type UserRoleState = {
  roles: UserRole[];
  loading: boolean;
  userCounts: {
    appUserCounts: Record<string, number>;
    beneficiaryCount: number;
  } | null;
  dialogOpen: boolean;
  editingRole: UserRole | null;
  formData: {
    display_name: string;
    description: string;
  };
  saving: boolean;
};

type UserRoleAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ROLES"; payload: UserRole[] }
  | { type: "SET_USER_COUNTS"; payload: UserRoleState["userCounts"] }
  | { type: "SET_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_EDITING_ROLE"; payload: UserRole | null }
  | { type: "SET_FORM_DATA"; payload: UserRoleState["formData"] }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "OPEN_EDIT"; payload: { role: UserRole; formData: UserRoleState["formData"] } };

const initialState: UserRoleState = {
  roles: [],
  loading: true,
  userCounts: null,
  dialogOpen: false,
  editingRole: null,
  formData: { display_name: "", description: "" },
  saving: false,
};

function userRoleReducer(state: UserRoleState, action: UserRoleAction): UserRoleState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ROLES":
      return { ...state, roles: action.payload };
    case "SET_USER_COUNTS":
      return { ...state, userCounts: action.payload };
    case "SET_DIALOG_OPEN":
      return { ...state, dialogOpen: action.payload };
    case "SET_EDITING_ROLE":
      return { ...state, editingRole: action.payload };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "OPEN_EDIT":
      return {
        ...state,
        editingRole: action.payload.role,
        formData: action.payload.formData,
        dialogOpen: true,
      };
    default:
      return state;
  }
}

export default function UserRolePage() {
  const t = useTranslations("UserRole");
  const tCommon = useTranslations("Common");
  const [state, dispatch] = useReducer(userRoleReducer, initialState);
  const { roles, loading, userCounts, dialogOpen, editingRole, formData, saving } = state;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    const [rolesResult, countsResult] = await Promise.all([
      getAllUserRoles(),
      getUsersCountByRole(),
    ]);

    if (rolesResult.success && rolesResult.data) {
      dispatch({ type: "SET_ROLES", payload: rolesResult.data });
    }
    if (countsResult.success && countsResult.data) {
      dispatch({ type: "SET_USER_COUNTS", payload: countsResult.data });
    }
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const handleOpenEdit = (role: UserRole) => {
    dispatch({
      type: "OPEN_EDIT",
      payload: {
        role,
        formData: {
          display_name: role.display_name,
          description: role.description || "",
        },
      },
    });
  };

  const handleSubmit = async () => {
    if (!editingRole || !formData.display_name) {
      alert(t("dialog.displayNameRequired"));
      return;
    }

    dispatch({ type: "SET_SAVING", payload: true });

    const result = await updateUserRole(Number(editingRole.id), {
      display_name: formData.display_name,
      description: formData.description || undefined,
    });

    dispatch({ type: "SET_SAVING", payload: false });

    if (result.success) {
      dispatch({ type: "SET_DIALOG_OPEN", payload: false });
      loadData();
    } else {
      alert(result.error || t("dialog.updateError"));
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
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("refresh")}
        </Button>
      </div>

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
              <p className="text-xs text-muted-foreground">{t("users")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("tableTitle")}</CardTitle>
          <CardDescription>{t("tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t("loading")}</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("empty")}</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tableHeaders.roleType")}</TableHead>
                    <TableHead>{t("tableHeaders.displayName")}</TableHead>
                    <TableHead>{t("tableHeaders.description")}</TableHead>
                    <TableHead className="text-center">{t("tableHeaders.users")}</TableHead>
                    <TableHead className="text-right">{t("tableHeaders.actions")}</TableHead>
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
                        {role.description || t("noDescription")}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => dispatch({ type: "SET_DIALOG_OPEN", payload: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dialog.description")}
              <br />
              <span className="text-xs text-muted-foreground">
                {t("dialog.note", { name: editingRole?.name ?? "" })}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("dialog.roleType")}</Label>
              <div className="flex items-center gap-2">
                {editingRole && ROLE_ICONS[editingRole.name]}
                <Badge className={editingRole ? ROLE_COLORS[editingRole.name] : ""}>
                  {editingRole?.name}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">{t("dialog.displayName")}</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...formData, display_name: e.target.value } })}
                placeholder={t("dialog.displayNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("dialog.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...formData, description: e.target.value } })}
                placeholder={t("dialog.descriptionPlaceholder")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dispatch({ type: "SET_DIALOG_OPEN", payload: false })}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? t("dialog.saving") : t("dialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
