"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface SubscriptionOrder {
  id: number;
  planType: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentProofUrl: string | null;
  transactionReference: string | null;
  orderStatus: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
}

export default function SubscriptionPage() {
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [filter, currentPage]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscription-orders?status=${filter}&page=${currentPage}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setLoading(false);
    }
  }

  async function handleApprove(orderId: number) {
    if (!confirm("Are you sure you want to approve this subscription?")) {
      return;
    }
    setProcessing(orderId);

    try {
      const response = await fetch(`/api/admin/subscription-orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "APPROVED",
        }),
      });

      if (response.ok) {
        toast.success("Subscription approved and activated successfully");
        fetchOrders();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve subscription");
      }
    } catch (error) {
      toast.error("An error occurred while approving the subscription");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(orderId: number) {
    const reason = prompt("Please enter the reason for rejection");
    if (!reason) {
      return;
    }
    setProcessing(orderId);

    try {
      const response = await fetch(`/api/admin/subscription-orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "REJECT",
          rejectedReason: reason,
        }),
      });

      if (response.ok) {
        toast.success("Subscription order rejected");
        fetchOrders();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject subscription");
      }
    } catch (error) {
      toast.error("An error occurred while rejecting the subscription");
    } finally {
      setProcessing(null);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400";
      case "APPROVED":
        return "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400";
      case "REJECTED":
        return "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400";
      case "CANCELLED":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-600 dark:text-slate-400">Loading....</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Subscription Orders</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Review and approve subscription payments</p>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{totalCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pending</div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {orders.filter((o) => o.orderStatus === "PENDING").length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Approved</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {orders.filter((o) => o.orderStatus === "APPROVED").length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Rejected</div>
          <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
            {orders.filter((o) => o.orderStatus === "REJECTED").length}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "ALL"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "PENDING"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("APPROVED")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "APPROVED"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter("REJECTED")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "REJECTED"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Rejected
        </button>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-500">No subscription orders found.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{order.planType} Plan</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.orderStatus)}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <Link
                    href={`/admin/users/id`}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium"
                  >
                    {order.user.fullName} ({order.user.email})
                  </Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Current: {order.user.subscriptionTier} ({order.user.subscriptionStatus})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {order.currency} ${order.amount}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Payment Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Method:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{order.paymentMethod}</span>
                    </div>
                    {order.transactionReference && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Reference:</span>
                        <code className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded">
                          {order.transactionReference}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {order.paymentProofUrl && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Payment Proof</h4>
                    <img
                      src={order.paymentProofUrl}
                      alt="Payment proof"
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => setSelectedImage(order.paymentProofUrl)}
                    />
                    <button
                      onClick={() => window.open(order.paymentProofUrl!, "_blank")}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 mt-2"
                    >
                      View Full Size →
                    </button>
                  </div>
                )}
              </div>

              {(order.notes || order.rejectedReason) && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-4">
                  {order.rejectedReason && (
                    <div className="mb-2">
                      <span className="font-semibold text-rose-700 dark:text-rose-400">Rejection Reason: </span>
                      <span className="text-rose-600 dark:text-rose-400">{order.rejectedReason}</span>
                    </div>
                  )}
                  {order.notes && (
                    <div>
                      <span className="font-semibold text-blue-800 dark:text-blue-400">Notes: </span>
                      <span className="text-blue-700 dark:text-blue-400">{order.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {order.orderStatus === "PENDING" && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleApprove(order.id)}
                    disabled={processing === order.id}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processing === order.id ? "Processing..." : "Approve & Activate"}
                  </button>
                  <button
                    onClick={() => handleReject(order.id)}
                    disabled={processing === order.id}
                    className="px-6 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              {order.approvedAt && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Approved on {new Date(order.approvedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Payment proof"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
