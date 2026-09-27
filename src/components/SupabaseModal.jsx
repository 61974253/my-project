import React, { useState } from "react";
import { X, Database, CheckCircle2, Copy, AlertCircle, Terminal, Key, Link as LinkIcon, RefreshCw } from "lucide-react";
import { getSupabaseConfig, saveSupabaseConfig, getSupabase } from "../services/supabaseClient";

export default function SupabaseModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getSupabaseConfig() || { url: "", key: "" };
  const [url, setUrl] = useState(currentConfig.url || "");
  const [key, setKey] = useState(currentConfig.key || "");
  const [testStatus, setTestStatus] = useState(null); // 'testing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setErrorMsg("Please provide both Supabase URL and Anon Key.");
      return;
    }

    setTestStatus("testing");
    setErrorMsg("");

    try {
      saveSupabaseConfig(url, key);
      const client = getSupabase();
      if (!client) throw new Error("Could not initialize Supabase client.");

      // Test query to app_users table
      const { data, error } = await client.from("app_users").select("user_id").limit(1);
      
      if (error && error.code !== "PGRST116") {
        throw new Error(error.message || "Failed to reach table. Did you run the SQL migration?");
      }

      setTestStatus("success");
      setTimeout(() => {
        if (onConfigSaved) onConfigSaved();
        onClose();
      }, 900);
    } catch (err) {
      setTestStatus("error");
      setErrorMsg(err.message || "Failed to connect to Supabase. Check credentials and SQL tables.");
    }
  };

  const handleResetToLocal = () => {
    saveSupabaseConfig("", "");
    setUrl("");
    setKey("");
    setTestStatus(null);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const copySqlSchema = () => {
    const sql = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    department TEXT DEFAULT 'Engineering',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ DEFAULT now(),
    check_out_time TIMESTAMPTZ,
    status TEXT DEFAULT 'Present',
    total_active_seconds INT DEFAULT 0,
    total_idle_seconds INT DEFAULT 0,
    UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS idle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_seconds INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL DEFAULT 'window_active',
    title TEXT NOT NULL,
    url_or_app TEXT,
    category TEXT DEFAULT 'Productive',
    duration_seconds INT DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE idle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all idle_logs" ON idle_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{
        maxWidth: "600px",
        width: "100%",
        padding: "32px",
        background: "rgba(10, 15, 29, 0.95)",
        border: "1px solid rgba(6, 182, 212, 0.3)",
        position: "relative",
        boxShadow: "0 0 40px rgba(0, 0, 0, 0.8)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer"
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            padding: "10px",
            borderRadius: "12px",
            background: "rgba(6, 182, 212, 0.15)",
            border: "1px solid rgba(6, 182, 212, 0.3)"
          }}>
            <Database size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "700" }}>
              Supabase Database Configuration
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Configure your cloud database connection manually
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {testStatus === "success" && (
          <div style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "#6ee7b7",
            fontSize: "0.85rem",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <CheckCircle2 size={16} />
            Connected to Supabase successfully!
          </div>
        )}

        {testStatus === "error" && (
          <div style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fca5a5",
            fontSize: "0.85rem",
            marginBottom: "16px"
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSaveAndTest} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              SUPABASE PROJECT URL
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="url"
                placeholder="https://your-project-id.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input-field"
                style={{ paddingLeft: "38px" }}
                required
              />
              <LinkIcon size={16} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              SUPABASE PUBLIC ANON KEY
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="input-field"
                style={{ paddingLeft: "38px", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                required
              />
              <Key size={16} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              type="submit"
              disabled={testStatus === "testing"}
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
            >
              {testStatus === "testing" ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Testing Connection...
                </>
              ) : (
                "Save & Connect to Supabase"
              )}
            </button>
            <button
              type="button"
              onClick={handleResetToLocal}
              className="btn-secondary"
            >
              Use Local Demo Mode
            </button>
          </div>
        </form>

        {/* Copy SQL Schema Helper */}
        <div style={{
          marginTop: "24px",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid var(--border-color)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#38bdf8" }}>
              Database Tables Setup (One-Click Copy)
            </span>
            <button
              type="button"
              onClick={copySqlSchema}
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              <Copy size={13} />
              {copiedSql ? "Copied SQL!" : "Copy SQL Script"}
            </button>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", lineHeight: 1.4 }}>
            Paste this SQL script into your Supabase Dashboard &gt; <strong>SQL Editor</strong> to create the 4 tables (`app_users`, `attendance`, `idle_logs`, `activity_logs`).
          </p>
        </div>

        {/* Desktop Python Agent Section */}
        <div style={{
          marginTop: "16px",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid var(--border-color)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Terminal size={16} color="var(--accent-purple)" />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#c084fc" }}>
              Desktop Background Agent (`desktop_agent.py`)
            </span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", lineHeight: 1.4, marginBottom: "8px" }}>
            To track external game windows (Steam, GTA, Minecraft) & YouTube desktop windows automatically:
          </p>
          <code style={{
            display: "block",
            padding: "8px 12px",
            background: "rgba(0, 0, 0, 0.5)",
            borderRadius: "6px",
            fontSize: "0.75rem",
            color: "#34d399",
            fontFamily: "var(--font-mono)"
          }}>
            python desktop_agent.py --user-id EMP101
          </code>
        </div>
      </div>
    </div>
  );
}
