"use client";
import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#10b981",
          color: "#363636",
          padding: "16px",
          borderRadius: "8px",
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.1) , 0 2px 4px -1px rgba(0, 0, 0, 0.96)",
        },
        success: {
          duration: 3000,
          style: {
            background: "#10b981",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#10b981",
          },
        },
        error: {
          duration: 4000,
          style: {
            background: "#ef4444",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#ef4444",
          },
        },
        loading: {
          style: {
            background: "#3b82f6",
            color: "#fff",
          },
        },
      }}
    />
  );
};

export default ToastProvider;
