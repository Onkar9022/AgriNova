"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteRecordButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this soil reading from your history?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/soil/history/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete record.");
      }
    } catch (e) {
      alert("An error occurred during deletion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className={`btn btn-sm ${loading ? "btn-outline" : ""}`}
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        gap: "0.25rem", 
        background: loading ? "var(--bg-muted)" : "var(--danger)", 
        color: loading ? "var(--text-muted)" : "white",
        border: "none"
      }}
      title="Delete Record"
    >
      <Trash2 size={16} /> {loading ? "..." : "Delete"}
    </button>
  );
}
