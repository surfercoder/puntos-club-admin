"use client";

import { useEffect, useState } from "react";
import { getAllPurchases, getPurchaseById } from "@/actions/dashboard/purchase/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, RefreshCw } from "lucide-react";

interface Purchase {
  id: number;
  purchase_number: string;
  total_amount: string;
  points_earned: number;
  purchase_date: string;
  notes: string | null;
  beneficiary: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  cashier: {
    first_name: string;
    last_name: string;
  } | null;
  branch: {
    name: string;
    organization_id: number;
  } | null;
}

interface PurchaseItem {
  id: number;
  item_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  points_earned: number;
}

interface PurchaseDetails extends Purchase {
  purchase_item: PurchaseItem[];
}

export default function PurchaseListPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    const result = await getAllPurchases();
    if (result.success && result.data) {
      setPurchases(result.data);
    }
    setLoading(false);
  };

  const handleViewDetails = async (purchaseId: number) => {
    setDetailsLoading(true);
    setDialogOpen(true);
    const result = await getPurchaseById(purchaseId);
    if (result.success && result.data) {
      setSelectedPurchase(result.data as PurchaseDetails);
    }
    setDetailsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-muted-foreground">View all purchase transactions and points earned</p>
        </div>
        <Button variant="outline" onClick={loadPurchases}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchases</CardTitle>
          <CardDescription>
            {purchases.length} total purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading purchases...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchases found.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono font-medium">
                        {purchase.purchase_number}
                      </TableCell>
                      <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                      <TableCell>
                        {purchase.beneficiary ? (
                          <div>
                            <div className="font-medium">
                              {purchase.beneficiary.first_name} {purchase.beneficiary.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {purchase.beneficiary.email}
                            </div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {purchase.cashier ? (
                          `${purchase.cashier.first_name} ${purchase.cashier.last_name}`
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{purchase.branch?.name || "N/A"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(purchase.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          +{purchase.points_earned} pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(purchase.id)}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Purchase Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
            <DialogDescription>
              {selectedPurchase?.purchase_number}
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="text-center py-8">Loading details...</div>
          ) : selectedPurchase ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                  <p>{formatDate(selectedPurchase.purchase_date)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Branch</h4>
                  <p>{selectedPurchase.branch?.name || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Beneficiary</h4>
                  <p>
                    {selectedPurchase.beneficiary
                      ? `${selectedPurchase.beneficiary.first_name} ${selectedPurchase.beneficiary.last_name}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Cashier</h4>
                  <p>
                    {selectedPurchase.cashier
                      ? `${selectedPurchase.cashier.first_name} ${selectedPurchase.cashier.last_name}`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {selectedPurchase.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p>{selectedPurchase.notes}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPurchase.purchase_item?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">+{item.points_earned}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <span className="text-sm text-muted-foreground">Total Amount:</span>
                  <span className="ml-2 text-lg font-bold">
                    {formatCurrency(selectedPurchase.total_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Points Earned:</span>
                  <Badge className="ml-2" variant="default">
                    +{selectedPurchase.points_earned} pts
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
