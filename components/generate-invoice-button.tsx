"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function GenerateInvoiceButton({ orderId }: { orderId: string }) {
  return (
    <Button
      variant="outline"
      onClick={() => window.open(`/admin/invoice/${orderId}`, "_blank")}
    >
      <Printer className="w-4 h-4 mr-2" />
      Generate Invoice
    </Button>
  );
}
