"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";

interface Coupon {
  _id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
}

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formConfig, setFormConfig] = useState<{
    id: string | null;
    code: string;
    discountPercentage: string;
    isActive: boolean;
  }>({
    id: null,
    code: "",
    discountPercentage: "",
    isActive: true,
  });

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load coupons", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const discountNumber = parseInt(formConfig.discountPercentage);
      if (isNaN(discountNumber) || discountNumber < 1 || discountNumber > 99) {
        toast({ title: "Validation Error", description: "Discount must be between 1 and 99", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      
      const payload = {
        code: formConfig.code.toUpperCase(),
        discountPercentage: discountNumber,
        isActive: formConfig.isActive,
      };

      const url = formConfig.id 
        ? `/api/admin/coupons/${formConfig.id}`
        : "/api/admin/coupons";
      const method = formConfig.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: `Coupon ${formConfig.id ? "updated" : "created"} successfully` });
        resetForm();
        fetchCoupons();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Operation failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setFormConfig({
      id: coupon._id,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage.toString(),
      isActive: coupon.isActive,
    });
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Coupon deleted successfully" });
        fetchCoupons();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormConfig({
      id: null,
      code: "",
      discountPercentage: "",
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-blue-950 mb-4">
          {formConfig.id ? "Edit Coupon" : "Create New Coupon"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input 
                id="code" 
                value={formConfig.code} 
                onChange={(e) => setFormConfig({ ...formConfig, code: e.target.value })} 
                placeholder="e.g. SUMMER20" 
                className="uppercase"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount (%)</Label>
              <Input 
                id="discountPercentage" 
                type="number" 
                min="1" 
                max="99" 
                value={formConfig.discountPercentage} 
                onChange={(e) => setFormConfig({ ...formConfig, discountPercentage: e.target.value })} 
                placeholder="20"
                required 
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 py-2">
            <Switch 
              id="isActive" 
              checked={formConfig.isActive} 
              onCheckedChange={(checked) => setFormConfig({ ...formConfig, isActive: checked })}
            />
            <Label htmlFor="isActive">Active (available for use)</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="bg-blue-950 hover:bg-blue-800" disabled={isSubmitting}>
              {formConfig.id ? "Update Coupon" : "Create Coupon"}
            </Button>
            {formConfig.id && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Existing Coupons</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No coupons found. Create one above!</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-medium tracking-wide">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
                        {coupon.discountPercentage}% OFF
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.isActive ? (
                        <Badge className="bg-blue-100 text-blue-800 border-0 hover:bg-blue-100">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(coupon.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(coupon)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(coupon._id, coupon.code)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
