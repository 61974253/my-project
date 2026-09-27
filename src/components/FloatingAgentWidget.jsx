import React, { useState, useEffect, useRef } from "react";
import { 
  Pause, Play, LogOut, Clock, Shield, Coffee, ChevronDown, ChevronUp, 
  Move, Minimize2, Maximize2, Zap, AlertCircle, X, Activity, Cpu, ExternalLink,
  Layers
} from "lucide-react";

export default function FloatingAgentWidget({ 
  currentUser, 
  todayAttendance, 
  idleSecondsCounter, 
  isLocked, 
  onPauseBreak, 
  onLogout 
}) {
  // Round circular bubble state (when user minimizes / closes the card)
  const [isRoundBubble, setIsRoundBubble] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [pipActive, setPipActive] = useState(false);
  
  // Dragging state
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("floating_widget_pos");
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 300, y: window.innerHeight - 180 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Update position on window resize to avoid going off-screen
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(10, prev.x), window.innerWidth - (isRoundBubble ? 80 : 280)),
        y: Math.min(Math.max(10, prev.y), window.innerHeight - (isRoundBubble ? 80 : 140)),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isRoundBubble]);

  // Live stopwatch for active session - KEEPS RUNNING CONTINUOUSLY IN BACKGROUND
  useEffect(() => {
    const interval = setInterval(() => {
      if (todayAttendance?.check_in_time && !isLocked) {
        const checkIn = new Date(todayAttendance.check_in_time).getTime();
        const diffSecs = Math.floor((Date.now() - checkIn) / 1000);
        setLiveSeconds(diffSecs > 0 ? diffSecs : 0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [todayAttendance, isLocked]);

  // Format HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? hrs + ":" : ""}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    // If it's in round bubble mode, the entire circle is draggable.
    // If it's in full card mode, only the header/drag-handle is draggable.
    if (isRoundBubble || e.target.closest(".drag-handle")) {
      setIsDragging(true);
      offsetRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const maxX = window.innerWidth - (isRoundBubble ? 70 : 280);
      const maxY = window.innerHeight - (isRoundBubble ? 70 : 140);
      const newX = Math.min(Math.max(10, e.clientX - offsetRef.current.x), maxX);
      const newY = Math.min(Math.max(10, e.clientY - offsetRef.current.y), maxY);
      const newPos = { x: newX, y: newY };
      setPosition(newPos);
      localStorage.setItem("floating_widget_pos", JSON.stringify(newPos));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isRoundBubble]);

  // Document Picture-in-Picture API: Lets widget float directly on top of Windows desktop/games!
  const handleTogglePiP = async () => {
    try {
      if ("documentPictureInPicture" in window) {
        if (!pipActive) {
          const pipWindow = await window.documentPictureInPicture.requestWindow({
            width: 300,
            height: 180,
          });
          
          // Copy stylesheets to PiP window
          [...document.styleSheets].forEach((styleSheet) => {
            try {
              const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
              const style = document.createElement("style");
              style.textContent = cssRules;
              pipWindow.document.head.appendChild(style);
            } catch {
              if (styleSheet.href) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = styleSheet.href;
                pipWindow.document.head.appendChild(link);
              }
            }
          });

          // Inject body styling
          pipWindow.document.body.style.margin = "0";
          pipWindow.document.body.style.background = "#080c14";
          pipWindow.document.body.style.display = "flex";
          pipWindow.document.body.style.alignItems = "center";
          pipWindow.document.body.style.justifyContent = "center";
          pipWindow.document.body.style.height = "100vh";
          pipWindow.document.body.style.fontFamily = "system-ui, sans-serif";
          pipWindow.document.body.style.color = "#ffffff";

          // Render miniature agent in PiP window
          const container = pipWindow.document.createElement("div");
          container.id = "pip-agent-root";
          pipWindow.document.body.appendChild(container);

          const updatePiP = () => {
            container.innerHTML = `
              <div style="padding: 16px; text-align: center; background: rgba(15,23,42,0.9); border-radius: 14px; border: 1px solid rgba(6,182,212,0.4);">
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:#38bdf8;font-weight:700;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;"></span>
                  AURA AGENT &bull; ${currentUser.user_id}
                </div>
                <div style="font-size:24px;font-weight:800;color:#34d399;font-family:monospace;margin:6px 0;">
                  ${formatTime(liveSeconds)}
                </div>
                <div style="font-size:11px;color:#94a3b8;">
                  Monitoring active in background
                </div>
              </div>
            `;
          };

          updatePiP();
          const pipTimer = setInterval(updatePiP, 1000);

          pipWindow.addEventListener("pagehide", () => {
            clearInterval(pipTimer);
            setPipActive(false);
          });

          setPipActive(true);
        }
      } else {
        alert("Picture-in-Picture window is available on modern Chrome & Edge. You can also run 'python desktop_agent.py' for desktop tracking!");
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
  };

  if (!currentUser) return null;

  // ========================================================
  // 1. ROUND CIRCULAR SHAPE (Runs continuously in background)
  // ========================================================
  if (isRoundBubble) {
    return (
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 99990,
          userSelect: "none",
          cursor: isDragging ? "grabbing" : "pointer",
          animation: "fadeIn 0.2s ease-out"
        }}
        title={`Aura Agent Active in Background (${formatTime(liveSeconds)}) - Click to expand or Logout`}
      >
        <div
          onClick={() => {
            if (!isDragging) setIsRoundBubble(false);
          }}
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #1e293b, #090d16)",
            border: isLocked ? "2px solid #ef4444" : "2px solid #06b6d4",
            boxShadow: isLocked 
              ? "0 0 30px rgba(239, 68, 68, 0.7), inset 0 0 12px rgba(239, 68, 68, 0.4)" 
              : "0 0 30px rgba(6, 182, 212, 0.6), inset 0 0 12px rgba(6, 182, 212, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transition: "all 0.2s ease",
            backdropFilter: "blur(20px)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {/* Glowing Status Beacon */}
          <span 
            className={`pulse-dot ${isLocked ? "pulse-dot-danger" : "pulse-dot-emerald"}`}
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              boxShadow: "0 0 10px currentColor"
            }} 
          />

          {/* Central Agent Shield Icon */}
          <Shield size={20} color={isLocked ? "#f87171" : "#38bdf8"} />

          {/* Mini Continuous Background Live Timer */}
          <span style={{
            fontSize: "0.62rem",
            fontFamily: "var(--font-mono)",
            fontWeight: "800",
            color: isLocked ? "#f87171" : "#34d399",
            marginTop: "2px",
            lineHeight: 1
          }}>
            {formatTime(liveSeconds).slice(-5)}
          </span>

          {/* Small background active tag */}
          <div style={{
            position: "absolute",
            bottom: "-18px",
            background: "rgba(10, 15, 29, 0.9)",
            border: "1px solid rgba(6, 182, 212, 0.4)",
            borderRadius: "6px",
            padding: "1px 5px",
            fontSize: "0.58rem",
            fontWeight: "700",
            color: "#38bdf8",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap"
          }}>
            ON
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. EXPANDED FLOATING CARD (With Close/Minimize into Round Shape)
  // ========================================================
  return (
    <div
      ref={dragRef}
      onMouseDown={handleMouseDown}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99990,
        width: isExpanded ? "300px" : "270px",
        userSelect: "none",
        transition: isDragging ? "none" : "width 0.2s ease, transform 0.15s ease",
        filter: isLocked ? "opacity(0.4)" : "opacity(1)",
        animation: "fadeIn 0.2s ease-out"
      }}
    >
      <div style={{
        background: "rgba(10, 15, 29, 0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(6, 182, 212, 0.35)",
        boxShadow: "0 12px 35px rgba(0, 0, 0, 0.6), 0 0 25px -5px rgba(6, 182, 212, 0.35)",
        borderRadius: "18px",
        padding: "12px 14px",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Ambient Top Glow Line */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: "2px",
          background: "linear-gradient(90deg, transparent, #06b6d4, transparent)"
        }} />

        {/* Top Header / Drag Handle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: isDragging ? "grabbing" : "grab",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          marginBottom: "10px"
        }} className="drag-handle" title="Drag to move anywhere on screen">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className={`pulse-dot ${isLocked ? "pulse-dot-danger" : "pulse-dot-emerald"}`} />
            <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.05em", color: "#38bdf8" }}>
              AURA AGENT &bull; {currentUser.user_id}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* Desktop PiP Always-on-top Button */}
            {"documentPictureInPicture" in window && (
              <button
                onClick={handleTogglePiP}
                style={{
                  background: pipActive ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.06)",
                  border: "none",
                  borderRadius: "6px",
                  color: pipActive ? "#34d399" : "var(--text-muted)",
                  padding: "3px 6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Pop out on top of Windows desktop / games"
              >
                <Layers size={13} />
              </button>
            )}

            {/* Drag Handle Icon */}
            <span style={{ color: "var(--text-dim)", cursor: "grab", padding: "2px" }} title="Drag widget">
              <Move size={13} />
            </span>

            {/* Expand / Details Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "none",
                borderRadius: "6px",
                color: "var(--text-muted)",
                padding: "3px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
              title={isExpanded ? "Collapse Details" : "More Details"}
            >
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {/* Close into Round Shape (Circle) */}
            <button
              onClick={() => setIsRoundBubble(true)}
              style={{
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                color: "#38bdf8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "2px"
              }}
              title="Close into Round Shape (Keeps running in background!)"
            >
              <Minimize2 size={12} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          {/* Live Stopwatch */}
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Shift
            </div>
            <div style={{
              fontSize: "1.25rem",
              fontWeight: "800",
              fontFamily: "var(--font-mono)",
              color: isLocked ? "#f87171" : "#34d399",
              lineHeight: 1.1
            }}>
              {formatTime(liveSeconds)}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Quick Pause / Take Break Button */}
            <button
              onClick={onPauseBreak}
              className="btn-secondary"
              style={{
                padding: "6px 10px",
                fontSize: "0.75rem",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                color: "#fbbf24",
                fontWeight: 600
              }}
              title="Pause Work / Take Break"
            >
              <Pause size={13} fill="#fbbf24" />
              Pause
            </button>

            {/* Quick Shortcut Logout Button */}
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{
                padding: "6px 10px",
                fontSize: "0.75rem",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#f87171",
                fontWeight: 600
              }}
              title="Terminate shift and Logout"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>

        {/* Inactivity Sensor Mini Bar */}
        <div style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "var(--text-dim)", marginBottom: "3px" }}>
            <span>Idle Lock Armed</span>
            <span style={{ color: idleSecondsCounter >= 7 ? "#f87171" : "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
              {idleSecondsCounter}s / 10s
            </span>
          </div>
          <div style={{
            width: "100%",
            height: "4px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "999px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${Math.min(100, (idleSecondsCounter / 10) * 100)}%`,
              height: "100%",
              background: idleSecondsCounter >= 7 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, #06b6d4, #3b82f6)",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>

        {/* EXPANDED DETAILS (When user clicks chevron) */}
        {isExpanded && (
          <div style={{
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "0.76rem",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Employee:</span>
              <strong style={{ color: "#ffffff" }}>{currentUser.name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Role:</span>
              <span className={`badge ${currentUser.role === "admin" ? "badge-purple" : "badge-cyan"}`} style={{ fontSize: "0.62rem" }}>
                {currentUser.role.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Today's Breaks:</span>
              <span style={{ color: "#fbbf24", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {Math.floor((todayAttendance?.total_idle_seconds || 0) / 60)} mins
              </span>
            </div>
            <div style={{
              padding: "6px 8px",
              borderRadius: "6px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px dashed rgba(16, 185, 129, 0.3)",
              color: "#6ee7b7",
              fontSize: "0.7rem",
              lineHeight: 1.3
            }}>
              🟢 <strong>Background Active:</strong> Closing into round shape keeps shift tracking ON. Only clicking <strong>Logout</strong> terminates your session!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
