import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, Play, CheckCircle2, ShieldAlert, Coffee, Utensils, Users, PhoneCall, HelpCircle } from "lucide-react";

export default function IdleLockOverlay({ isLocked, idleStartTime, onUnlockAndResume }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live timer for how long user has been idle
  useEffect(() => {
    let interval = null;
    if (isLocked && idleStartTime) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - idleStartTime.getTime()) / 1000);
        setElapsedSeconds(seconds >= 0 ? seconds : 0);
      }, 1000);
    } else {
      setElapsedSeconds(0);
      setShowReasonModal(false);
      setSelectedReason("");
      setCustomReason("");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLocked, idleStartTime]);

  // Request browser fullscreen when locked so it occupies 100% of the screen
  useEffect(() => {
    if (isLocked) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isLocked]);

  if (!isLocked) return null;

  // Format MM:SS or HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleResumeClick = () => {
    setShowReasonModal(true);
  };

  const handleConfirmResume = async (e) => {
    if (e) e.preventDefault();
    const finalReason = selectedReason === "Other" ? (customReason.trim() || "Unspecified Break") : (selectedReason || "General Break");
    
    setIsSubmitting(true);
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      await onUnlockAndResume(finalReason, elapsedSeconds);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasonsList = [
    { label: "☕ Tea / Coffee Break", icon: Coffee },
    { label: "🍱 Lunch / Meal Break", icon: Utensils },
    { label: "🚻 Restroom / Washroom", icon: HelpCircle },
    { label: "👥 Internal Discussion / Meeting", icon: Users },
    { label: "📞 Official / Urgent Phone Call", icon: PhoneCall },
    { label: "Other (Specify Custom Reason)", icon: HelpCircle },
  ];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 2147483647,
      background: "#000000",
      backdropFilter: "blur(30px)",
      WebkitBackdropFilter: "blur(30px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      userSelect: "none",
      animation: "fadeIn 0.25s ease-out"
    }}>
      {/* Background Warning Scanlines / Ambient Glow */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 70%)",
        filter: "blur(50px)",
        pointerEvents: "none"
      }} />

      {/* Main Lock Screen Card */}
      <div className="glass-panel" style={{
        maxWidth: "560px",
        width: "100%",
        textAlign: "center",
        padding: "40px 32px",
        background: "rgba(10, 14, 26, 0.92)",
        border: "1px solid rgba(239, 68, 68, 0.35)",
        boxShadow: "0 0 50px -10px rgba(239, 68, 68, 0.35), inset 0 0 20px rgba(239, 68, 68, 0.05)",
        position: "relative",
        zIndex: 10
      }}>
        {/* Pulsing Status Hazard Header */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px",
          borderRadius: "9999px",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          color: "#f87171",
          fontSize: "0.82rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "20px"
        }}>
          <span className="pulse-dot pulse-dot-danger" />
          WORKSTATION LOCKED &bull; 10s IDLE DETECTED
        </div>

        <div style={{
          width: "72px",
          height: "72px",
          margin: "0 auto 16px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.1))",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 25px rgba(239, 68, 68, 0.3)"
        }}>
          <ShieldAlert size={36} color="#ef4444" />
        </div>

        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em" }}>
          Inactivity Detected
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "8px", maxWidth: "420px", margin: "8px auto 24px" }}>
          No keyboard, mouse, or screen interaction was detected for over 10 seconds. Work session is paused.
        </p>

        {/* Digital Stopwatch Display */}
        <div style={{
          background: "rgba(5, 8, 16, 0.8)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          margin: "0 auto 28px",
          boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.8)"
        }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
            Total Inactive Time Elapsed
          </div>
          <div style={{
            fontSize: "3.2rem",
            fontWeight: "800",
            fontFamily: "var(--font-mono)",
            color: "#f87171",
            textShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
            lineHeight: 1
          }}>
            {formatTime(elapsedSeconds)}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#fca5a5", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Clock size={13} />
            Tracking break duration into employee attendance record
          </div>
        </div>

        {/* Action Button */}
        {!showReasonModal ? (
          <button
            onClick={handleResumeClick}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1.05rem",
              fontWeight: "700",
              justifyContent: "center",
              background: "linear-gradient(135deg, #10b981, #059669)",
              boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)"
            }}
          >
            <Play size={20} fill="#ffffff" />
            Resume Work & Unlock Screen
          </button>
        ) : (
          /* Mandatory Reason Prompt Form */
          <form onSubmit={handleConfirmResume} style={{ textAlign: "left", animation: "fadeIn 0.2s ease-in-out" }}>
            <div style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#34d399",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <CheckCircle2 size={18} />
              Where did you go? Select Break Reason:
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginBottom: "14px" }}>
              {reasonsList.map((item) => {
                const isSelected = selectedReason === item.label;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSelectedReason(item.label)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: isSelected ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.08)",
                      background: isSelected ? "rgba(16, 185, 129, 0.18)" : "rgba(15, 23, 42, 0.6)",
                      color: isSelected ? "#6ee7b7" : "var(--text-main)",
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <IconComponent size={16} color={isSelected ? "#10b981" : "var(--text-dim)"} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedReason.includes("Other") && (
              <div style={{ marginBottom: "14px" }}>
                <input
                  type="text"
                  placeholder="Enter specific break reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="input-field"
                  autoFocus
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                justifyContent: "center",
                fontSize: "1rem",
                background: selectedReason ? "linear-gradient(135deg, #10b981, #047857)" : "rgba(255, 255, 255, 0.1)",
                cursor: selectedReason ? "pointer" : "not-allowed",
                opacity: selectedReason ? 1 : 0.6
              }}
            >
              {isSubmitting ? "Logging & Unlocking..." : "Confirm Reason & Return to Work"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "20px", fontSize: "0.74rem", color: "var(--text-dim)" }}>
          🔒 Security Rule: Work application cannot be accessed until break reason is submitted.
        </div>
      </div>
    </div>
  );
}
