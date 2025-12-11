"use client";

import { useEffect, useState } from "react";
import {
  getAllPurchasableItems,
  togglePurchasableItemStatus,
  deletePurchasableItem,
  createPurchasableItem,
  updatePurchasableItem,
} from "@/actions/dashboard/purchasable-item/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { PurchasableItem } from "@/types/purchasable_item";

export default function PurchasableItemPage() {
  const [items, setItems] = useState<PurchasableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchasableItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    default_price: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const result = await getAllPurchasableItems();
    if (result.success && result.data) {
      setItems(result.data);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const result = await togglePurchasableItemStatus(id, !currentStatus);
    if (result.success) {
      loadItems();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      const result = await deletePurchasableItem(id);
      if (result.success) {
        loadItems();
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      default_price: "",
      active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: PurchasableItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      default_price: item.default_price,
      active: item.active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.default_price) {
      alert("Name and price are required");
      return;
    }

    setSaving(true);

    const input = {
      name: formData.name,
      description: formData.description || undefined,
      default_price: parseFloat(formData.default_price),
      active: formData.active,
    };

    let result;
    if (editingItem) {
      result = await updatePurchasableItem(editingItem.id, input);
    } else {
      result = await createPurchasableItem(input);
    }

    setSaving(false);

    if (result.success) {
      setDialogOpen(false);
      loadItems();
    } else {
      alert(result.error || "Failed to save item");
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link className="text-sm font-medium text-gray-500 hover:text-blue-600" href="/dashboard">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">Purchasable Items</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchasable Items</h1>
          <p className="text-muted-foreground">Manage items that can be purchased by customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadItems}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Item
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Items</CardTitle>
          <CardDescription>
            {items.length} total items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found. Create your first item to get started.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Points Rule</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.active}
                            onCheckedChange={() => handleToggleStatus(item.id, item.active)}
                          />
                          <Badge variant={item.active ? "default" : "secondary"}>
                            {item.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.description || "N/A"}
                      </TableCell>
                      <TableCell>{item.category?.name || "N/A"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.default_price)}
                      </TableCell>
                      <TableCell>{item.points_rule?.name || "Default"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Create New Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the details of this purchasable item."
                : "Add a new item that customers can purchase."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Item description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Default Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.default_price}
                onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
