import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "./components/Navbar";
import AuthView from "./components/AuthView";
import EmployeeDashboard from "./components/EmployeeDashboard";
import AdminDashboard from "./components/AdminDashboard";
import IdleLockOverlay from "./components/IdleLockOverlay";
import SupabaseModal from "./components/SupabaseModal";
import FloatingAgentWidget from "./components/FloatingAgentWidget";
import { recordIdleLog, recordActivityLog } from "./services/dataService";
import { CheckCircle2, AlertTriangle, Coffee } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("monitoring_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [todayAttendance, setTodayAttendance] = useState(() => {
    const saved = localStorage.getItem("monitoring_today_attendance");
    return saved ? JSON.parse(saved) : null;
  });

  // Supabase Modal
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Inactivity & Desktop Agent State
  // Required: 10 seconds of no mouse, keyboard, or screen input triggers blackout lock screen!
  const IDLE_THRESHOLD_SECONDS = 10;
  const [idleSecondsCounter, setIdleSecondsCounter] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [idleStartTime, setIdleStartTime] = useState(null);
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const lastActivityRef = useRef(Date.now());
  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  // Reset activity on user interaction
  const resetActivity = useCallback(() => {
    if (!isLockedRef.current) {
      lastActivityRef.current = Date.now();
      setIdleSecondsCounter(0);
    }
  }, []);

  // Set up interaction listeners (mouse, key, touch, scroll)
  useEffect(() => {
    if (!currentUser) return;

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((ev) => window.addEventListener(ev, resetActivity, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetActivity));
    };
  }, [currentUser, resetActivity]);

  // Tab switch & Window Blur Tracker
  useEffect(() => {
    if (!currentUser) return;

    let blurStartTime = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurStartTime = Date.now();
      } else {
        if (blurStartTime) {
          const awayDuration = Math.round((Date.now() - blurStartTime) / 1000);
          if (awayDuration >= 3) {
            recordActivityLog({
              userId: currentUser.user_id,
              activityType: "tab_switch",
              title: "Switched Away from Work Tab / Minimized Window",
              urlOrApp: "External Browser Tab or Window",
              category: "Unproductive",
              durationSeconds: awayDuration,
            });
            showToast(`Tab switch detected: Away for ${awayDuration}s`, "warning");
          }
          blurStartTime = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser]);

  // Prevent accidental close without Logout & Alert User
  useEffect(() => {
    if (!currentUser) return;

    const handleBeforeUnload = (e) => {
      // Prompt user that session is actively monitoring in the background
      e.preventDefault();
      e.returnValue = "Work session & attendance agent is active in background! You must Log Out to finish.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUser]);

  // Main Desktop Inactivity Timer Loop (Checks every second)
  useEffect(() => {
    if (!currentUser) return;

    const timer = setInterval(() => {
      if (!isLockedRef.current) {
        const elapsedSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
        setIdleSecondsCounter(elapsedSec);

        // Trigger Lock Screen after 10 seconds of no activity!
        if (elapsedSec >= IDLE_THRESHOLD_SECONDS) {
          setIsLocked(true);
          const start = new Date(Date.now() - IDLE_THRESHOLD_SECONDS * 1000);
          setIdleStartTime(start);
          
          // Audio alert chime using web audio
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch {
            // Audio context policy
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser]);

  // Handle Login
  const handleLoginSuccess = (user, attendance) => {
    setCurrentUser(user);
    setTodayAttendance(attendance);
    localStorage.setItem("monitoring_current_user", JSON.stringify(user));
    if (attendance) {
      localStorage.setItem("monitoring_today_attendance", JSON.stringify(attendance));
    }
    lastActivityRef.current = Date.now();
    setIdleSecondsCounter(0);
    setIsLocked(false);
    showToast(`Welcome ${user.name}! Attendance recorded for today.`, "success");
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setTodayAttendance(null);
    localStorage.removeItem("monitoring_current_user");
    localStorage.removeItem("monitoring_today_attendance");
    setIsLocked(false);
    showToast("Logged out successfully.", "info");
  };

  // Handle Manual Lock trigger
  const handleTriggerManualLock = () => {
    setIsLocked(true);
    setIdleStartTime(new Date());
  };

  // Handle Unlock & Resume from Lock Screen
  const handleUnlockAndResume = async (reason, totalIdleSeconds) => {
    if (!currentUser) return;

    const end = new Date();
    const start = idleStartTime || new Date(end.getTime() - totalIdleSeconds * 1000);

    await recordIdleLog({
      userId: currentUser.user_id,
      startTime: start,
      endTime: end,
      durationSeconds: totalIdleSeconds,
      reason: reason,
    });

    // Update local attendance counter
    setTodayAttendance((prev) => {
      const updated = {
        ...prev,
        total_idle_seconds: (prev?.total_idle_seconds || 0) + totalIdleSeconds,
      };
      localStorage.setItem("monitoring_today_attendance", JSON.stringify(updated));
      return updated;
    });

    setIsLocked(false);
    setIdleStartTime(null);
    lastActivityRef.current = Date.now();
    setIdleSecondsCounter(0);

    showToast(`Break recorded (${reason} - ${totalIdleSeconds}s). Work session resumed!`, "success");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 99999999,
          padding: "14px 20px",
          borderRadius: "var(--radius-md)",
          background: toast.type === "warning" ? "rgba(245, 158, 11, 0.95)" : "rgba(16, 185, 129, 0.95)",
          color: "#ffffff",
          fontWeight: 600,
          fontSize: "0.9rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "fadeIn 0.2s ease-out"
        }}>
          {toast.type === "warning" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {!currentUser ? (
          <AuthView onLoginSuccess={handleLoginSuccess} />
        ) : currentUser.role === "admin" ? (
          <AdminDashboard currentUser={currentUser} />
        ) : (
          <EmployeeDashboard
            currentUser={currentUser}
            todayAttendance={todayAttendance}
            idleSecondsCounter={idleSecondsCounter}
            isLocked={isLocked}
            onTriggerManualLock={handleTriggerManualLock}
          />
        )}
      </main>

      {/* Mandatory Inactivity Lock Overlay (10s idle blackout) */}
      <IdleLockOverlay
        isLocked={isLocked}
        idleStartTime={idleStartTime}
        onUnlockAndResume={handleUnlockAndResume}
      />

      {/* Supabase Configuration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigSaved={() => {
          showToast("Supabase configuration updated!", "success");
        }}
      />

      {/* Floating Agent Widget (Always visible & draggable in corner, quick pause & shortcut logout) */}
      {currentUser && (
        <FloatingAgentWidget
          currentUser={currentUser}
          todayAttendance={todayAttendance}
          idleSecondsCounter={idleSecondsCounter}
          isLocked={isLocked}
          onPauseBreak={handleTriggerManualLock}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
