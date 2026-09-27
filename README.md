# 🚀 Aura Monitor - Workplace Attendance & Activity Intelligence System

A production-grade, enterprise workplace monitoring and automated attendance application built with **React**, **Vite**, **Supabase PostgreSQL**, **Web Crypto API (SHA-256 Hashing)**, and an optional **Windows Native Desktop Agent**.

---

## 🌟 Key Features

### 1. 🔐 User ID & Password Management with SHA-256 Hashing
- **Custom User ID Registration**: Create any custom User ID (e.g. `EMP105`, `ADMIN002`), Name, Role (`employee` / `admin`), and Department.
- **Cryptographic Password Hashing**: Passwords are never stored in plain text. Hashed using **Web Crypto API SHA-256 with Salt** before saving to Supabase / database.
- **Quick Demo Accounts**: One-click demo buttons for testing:
  - `ADMIN001` (Admin console)
  - `EMP101` (Employee)
  - `EMP102` (Employee)
  *(Default password for demo accounts: `Password123!`)*

### 2. 📋 Automated Attendance on Login & History
- **Auto Check-In**: Immediately upon login, the system automatically checks in the employee for today's date with timestamp and status `Present`.
- **Live Shift Timer**: Live running stopwatch displaying work hours.
- **Attendance History Table**: Past dates, check-in times, break times, and attendance status.

### 3. 🛑 10-Second Inactivity Blackout Screen (Desktop Idle Agent)
- **Automatic Idle Detection**: Listens to mouse movement, clicks, keystrokes, touch, and scrolling.
- **10-Second Threshold**: If no interaction occurs for **10 seconds**, the screen locks instantly into a **full black/dark overlay**.
- **Live Idle Stopwatch**: Displays a pulsing digital stopwatch counting exact seconds/minutes away from work:
  `AWAY TIME: MM:SS`
- **Application Lockout**: The underlying work application is completely blocked and unreachable until unlocked.
- **Mandatory Break Justification**: To resume work, the employee must click **Resume Work** and select where they went:
  - ☕ *Tea / Coffee Break*
  - 🍱 *Lunch / Meal Break*
  - 🚻 *Restroom / Washroom*
  - 👥 *Internal Discussion / Meeting*
  - 📞 *Official / Urgent Phone Call*
  - ❓ *Custom Reason (Text Input)*
- **Database Logging**: Once confirmed, logs the exact start time, end time, duration, and reason to `idle_logs` and increments today's break tally in `attendance`.

### 4. 🌐 Visited Websites, Videos & Games Tracking
- **Tab & Window Focus Tracker**: Detects when an employee switches tabs or minimizes the work window (`visibilitychange`) and records time spent away.
- **In-App Activity Simulator**: Allows testing and recording visits to YouTube, Steam Gaming, VS Code, Instagram, etc.
- **Native Windows Desktop Agent (`desktop_agent.py`)**: Standalone background Python script that captures the active foreground window title (e.g., YouTube in Chrome, Steam, Roblox, Minecraft, Discord, GTA V) using native Windows APIs and directly syncs to Supabase.

### 5. 🛡️ Executive Admin Dashboard
- **Turnout Metrics**: Total registered employees, today's present count, active monitoring percentage.
- **Today's Attendance Master List**: Shows all employees with User ID, Name, Check-in Time, Breaks count, Total break time, and live status.
- **Universal User ID Search Box**: Type any User ID (e.g., `EMP101`) to immediately load their complete dossier:
  - **Profile & Attendance Summary**
  - **Full Attendance History**
  - **Idle & Break Log with Reasons and Durations**
  - **Visited Websites, Games & Application Activity Timeline**

---

## ⚡ How to Run the Web Application

The dev server is currently running:
```bash
# Start Vite development server
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 💾 Supabase Database Setup

1. Open your **Supabase Dashboard** ([https://supabase.com](https://supabase.com)).
2. Go to **SQL Editor** &gt; **New Query**.
3. Copy and run the entire SQL schema from [`supabase_schema.sql`](file:///d:/my%20monitoring%20project/supabase_schema.sql).
4. In the web application, click the **Connect Supabase** button in the top navbar.
5. Paste your **Supabase Project URL** and **Public Anon Key**, then click **Save & Connect to Supabase**.
*(Note: If Supabase is not connected, the application automatically uses local demo storage so everything works offline immediately!)*

---

## 🖥️ Running the Windows Desktop Agent (Optional)

To track actual Windows application titles (like PC games, YouTube in Chrome, Discord, etc.) in real time:
```bash
python desktop_agent.py --user-id EMP101 --supabase-url "YOUR_SUPABASE_URL" --anon-key "YOUR_ANON_KEY"
```
