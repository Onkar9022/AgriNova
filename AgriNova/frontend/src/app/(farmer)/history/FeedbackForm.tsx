"use client";

import { useState } from "react";
import { Check, X, Star } from "lucide-react";

export default function FeedbackForm({ predictionId, recommendedCrop }: { predictionId: string, recommendedCrop: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [followed, setFollowed] = useState<boolean | null>(null);
  const [actualCrop, setActualCrop] = useState("");
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <span className="badge badge-success">Feedback Received</span>;
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="btn btn-outline btn-sm" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
        Provide Feedback
      </button>
    );
  }

  const handleSubmit = async () => {
    if (followed === null) return;
    if (!followed && !actualCrop) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predictionId,
          followedRecommendation: followed,
          actualCropPlanted: actualCrop,
          outcomeRating: rating,
          notes,
        }),
      });

      if (res.ok) setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: "0.75rem", padding: "1rem", background: "var(--bg-muted)", borderRadius: "8px", fontSize: "0.85rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <strong>Feedback on {recommendedCrop}</strong>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} /></button>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem" }}>Did you follow the recommendation?</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            type="button"
            className={`btn btn-sm ${followed === true ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFollowed(true)}
          >
            Yes
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${followed === false ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFollowed(false)}
          >
            No
          </button>
        </div>
      </div>

      {followed === false && (
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>What did you actually plant?</label>
          <input 
            type="text" 
            className="form-input" 
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
            value={actualCrop} 
            onChange={(e) => setActualCrop(e.target.value)} 
          />
        </div>
      )}

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem" }}>Outcome Rating (1-5)</label>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star} 
              size={16} 
              fill={star <= rating ? "var(--warning)" : "none"} 
              color={star <= rating ? "var(--warning)" : "var(--text-muted)"}
              style={{ cursor: "pointer" }}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem" }}>Notes (Optional)</label>
        <textarea 
          className="form-input" 
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", minHeight: "40px" }}
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
        />
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={submitting || followed === null || (!followed && !actualCrop)}
        className="btn btn-primary btn-sm"
        style={{ width: "100%" }}
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}
