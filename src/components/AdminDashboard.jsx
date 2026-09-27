import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Search, Users, UserCheck, Clock, Coffee, Globe, Gamepad2, 
  Video, Eye, Calendar, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2,
  ChevronRight, Laptop, Filter, ExternalLink
} from "lucide-react";
import { getAdminOverview, getAdminUserDetails } from "../services/dataService";

export default function AdminDashboard({ currentUser }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState("ALL");

  // Load Admin Overview Data
  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (err) {
      console.error("Failed to load admin overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  // When a user ID is searched or selected, load full dossier
  const handleSelectUser = async (userId) => {
    if (!userId) {
      setSelectedUserId(null);
      setUserDetails(null);
      return;
    }
    setSelectedUserId(userId);
    setLoadingDetails(true);
    try {
      const details = await getAdminUserDetails(userId);
      setUserDetails(details);
    } catch (err) {
      console.error("Failed to load user dossier:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Format Helpers
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

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

  // Filtered users for today's table and search
  const filteredUsers = overview?.usersWithAttendance?.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return u.user_id.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  }) || [];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 24px" }} className="animate-fade-in">
      
      {/* Admin Header Banner */}
      <div className="glass-panel glass-panel-purple" style={{
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
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)"
          }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.01em" }}>
                Executive Monitoring Console
              </h1>
              <span className="badge badge-purple">
                <span className="pulse-dot pulse-dot-emerald" /> ADMIN PRIVILEGES
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Logged in as Admin: <strong style={{ color: "#c084fc", fontFamily: "var(--font-mono)" }}>{currentUser.user_id}</strong> ({currentUser.name}) &bull; Live Realtime Tracking & Analytics
            </p>
          </div>
        </div>

        <button
          onClick={loadOverview}
          className="btn-secondary"
          style={{ padding: "10px 16px" }}
          title="Refresh All Records"
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      {/* METRICS ROW */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "20px",
        marginBottom: "28px"
      }}>
        {/* Metric 1: Total Employees */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Registered Employees
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.15)" }}>
              <Users size={18} color="#60a5fa" />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#60a5fa", fontFamily: "var(--font-mono)" }}>
            {overview?.totalEmployees || 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Total workforce database size
          </div>
        </div>

        {/* Metric 2: Today's Attendance Count */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Present Today
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)" }}>
              <UserCheck size={18} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#34d399", fontFamily: "var(--font-mono)" }}>
            {overview?.presentTodayCount || 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Employees clocked in for {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>

        {/* Metric 3: Active Monitoring Rate */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Attendance Turnout
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(139, 92, 246, 0.15)" }}>
              <Clock size={18} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#c084fc", fontFamily: "var(--font-mono)" }}>
            {overview?.totalEmployees ? Math.round((overview.presentTodayCount / overview.totalEmployees) * 100) : 100}%
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Real-time verified turn-in
          </div>
        </div>

        {/* Metric 4: Inactivity Agent Status */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Desktop Agent
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)" }}>
              <Coffee size={18} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="pulse-dot pulse-dot-emerald" /> 10s Lock Active
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Auto-lock & justification mandatory
          </div>
        </div>
      </div>

      {/* SEARCH BOX (Requirement: Admin user id potta udane avarukku irukkura elarudaiya id podura search box irukkanum) */}
      <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: "28px" }}>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "8px" }}>
          🔍 SEARCH SPECIFIC USER ID (VIEW FULL ACTIVITY & IDLE HISTORY)
        </label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <input
              type="text"
              placeholder="Type any User ID (e.g. EMP101, EMP102) or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: "42px" }}
            />
            <Search size={18} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          </div>

          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); }}
              className="btn-secondary"
              style={{ padding: "10px 16px" }}
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Quick Clickable User ID Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Quick Inspect User ID:</span>
          {overview?.usersWithAttendance?.filter(u => u.role === "employee").map((u) => (
            <button
              key={u.user_id}
              onClick={() => handleSelectUser(u.user_id)}
              className="btn-secondary"
              style={{
                fontSize: "0.76rem",
                padding: "4px 10px",
                borderRadius: "9999px",
                border: selectedUserId === u.user_id ? "1px solid var(--accent-cyan)" : "1px solid var(--border-color)",
                background: selectedUserId === u.user_id ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.04)",
                color: selectedUserId === u.user_id ? "#38bdf8" : "var(--text-main)"
              }}
            >
              {u.user_id} ({u.name.split(" ")[0]})
            </button>
          ))}
        </div>
      </div>

      {/* CONDITIONAL VIEW: IF SPECIFIC USER DOSSIER IS SELECTED */}
      {selectedUserId && userDetails ? (
        <div className="glass-panel" style={{
          padding: "32px",
          marginBottom: "28px",
          border: "1px solid rgba(6, 182, 212, 0.35)",
          boxShadow: "0 0 35px -10px rgba(6, 182, 212, 0.25)"
        }}>
          {/* Top Dossier Bar with Back Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <button
                onClick={() => { setSelectedUserId(null); setUserDetails(null); }}
                className="btn-secondary"
                style={{ padding: "8px 12px" }}
              >
                <ArrowLeft size={16} />
                Back to All Users
              </button>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "800" }}>
                    {userDetails.user.name}
                  </h2>
                  <span className="badge badge-cyan" style={{ fontFamily: "var(--font-mono)" }}>
                    ID: {userDetails.user.user_id}
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginTop: "2px" }}>
                  Role: {userDetails.user.role.toUpperCase()} &bull; Department: {userDetails.user.department || "General"} &bull; Joined: {formatDate(userDetails.user.created_at)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                <span style={{ fontSize: "0.72rem", color: "#6ee7b7", display: "block" }}>TOTAL ATTENDANCE DAYS</span>
                <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                  {userDetails.attendanceHistory.length} Days
                </span>
              </div>
              <div style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                <span style={{ fontSize: "0.72rem", color: "#fde047", display: "block" }}>TOTAL BREAK SESSIONS</span>
                <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fbbf24", fontFamily: "var(--font-mono)" }}>
                  {userDetails.idleLogs.length} Breaks
                </span>
              </div>
            </div>
          </div>

          {/* User History Tables Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px", marginBottom: "28px" }}>
            
            {/* 1. Complete Attendance Log */}
            <div className="glass-panel" style={{ padding: "20px", background: "rgba(15, 23, 42, 0.7)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={18} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Verified Attendance History</h3>
                </div>
                <span className="badge badge-cyan">{userDetails.attendanceHistory.length} records</span>
              </div>
              
              <div style={{ overflowX: "auto", maxHeight: "280px" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check-In</th>
                      <th>Total Break Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDetails.attendanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "var(--text-dim)", padding: "16px" }}>
                          No attendance recorded yet.
                        </td>
                      </tr>
                    ) : (
                      userDetails.attendanceHistory.map((att) => (
                        <tr key={att.id}>
                          <td style={{ fontWeight: 600 }}>{formatDate(att.date)}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{formatTime(att.check_in_time)}</td>
                          <td style={{ color: "#fbbf24", fontFamily: "var(--font-mono)" }}>
                            {formatDuration(att.total_idle_seconds || 0)}
                          </td>
                          <td>
                            <span className="badge badge-emerald">
                              {att.status || "Present"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Inactivity / Break Records with Reasons */}
            <div className="glass-panel" style={{ padding: "20px", background: "rgba(15, 23, 42, 0.7)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Coffee size={18} color="#fbbf24" />
                  <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Idle & Break Reason Details</h3>
                </div>
                <span className="badge badge-amber">{userDetails.idleLogs.length} events</span>
              </div>

              <div style={{ overflowX: "auto", maxHeight: "280px" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Break Reason Justification</th>
                      <th>Time Wasted / Away</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDetails.idleLogs.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", color: "var(--text-dim)", padding: "16px" }}>
                          No idle records or breaks taken.
                        </td>
                      </tr>
                    ) : (
                      userDetails.idleLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                            {log.reason}
                          </td>
                          <td style={{ color: "#f87171", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                            {formatDuration(log.duration_seconds)}
                          </td>
                          <td style={{ color: "var(--text-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
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

          {/* 3. Visited Websites, YouTube, Games, and Application Timeline */}
          <div className="glass-panel" style={{ padding: "24px", background: "rgba(15, 23, 42, 0.7)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Globe size={20} color="#c084fc" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                  Visited Websites, Games & Application Activity
                </h3>
              </div>

              {/* Filter tabs */}
              <div style={{ display: "flex", gap: "6px" }}>
                {["ALL", "Productive", "Entertainment", "Gaming", "Social Media"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActivityCategoryFilter(cat)}
                    className="btn-secondary"
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      borderRadius: "6px",
                      background: activityCategoryFilter === cat ? "rgba(139, 92, 246, 0.25)" : "transparent",
                      color: activityCategoryFilter === cat ? "#c084fc" : "var(--text-muted)",
                      borderColor: activityCategoryFilter === cat ? "#8b5cf6" : "transparent"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Title / Application Name</th>
                    <th>Category</th>
                    <th>URL or Process</th>
                    <th>Time Spent</th>
                    <th>Recorded Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {userDetails.activityLogs
                    .filter((act) => activityCategoryFilter === "ALL" || act.category === activityCategoryFilter)
                    .length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--text-dim)", padding: "24px" }}>
                        No activity records found matching filter.
                      </td>
                    </tr>
                  ) : (
                    userDetails.activityLogs
                      .filter((act) => activityCategoryFilter === "ALL" || act.category === activityCategoryFilter)
                      .map((act) => (
                        <tr key={act.id}>
                          <td style={{ fontWeight: 600 }}>{act.title}</td>
                          <td>
                            <span className={`badge ${
                              act.category === "Gaming" ? "badge-amber" :
                              act.category === "Entertainment" ? "badge-rose" :
                              act.category === "Social Media" ? "badge-purple" : "badge-emerald"
                            }`}>
                              {act.category}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
                            {act.url_or_app || "-"}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                            {formatDuration(act.duration_seconds || 0)}
                          </td>
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
      ) : null}

      {/* TODAY'S ATTENDANCE MASTER TABLE */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800" }}>
              Today's Attendance Master List ({new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })})
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "2px" }}>
              All employees with their User ID, Name, Check-in status, and break tallies:
            </p>
          </div>
          <span className="badge badge-emerald">
            {overview?.presentTodayCount || 0} Present Today
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Check-In Time</th>
                <th>Breaks Today</th>
                <th>Total Idle Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text-dim)", padding: "32px" }}>
                    No users found matching search "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} style={{ background: selectedUserId === user.user_id ? "rgba(6, 182, 212, 0.05)" : "transparent" }}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-cyan)" }}>
                      {user.user_id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {user.department || "General"}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                      {user.checkInTime ? formatTime(user.checkInTime) : <span style={{ color: "var(--text-dim)" }}>Not checked in</span>}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      <span className="badge badge-amber">{user.breaksCountToday || 0} breaks</span>
                    </td>
                    <td style={{ color: "#fbbf24", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {formatDuration(user.totalIdleSeconds || 0)}
                    </td>
                    <td>
                      {user.isPresentToday ? (
                        <span className="badge badge-emerald">
                          <span className="pulse-dot pulse-dot-emerald" /> Present
                        </span>
                      ) : (
                        <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-dim)" }}>
                          Absent
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleSelectUser(user.user_id)}
                        className="btn-primary"
                        style={{
                          padding: "6px 12px",
                          fontSize: "0.78rem",
                          borderRadius: "var(--radius-sm)"
                        }}
                      >
                        <Eye size={14} />
                        View Dossier
                      </button>
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
