"use client";

import { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export const toast = {
  success: (message: string) => emitToast("success", message),
  error: (message: string) => emitToast("error", message),
  info: (message: string) => emitToast("info", message),
  warning: (message: string) => emitToast("warning", message),
};

function emitToast(type: ToastType, message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sews-toast", { detail: { type, message } })
    );
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const { type, message } = e.detail || {};
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };

    window.addEventListener("sews-toast", handleToast);
    return () => window.removeEventListener("sews-toast", handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${
            t.type === "success"
              ? "bg-emerald-50/95 text-emerald-900 border-emerald-200"
              : t.type === "error"
              ? "bg-red-50/95 text-red-900 border-red-200"
              : t.type === "warning"
              ? "bg-amber-50/95 text-amber-900 border-amber-200"
              : "bg-slate-900/95 text-white border-slate-800"
          }`}
        >
          <span className="text-base leading-none mt-0.5">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "⚠️" : "ℹ"}
          </span>
          <div className="flex-1 leading-relaxed">{t.message}</div>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
