import React, { useState } from "react";
import { KeyRound, UserCheck, ShieldCheck, Lock, Sparkles, Building, Hash, Eye, EyeOff } from "lucide-react";
import { loginAndMarkAttendance, registerUser } from "../services/dataService";

export default function AuthView({ onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [loginUserId, setLoginUserId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regUserId, setRegUserId] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState("employee");
  const [regDepartment, setRegDepartment] = useState("Engineering");

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!loginUserId.trim() || !loginPassword) {
      setErrorMsg("Please enter both User ID and Password.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginAndMarkAttendance({
        userId: loginUserId,
        password: loginPassword,
      });
      setSuccessMsg(`Welcome back, ${result.user.name}! Attendance marked successfully.`);
      setTimeout(() => {
        onLoginSuccess(result.user, result.attendance);
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regUserId.trim() || !regName.trim() || !regPassword) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const newUser = await registerUser({
        userId: regUserId,
        name: regName,
        password: regPassword,
        role: regRole,
        department: regDepartment,
      });

      setSuccessMsg(`Account created for ${newUser.name} (ID: ${newUser.user_id})! Password safely hashed.`);
      // Automatically log in with new credentials
      const loginResult = await loginAndMarkAttendance({
        userId: newUser.user_id,
        password: regPassword,
      });
      setTimeout(() => {
        onLoginSuccess(loginResult.user, loginResult.attendance);
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo user
  const quickFill = (userId, password) => {
    setIsLoginTab(true);
    setLoginUserId(userId);
    setLoginPassword(password);
    setErrorMsg("");
  };

  return (
    <div style={{
      maxWidth: "520px",
      margin: "40px auto",
      padding: "0 16px",
      animation: "fadeIn 0.3s ease-in-out"
    }}>
      <div className="glass-panel" style={{
        padding: "36px 32px",
        background: "rgba(13, 19, 33, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Ambient Top Glow */}
        <div style={{
          position: "absolute",
          top: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "240px",
          height: "120px",
          background: isLoginTab ? "var(--accent-cyan)" : "var(--accent-purple)",
          filter: "blur(60px)",
          opacity: 0.25,
          pointerEvents: "none"
        }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            padding: "10px",
            borderRadius: "14px",
            background: isLoginTab ? "rgba(6, 182, 212, 0.12)" : "rgba(139, 92, 246, 0.12)",
            border: `1px solid ${isLoginTab ? "rgba(6, 182, 212, 0.3)" : "rgba(139, 92, 246, 0.3)"}`,
            marginBottom: "14px"
          }}>
            {isLoginTab ? (
              <KeyRound size={26} color="var(--accent-cyan)" />
            ) : (
              <UserCheck size={26} color="var(--accent-purple)" />
            )}
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.01em" }}>
            {isLoginTab ? "Employee & Admin Login" : "Create New User Account"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "6px" }}>
            {isLoginTab
              ? "Sign in to clock-in attendance & activate monitoring agent"
              : "Register custom User ID with automated SHA-256 hashed password"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: "flex",
          background: "rgba(15, 23, 42, 0.8)",
          padding: "4px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          marginBottom: "24px"
        }}>
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setErrorMsg(""); }}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              background: isLoginTab ? "rgba(6, 182, 212, 0.2)" : "transparent",
              color: isLoginTab ? "#38bdf8" : "var(--text-muted)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginTab(false); setErrorMsg(""); }}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              background: !isLoginTab ? "rgba(139, 92, 246, 0.25)" : "transparent",
              color: !isLoginTab ? "#c084fc" : "var(--text-muted)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Register New User ID
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fca5a5",
            fontSize: "0.85rem",
            marginBottom: "18px"
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "#6ee7b7",
            fontSize: "0.85rem",
            marginBottom: "18px"
          }}>
            ✓ {successMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {isLoginTab ? (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                USER ID
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="e.g. EMP101 or ADMIN001"
                  value={loginUserId}
                  onChange={(e) => setLoginUserId(e.target.value)}
                  className="input-field"
                  style={{ textTransform: "uppercase", paddingLeft: "40px" }}
                  required
                />
                <Hash size={18} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: "40px", paddingRight: "40px" }}
                  required
                />
                <Lock size={18} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Attendance Auto-Mark Alert */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(6, 182, 212, 0.08)",
              border: "1px dashed rgba(6, 182, 212, 0.3)",
              fontSize: "0.78rem",
              color: "#7dd3fc"
            }}>
              <Sparkles size={16} color="var(--accent-cyan)" />
              <span>Logging in automatically registers your <strong>Today's Attendance</strong> and activates the Desktop Idle Agent.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                justifyContent: "center",
                fontSize: "1rem",
                marginTop: "4px"
              }}
            >
              {loading ? "Authenticating & Marking Attendance..." : "Sign In & Mark Attendance"}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  USER ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. EMP105"
                  value={regUserId}
                  onChange={(e) => setRegUserId(e.target.value)}
                  className="input-field"
                  style={{ textTransform: "uppercase" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  ROLE *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="input-field"
                  style={{ height: "46px" }}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                FULL NAME *
              </label>
              <input
                type="text"
                placeholder="e.g. Arun Kumar"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                DEPARTMENT
              </label>
              <input
                type="text"
                placeholder="e.g. Software Development"
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  PASSWORD *
                </label>
                <input
                  type="password"
                  placeholder="Min 6 chars"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  CONFIRM *
                </label>
                <input
                  type="password"
                  placeholder="Re-type password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Password Hashing Security Guarantee */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(139, 92, 246, 0.08)",
              border: "1px dashed rgba(139, 92, 246, 0.3)",
              fontSize: "0.78rem",
              color: "#d8b4fe"
            }}>
              <ShieldCheck size={16} color="var(--accent-purple)" />
              <span>Passcode is cryptographically hashed with <strong>SHA-256</strong> before database storage. Plain text is never stored.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                justifyContent: "center",
                fontSize: "1rem",
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)"
              }}
            >
              {loading ? "Encrypting & Storing in DB..." : "Create Account & Mark Attendance"}
            </button>
          </form>
        )}

        {/* Demo Fast-Fill Accounts */}
        <div style={{
          marginTop: "28px",
          paddingTop: "20px",
          borderTop: "1px solid var(--border-color)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
            ⚡ Fast Testing Demo Accounts (Password: Password123!)
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => quickFill("ADMIN001", "Password123!")}
              className="btn-secondary"
              style={{ fontSize: "0.76rem", padding: "6px 10px" }}
            >
              🛡️ Admin: ADMIN001
            </button>
            <button
              type="button"
              onClick={() => quickFill("EMP101", "Password123!")}
              className="btn-secondary"
              style={{ fontSize: "0.76rem", padding: "6px 10px" }}
            >
              👤 Employee: EMP101
            </button>
            <button
              type="button"
              onClick={() => quickFill("EMP102", "Password123!")}
              className="btn-secondary"
              style={{ fontSize: "0.76rem", padding: "6px 10px" }}
            >
              👤 Employee: EMP102
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
