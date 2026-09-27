import React, { useState, useEffect } from "react";
import { ShieldCheck, User, Database, LogOut, Clock, Activity, Cpu } from "lucide-react";
import { isSupabaseConfigured } from "../services/supabaseClient";

export default function Navbar({ currentUser, onLogout, onOpenSupabaseModal }) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [supabaseConnected, setSupabaseConnected] = useState(isSupabaseConfigured());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      setSupabaseConnected(isSupabaseConfigured());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{
      borderBottom: "1px solid var(--border-color)",
      background: "rgba(8, 12, 20, 0.85)",
      backdropFilter: "blur(16px)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      padding: "12px 24px"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        {/* Brand / Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)"
          }}>
            <Cpu size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: "800", letterSpacing: "0.02em" }}>
                AURA <span style={{ color: "var(--accent-cyan)" }}>MONITOR</span>
              </span>
              <span className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>v2.5 PRO</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Activity size={12} color="var(--accent-emerald)" />
              Enterprise Attendance & Inactivity Agent
            </div>
          </div>
        </div>

        {/* Live Clock & DB Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Clock */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(15, 23, 42, 0.6)",
            padding: "6px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-color)",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)"
          }}>
            <Clock size={15} color="var(--accent-cyan)" />
            {currentTime}
          </div>

          {/* Supabase Connection Button / Badge */}
          <button
            onClick={onOpenSupabaseModal}
            className="btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              borderRadius: "var(--radius-sm)",
              border: supabaseConnected ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.4)",
              background: supabaseConnected ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.1)"
            }}
            title="Configure Supabase Database Connection"
          >
            <Database size={14} color={supabaseConnected ? "#34d399" : "#fbbf24"} />
            {supabaseConnected ? (
              <span style={{ color: "#34d399", fontWeight: 600 }}>Supabase Active</span>
            ) : (
              <span style={{ color: "#fbbf24", fontWeight: 600 }}>Connect Supabase</span>
            )}
          </button>

          {/* User Info & Logout */}
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-color)"
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: currentUser.role === "admin" ? "linear-gradient(135deg, #8b5cf6, #ec4899)" : "linear-gradient(135deg, #06b6d4, #10b981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "0.85rem"
                }}>
                  {currentUser.role === "admin" ? <ShieldCheck size={18} /> : <User size={18} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{currentUser.name}</span>
                    <span className={`badge ${currentUser.role === "admin" ? "badge-purple" : "badge-emerald"}`} style={{ fontSize: "0.62rem" }}>
                      {currentUser.role.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                    ID: {currentUser.user_id}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn-secondary"
                style={{ padding: "8px 12px", color: "var(--accent-rose)" }}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
