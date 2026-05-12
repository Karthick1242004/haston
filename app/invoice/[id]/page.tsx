"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { InvoiceTemplate } from "@/components/invoice-template";

export default function UserInvoicePage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (status === "loading") return;
        
        if (status === "unauthenticated") {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/orders/${orderId}`);

        if (!res.ok) throw new Error("Failed to fetch order");

        const data = await res.json();
        setOrder(data.order || data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (orderId && status !== "loading") {
      fetchOrder();
    }
  }, [orderId, session, status]);

  useEffect(() => {
    if (order && !loading) {
      // Small delay to ensure images and layout are fully painted before printing
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [order, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-xl font-bold">Error</h2>
        <p>{error || "Order not found or unauthorized access."}</p>
      </div>
    );
  }

  return <InvoiceTemplate order={order} />;
}
