import React from "react";

interface InvoiceTemplateProps {
  order: any;
}

export function InvoiceTemplate({ order }: InvoiceTemplateProps) {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black min-h-screen font-sans">
      {/* Header section */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-blue-950 mb-4">HEX & HUE</h1>
          <h2 className="text-3xl font-light text-gray-700 mb-2">E-Commerce Invoice</h2>
          <p className="text-gray-500 font-medium">Invoice #: {order.orderId}</p>
        </div>
        <div className="text-right text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-900">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="font-bold text-gray-900 mt-2">HEX & HUE</p>
          <p>Flat No-2902, The Dhan Pothowar CGHS Ltd,</p>
          <p>Plot No. 17, Sector 12 Dwarka,</p>
          <p>South West Delhi - 110078, Delhi</p>
          <p className="font-medium text-gray-900">GSTIN: 07ODCPS9769B1ZT</p>
          <p>State Code: 07</p>
        </div>
      </div>

      {/* Grid for Billing & Details */}
      <div className="grid grid-cols-2 gap-12 mb-12 border-b pb-12">
        {/* Bill To */}
        <div className="text-sm">
          <h3 className="font-bold text-gray-900 mb-3 border-b pb-1 inline-block">Bill to:</h3>
          <p className="font-medium text-gray-900">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p className="text-gray-600 mb-3">{order.userEmail}</p>

          <p className="text-gray-600">{order.shippingAddress.address}</p>
          <p className="text-gray-600">
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>
          <p className="text-gray-600">{order.shippingAddress.country}</p>
          <p className="text-gray-600">{order.shippingAddress.zipCode}</p>
          {order.shippingAddress.phone && (
            <p className="text-gray-600 mt-2">Phone: {order.shippingAddress.phone}</p>
          )}
        </div>

        {/* Details & Cost Summary */}
        <div className="text-sm">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-gray-600">
              <p>Invoice Number</p>
              <p>Invoice Date</p>
              <p>Payment ID</p>
              <p>Place of Supply</p>
              <p>Reverse Charge</p>
            </div>
            <div className="text-right font-medium">
              <p>{order.orderId}</p>
              <p>
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p>{order.paymentDetails?.razorpay_payment_id || "N/A"}</p>
              <p>{order.shippingAddress.state}</p>
              <p>No</p>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 mb-3 border-b pb-1">Cost Summary</h3>
          <div className="flex justify-between items-end mb-4 bg-gray-50 p-3 rounded-lg">
            <span className="font-medium">Total in INR</span>
            <span className="text-2xl font-bold">₹ {order.orderSummary.total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-gray-600 mb-1">
            <span>Subtotal in INR</span>
            <span>₹ {order.orderSummary.subtotal.toFixed(2)}</span>
          </div>
          {order.orderSummary.shipping > 0 && (
            <div className="flex justify-between text-gray-600 mb-1">
              <span>Shipping</span>
              <span>₹ {order.orderSummary.shipping.toFixed(2)}</span>
            </div>
          )}
          {order.orderSummary.taxes > 0 && (
            <div className="flex justify-between text-gray-600 mb-1">
              <span>Taxes</span>
              <span>₹ {order.orderSummary.taxes.toFixed(2)}</span>
            </div>
          )}
          {order.orderSummary.discount > 0 && (
            <div className="flex justify-between text-green-600 mb-1">
              <span>Discount</span>
              <span>-₹ {order.orderSummary.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 mt-2 pt-2 border-t">
            <span>Total in INR</span>
            <span>₹ {order.orderSummary.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-sm mb-12">
        <thead>
          <tr className="border-b-2 border-gray-900 text-left">
            <th className="pb-3 font-bold text-gray-900 w-2/5">Description</th>
            <th className="pb-3 font-bold text-gray-900 text-center">HSN</th>
            <th className="pb-3 font-bold text-gray-900 text-center">Quantity</th>
            <th className="pb-3 font-bold text-gray-900 text-right">Unit Price</th>
            <th className="pb-3 font-bold text-gray-900 text-right">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: any, i: number) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-4 text-gray-800">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Size: {item.selectedSize} | Color: {typeof item.selectedColor === 'object' ? (item.selectedColor.name || item.selectedColor.value) : item.selectedColor}
                </p>
              </td>
              <td className="py-4 text-center text-gray-800">6109</td>
              <td className="py-4 text-center text-gray-800">{item.quantity}</td>
              <td className="py-4 text-right text-gray-800">₹ {item.price.toFixed(2)}</td>
              <td className="py-4 text-right text-gray-900 font-medium">
                ₹ {item.subtotal.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-right">
            <td colSpan={4} className="pt-6 pb-2 text-gray-600">Subtotal in INR</td>
            <td className="pt-6 pb-2 font-medium">₹ {order.orderSummary.subtotal.toFixed(2)}</td>
          </tr>
          <tr className="text-right">
            <td colSpan={4} className="py-2 text-gray-600">GST ({order.orderSummary.taxes > 0 ? "Inclusive" : "0%"})</td>
            <td className="py-2 font-medium">₹ {order.orderSummary.taxes.toFixed(2)}</td>
          </tr>
          <tr className="text-right text-lg font-bold">
            <td colSpan={4} className="pt-4 text-gray-900">Total in INR</td>
            <td className="pt-4 text-gray-900">₹ {order.orderSummary.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Notes / Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-end">
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Notes</h4>
          <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
            <li>Thank you for shopping with Hex & Hue! We hope you love your purchase.</li>
            <li>For returns or exchanges, please visit our website within 14 days of delivery.</li>
            <li>This is a computer-generated invoice and does not require a physical signature.</li>
          </ul>
        </div>
        
        <div className="text-right">
          <p className="font-bold text-gray-900 mb-8">For HEX & HUE</p>
          <p className="text-sm text-gray-600 border-t border-gray-300 pt-2 inline-block px-4">Authorized Signatory</p>
        </div>
      </div>
      
      {/* Hide print UI elements */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 10mm; }
          #site-animated-banner, header, footer { display: none !important; }
        }
        #site-animated-banner { display: none !important; }
      `}} />
    </div>
  );
}
