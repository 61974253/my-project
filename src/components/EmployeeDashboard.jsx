import React, { useState, useEffect } from "react";
import { 
  Clock, Shield, Activity, Coffee, Calendar, CheckCircle, AlertCircle, 
  ExternalLink, Monitor, Play, Pause, Sparkles, Globe, Gamepad2, Video, 
  Flame, Laptop, RefreshCw
} from "lucide-react";
import { getAttendanceHistory, getIdleLogs, getActivityLogs, recordActivityLog } from "../services/dataService";

export default function EmployeeDashboard({ currentUser, todayAttendance, idleSecondsCounter, isLocked, onTriggerManualLock }) {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [idleLogs, setIdleLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeSessionTime, setActiveSessionTime] = useState(0);
  const [testUrl, setTestUrl] = useState("");
  const [testCategory, setTestCategory] = useState("Productive");
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);

  // Load records
  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [history, idles, acts] = await Promise.all([
        getAttendanceHistory(currentUser.user_id),
        getIdleLogs(currentUser.user_id),
        getActivityLogs(currentUser.user_id),
      ]);
      setAttendanceHistory(history);
      setIdleLogs(idles);
      setActivityLogs(acts);
    } catch (err) {
      console.error("Error loading employee data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, isLocked]);

  // Active session live timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (todayAttendance?.check_in_time && !isLocked) {
        const checkIn = new Date(todayAttendance.check_in_time).getTime();
        const diffSecs = Math.floor((Date.now() - checkIn) / 1000);
        setActiveSessionTime(diffSecs > 0 ? diffSecs : 0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [todayAttendance, isLocked]);

  // Format duration (supports values stored in minutes or seconds)
  const formatDuration = (val) => {
    if (!val) return "0s";
    if (val < 60) {
      return `${val} mins`;
    }
    const hrs = Math.floor(val / 3600);
    const mins = Math.floor((val % 3600) / 60);
    const secs = Math.floor(val % 60);
    return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
  };

  // Format Date
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Format Time
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // Quick activity logger to simulate game or video browsing
  const handleLogActivity = async (title, url, category) => {
    setIsLoggingActivity(true);
    try {
      await recordActivityLog({
        userId: currentUser.user_id,
        activityType: category === "Gaming" ? "game" : category === "Entertainment" ? "video" : "website",
        title: title || testUrl,
        urlOrApp: url || testUrl,
        category: category || testCategory,
        durationSeconds: Math.floor(Math.random() * 300) + 60,
      });
      setTestUrl("");
      await loadData();
    } finally {
      setIsLoggingActivity(false);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 24px" }} className="animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="glass-panel glass-panel-cyan" style={{
        padding: "24px 28px",
        marginBottom: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #06b6d4, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)"
          }}>
            <Laptop size={30} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.01em" }}>
                Welcome, {currentUser.name}
              </h1>
              <span className="badge badge-emerald">
                <span className="pulse-dot pulse-dot-emerald" /> ATTENDANCE MARKED
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              User ID: <strong style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>{currentUser.user_id}</strong> &bull; Dept: {currentUser.department || "Engineering"} &bull; Check-in Today: <span style={{ color: "var(--text-main)" }}>{formatTime(todayAttendance?.check_in_time)}</span>
            </p>
          </div>
        </div>

        {/* Manual Break / Test Inactivity Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onTriggerManualLock}
            className="btn-secondary"
            style={{
              borderColor: "rgba(245, 158, 11, 0.3)",
              background: "rgba(245, 158, 11, 0.1)",
              color: "#fbbf24",
              fontWeight: 600
            }}
          >
            <Coffee size={16} />
            Take Break Now
          </button>
          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ padding: "10px 14px" }}
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS ROW */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "20px",
        marginBottom: "28px"
      }}>
        {/* Card 1: Live Active Shift */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
              Live Work Shift
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)" }}>
              <Clock size={18} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: "800", fontFamily: "var(--font-mono)", color: "#34d399" }}>
            {formatDuration(activeSessionTime)}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Clocked in at {formatTime(todayAttendance?.check_in_time)}
          </div>
        </div>

        {/* Card 2: Inactivity Sensor Status */}
        <div className="glass-panel" style={{
          padding: "20px 24px",
          border: idleSecondsCounter >= 7 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border-color)",
          boxShadow: idleSecondsCounter >= 7 ? "0 0 20px rgba(239, 68, 68, 0.2)" : "none"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
              Inactivity Sensor
            </span>
            <span className={`badge ${idleSecondsCounter >= 7 ? "badge-rose" : "badge-cyan"}`}>
              {10 - idleSecondsCounter}s to lock
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "1.9rem", fontWeight: "800", fontFamily: "var(--font-mono)", color: idleSecondsCounter >= 7 ? "#f87171" : "#38bdf8" }}>
              {idleSecondsCounter}s
            </span>
            <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>/ 10s idle threshold</span>
          </div>
          {/* Progress bar */}
          <div style={{
            width: "100%",
            height: "6px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "999px",
            marginTop: "10px",
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

        {/* Card 3: Total Break Time Today */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
              Breaks Recorded Today
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)" }}>
              <Coffee size={18} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: "800", fontFamily: "var(--font-mono)", color: "#fbbf24" }}>
            {formatDuration(todayAttendance?.total_idle_seconds || 0)}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
            {idleLogs.filter(l => l.start_time.startsWith(new Date().toISOString().split("T")[0])).length} pause sessions registered
          </div>
        </div>

        {/* Card 4: Monitoring Agent Status */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
              Agent Status
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(139, 92, 246, 0.15)" }}>
              <Shield size={18} color="#c084fc" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="pulse-dot pulse-dot-emerald" />
            <span style={{ fontSize: "1.4rem", fontWeight: "700", color: "#34d399" }}>Active Monitoring</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "8px" }}>
            Tracking Keyboard, Mouse, Tabs & Windows
          </div>
        </div>
      </div>

      {/* QUICK ACTIVITY SIMULATOR BAR */}
      <div className="glass-panel" style={{
        padding: "20px 24px",
        marginBottom: "28px",
        background: "rgba(15, 23, 42, 0.65)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Live Activity & App Tracking Simulator</h3>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Click quick test buttons to simulate visiting games, YouTube, or work sites. These are stored directly in Supabase for Admin inspection:
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button
            onClick={() => handleLogActivity("YouTube - Top Coding Music Livestream", "https://youtube.com/live", "Entertainment")}
            disabled={isLoggingActivity}
            className="btn-secondary"
            style={{ fontSize: "0.82rem", padding: "8px 14px", border: "1px solid rgba(239, 68, 68, 0.3)" }}
          >
            <Video size={15} color="#ef4444" />
            Simulate: YouTube Video
          </button>
          <button
            onClick={() => handleLogActivity("Counter-Strike 2 / Steam Client", "steam://rungameid/730", "Gaming")}
            disabled={isLoggingActivity}
            className="btn-secondary"
            style={{ fontSize: "0.82rem", padding: "8px 14px", border: "1px solid rgba(245, 158, 11, 0.3)" }}
          >
            <Gamepad2 size={15} color="#f59e0b" />
            Simulate: Steam Gaming
          </button>
          <button
            onClick={() => handleLogActivity("Visual Studio Code - Workspace", "vscode://project", "Productive")}
            disabled={isLoggingActivity}
            className="btn-secondary"
            style={{ fontSize: "0.82rem", padding: "8px 14px", border: "1px solid rgba(16, 185, 129, 0.3)" }}
          >
            <Laptop size={15} color="#10b981" />
            Simulate: VS Code Work
          </button>
          <button
            onClick={() => handleLogActivity("Instagram / Social Media Tab", "https://instagram.com", "Social Media")}
            disabled={isLoggingActivity}
            className="btn-secondary"
            style={{ fontSize: "0.82rem", padding: "8px 14px", border: "1px solid rgba(244, 63, 94, 0.3)" }}
          >
            <Flame size={15} color="#f43f5e" />
            Simulate: Instagram
          </button>
        </div>
      </div>

      {/* TWO COLUMN TABLES: ATTENDANCE HISTORY & TODAY'S BREAK LOGS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px", marginBottom: "28px" }}>
        
        {/* Attendance History */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Your Attendance History</h3>
            </div>
            <span className="badge badge-cyan">{attendanceHistory.length} Records</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Break Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-dim)", padding: "24px" }}>
                      No past records found. Today is your first recorded session!
                    </td>
                  </tr>
                ) : (
                  attendanceHistory.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{formatDate(item.date)}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{formatTime(item.check_in_time)}</td>
                      <td style={{ color: "#fbbf24", fontFamily: "var(--font-mono)" }}>
                        {formatDuration(item.total_idle_seconds || 0)}
                      </td>
                      <td>
                        <span className="badge badge-emerald">
                          {item.status || "Present"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Break & Idle Logs */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Coffee size={18} color="#fbbf24" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Inactivity & Break Timeline</h3>
            </div>
            <span className="badge badge-amber">{idleLogs.length} Events</span>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "320px" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Break Reason</th>
                  <th>Duration</th>
                  <th>Time Recorded</th>
                </tr>
              </thead>
              <tbody>
                {idleLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--text-dim)", padding: "24px" }}>
                      No breaks taken yet. (Stop touching keyboard/mouse for 10s to test idle lock!)
                    </td>
                  </tr>
                ) : (
                  idleLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, color: "var(--text-main)" }}>{log.reason}</td>
                      <td style={{ color: "#f87171", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {formatDuration(log.duration_seconds)}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                        {formatTime(log.start_time)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Visited Websites & External App Logs Table */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Globe size={18} color="#a855f7" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Recent Activity & Application History</h3>
          </div>
          <span className="badge badge-purple">{activityLogs.length} Events Logged</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Title / Active Window</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--text-dim)", padding: "24px" }}>
                    No external application or web activity logged yet.
                  </td>
                </tr>
              ) : (
                activityLogs.slice(0, 10).map((act) => (
                  <tr key={act.id}>
                    <td style={{ fontWeight: 500 }}>{act.title}</td>
                    <td>
                      <span className={`badge ${
                        act.category === "Gaming" ? "badge-amber" :
                        act.category === "Entertainment" ? "badge-rose" :
                        act.category === "Social Media" ? "badge-purple" : "badge-emerald"
                      }`}>
                        {act.category}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{formatDuration(act.duration_seconds || 0)}</td>
                    <td style={{ color: "var(--text-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                      {formatTime(act.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
