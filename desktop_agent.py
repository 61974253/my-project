"""
====================================================================
SMART DESKTOP ACTIVITY & 10-SECOND INACTIVITY LOCK AGENT (WINDOWS)
====================================================================
This agent runs system-wide in the background on Windows:
1. Tracks system-wide mouse & keyboard inactivity using native Windows API.
2. Even if the web app is CLOSED or MINIMIZED, after 10 seconds of no movement
   anywhere on the screen, a full BLACK SCREEN LOCK OVERLAY with live stopwatch pops up!
3. User must click "Resume Work" and select a break reason to unlock.
4. Logs idle duration & reason directly to Supabase 'idle_logs' table.
5. Monitors active window titles (YouTube, Steam Games, Discord, Apps) and logs to 'activity_logs'.
6. 100% native Python (ctypes + tkinter) - No external pip dependencies needed!

Run command:
python desktop_agent.py --user-id EMP101 --supabase-url "YOUR_SUPABASE_URL" --anon-key "YOUR_ANON_KEY"
"""

import os
import sys
import time
import json
import argparse
import urllib.request
import urllib.error
import threading
from datetime import datetime, timezone
import ctypes
from ctypes import wintypes
import tkinter as tk
from tkinter import ttk

def load_env_file():
    """Automatically loads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env file."""
    env_vars = {}
    for filename in [".env", ".env.local"]:
        if os.path.exists(filename):
            try:
                with open(filename, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, val = line.split("=", 1)
                            env_vars[key.strip()] = val.strip().strip('"').strip("'")
            except Exception as e:
                pass
    return env_vars

# Windows API
user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]

def get_system_idle_seconds():
    """Returns exact seconds since last mouse move, click, or keystroke on Windows."""
    lii = LASTINPUTINFO()
    lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
    if user32.GetLastInputInfo(ctypes.byref(lii)):
        millis = kernel32.GetTickCount() - lii.dwTime
        return millis / 1000.0
    return 0.0

def get_active_window_title():
    """Returns title of foreground window."""
    hwnd = user32.GetForegroundWindow()
    if not hwnd:
        return "Desktop / Idle"
    length = user32.GetWindowTextLengthW(hwnd)
    if length == 0:
        return "Desktop / Idle"
    buff = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buff, length + 1)
    return buff.value

def categorize_activity(title):
    t = title.lower()
    if any(k in t for k in ["game", "steam", "roblox", "minecraft", "valorant", "gta", "counter-strike", "league"]):
        return "Gaming"
    if any(k in t for k in ["youtube", "netflix", "prime video", "twitch", "hotstar", "spotify", "vlc", "media player"]):
        return "Entertainment"
    if any(k in t for k in ["instagram", "facebook", "twitter", "x.com", "reddit", "whatsapp", "telegram", "discord"]):
        return "Social Media"
    return "Productive"

def post_to_supabase(supabase_url, anon_key, endpoint_path, payload):
    if not supabase_url or not anon_key:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [LOCAL MOCK SYNC] -> {endpoint_path}: {json.dumps(payload)}")
        return
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/{endpoint_path}"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status in [200, 201]:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Synced to Supabase: {endpoint_path}")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Supabase Sync Error ({endpoint_path}): {e}")

# =====================================================================
# FULLSCREEN DESKTOP BLACKOUT LOCK SCREEN (TKINTER)
# =====================================================================
class DesktopBlackScreenLock:
    def __init__(self, user_id, supabase_url, anon_key, idle_start_sec, on_unlock_callback):
        self.user_id = user_id
        self.supabase_url = supabase_url
        self.anon_key = anon_key
        self.idle_start_time = datetime.now()
        self.initial_idle_sec = int(idle_start_sec)
        self.on_unlock_callback = on_unlock_callback

        self.root = tk.Tk()
        self.root.title("Workstation Locked - Aura Inactivity Agent")
        
        # 100% Screen Occupation (Covers Taskbar, No Windows borders)
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        self.root.geometry(f"{screen_w}x{screen_h}+0+0")
        self.root.configure(bg="#000000")
        
        # OverrideRedirect removes title bar & forces complete takeover of taskbar
        self.root.overrideredirect(True)
        self.root.attributes("-fullscreen", True)
        self.root.attributes("-topmost", True)
        
        # Prevent Alt+F4 / Window Close
        self.root.protocol("WM_DELETE_WINDOW", lambda: None)

        # Enforce continuous topmost focus (blocks user from switching windows)
        self.root.bind("<FocusOut>", lambda e: self.enforce_lockdown())
        
        # Emergency escape (ESC key) for safe testing
        self.root.bind("<Escape>", lambda e: self.unlock("Emergency Escape / Work Resumed"))

        self.elapsed_seconds = self.initial_idle_sec
        self.selected_reason = tk.StringVar(value="☕ Tea / Coffee Break")
        self.custom_reason = tk.StringVar()

        self.build_ui()
        self.update_timer()
        self.enforce_lockdown()

    def enforce_lockdown(self):
        """Continuously pulls lock screen to the absolute front and locks focus."""
        try:
            self.root.lift()
            self.root.attributes("-topmost", True)
            self.root.focus_force()
            self.root.grab_set()
            self.root.after(300, self.enforce_lockdown)
        except:
            pass

    def build_ui(self):
        # Center container
        frame = tk.Frame(self.root, bg="#0d1424", bd=2, relief="solid", padx=40, pady=35)
        frame.place(relx=0.5, rely=0.5, anchor="center")

        # Hazard Badge
        badge = tk.Label(
            frame,
            text="⚠️ WORKSTATION LOCKED • 10s DESKTOP INACTIVITY DETECTED",
            font=("Segoe UI", 10, "bold"),
            fg="#f87171",
            bg="#221118",
            padx=16,
            pady=6
        )
        badge.pack(pady=(0, 15))

        # Title
        title = tk.Label(
            frame,
            text="Inactivity Detected on Screen",
            font=("Segoe UI", 22, "bold"),
            fg="#ffffff",
            bg="#0d1424"
        )
        title.pack()

        # Description
        desc = tk.Label(
            frame,
            text=f"Employee ID: {self.user_id} • Mouse & keyboard were inactive for over 10 seconds.\nWork session is paused. Time is being tracked.",
            font=("Segoe UI", 10),
            fg="#94a3b8",
            bg="#0d1424",
            justify="center"
        )
        desc.pack(pady=(6, 18))

        # Digital Stopwatch Box
        timer_box = tk.Frame(frame, bg="#050811", bd=1, relief="solid", padx=30, pady=15)
        timer_box.pack(fill="x", pady=(0, 20))

        timer_lbl = tk.Label(timer_box, text="TOTAL TIME WASTED / AWAY", font=("Segoe UI", 8, "bold"), fg="#64748b", bg="#050811")
        timer_lbl.pack()

        self.time_display = tk.Label(
            timer_box,
            text="00:10",
            font=("Consolas", 42, "bold"),
            fg="#f87171",
            bg="#050811"
        )
        self.time_display.pack()

        timer_sub = tk.Label(timer_box, text="⏱️ Break duration is being logged to attendance record", font=("Segoe UI", 8), fg="#fca5a5", bg="#050811")
        timer_sub.pack(pady=(4, 0))

        # Break Reason Dropdown
        reason_lbl = tk.Label(frame, text="Where did you go? Select Break Reason:", font=("Segoe UI", 10, "bold"), fg="#34d399", bg="#0d1424", anchor="w")
        reason_lbl.pack(fill="x", pady=(0, 6))

        reasons = [
            "☕ Tea / Coffee Break",
            "🍱 Lunch / Meal Break",
            "🚻 Restroom / Washroom Break",
            "👥 Discussion / Internal Meeting",
            "📞 Phone Call / Urgent Call",
            "❓ Other (Custom Reason)"
        ]

        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TCombobox", fieldbackground="#1e293b", background="#334155", foreground="#ffffff")
        
        self.combo = ttk.Combobox(frame, values=reasons, textvariable=self.selected_reason, state="readonly", font=("Segoe UI", 10), width=35)
        self.combo.pack(fill="x", pady=(0, 10))

        # Custom Reason Entry
        self.entry_frame = tk.Frame(frame, bg="#0d1424")
        self.custom_entry = tk.Entry(self.entry_frame, textvariable=self.custom_reason, font=("Segoe UI", 10), bg="#1e293b", fg="#ffffff", insertbackground="#ffffff")
        self.custom_entry.pack(fill="x")

        def on_combo_change(event):
            if "Other" in self.selected_reason.get():
                self.entry_frame.pack(fill="x", pady=(0, 10))
            else:
                self.entry_frame.pack_forget()

        self.combo.bind("<<ComboboxSelected>>", on_combo_change)

        # Unlock Button
        unlock_btn = tk.Button(
            frame,
            text="▶️ RESUME WORK & UNLOCK SCREEN",
            font=("Segoe UI", 12, "bold"),
            bg="#10b981",
            fg="#ffffff",
            activebackground="#059669",
            activeforeground="#ffffff",
            relief="flat",
            padx=20,
            pady=12,
            cursor="hand2",
            command=self.handle_unlock_click
        )
        unlock_btn.pack(fill="x", pady=(10, 0))

        # Escape hint
        esc_hint = tk.Label(frame, text="Press ESC or Submit Reason to return to desktop.", font=("Segoe UI", 8), fg="#475569", bg="#0d1424")
        esc_hint.pack(pady=(12, 0))

    def update_timer(self):
        mins = self.elapsed_seconds // 60
        secs = self.elapsed_seconds % 60
        hrs = mins // 60
        if hrs > 0:
            time_str = f"{hrs:02d}:{mins%60:02d}:{secs:02d}"
        else:
            time_str = f"{mins:02d}:{secs:02d}"
        self.time_display.config(text=time_str)
        self.elapsed_seconds += 1
        self.root.after(1000, self.update_timer)

    def handle_unlock_click(self):
        reason = self.selected_reason.get()
        if "Other" in reason:
            custom = self.custom_reason.get().strip()
            reason = custom if custom else "Unspecified Break"
        self.unlock(reason)

    def unlock(self, reason):
        duration_sec = self.elapsed_seconds
        # Convert seconds to minutes (e.g. 120s -> 2.0 mins, 30s -> 0.5 mins)
        duration_min = round(duration_sec / 60.0, 1)
        if duration_min < 0.1:
            duration_min = 0.2
            
        end_time = datetime.now()
        clean_reason = reason if "mins" in reason else f"{reason} ({duration_min} mins)"
        
        # Log to Supabase in MINUTES
        payload = {
            "user_id": self.user_id.upper(),
            "start_time": self.idle_start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_seconds": duration_min, # Saved in MINUTES as requested!
            "reason": clean_reason
        }
        post_to_supabase(self.supabase_url, self.anon_key, "idle_logs", payload)

        print(f"[{datetime.now().strftime('%H:%M:%S')}] Workstation Unlocked: Break reason '{clean_reason}' ({duration_min} mins)")
        
        try:
            self.root.destroy()
        except:
            pass
            
        if self.on_unlock_callback:
            self.on_unlock_callback()

# =====================================================================
# MAIN MONITORING LOOP
# =====================================================================
def main():
    env_vars = load_env_file()
    default_supabase_url = env_vars.get("VITE_SUPABASE_URL", "")
    if "your-project-id" in default_supabase_url:
        default_supabase_url = ""
    default_anon_key = env_vars.get("VITE_SUPABASE_ANON_KEY", "")
    if "your-anon-key" in default_anon_key:
        default_anon_key = ""

    parser = argparse.ArgumentParser(description="Desktop Activity & 10s Inactivity Lock Agent")
    parser.add_argument("--user-id", default="EMP101", help="User ID of employee")
    parser.add_argument("--supabase-url", default=default_supabase_url, help="Your Supabase Project URL (Auto-read from .env)")
    parser.add_argument("--anon-key", default=default_anon_key, help="Your Supabase Public Anon Key (Auto-read from .env)")
    parser.add_argument("--idle-threshold", type=int, default=10, help="Inactivity threshold in seconds (default: 10s)")
    
    args = parser.parse_args()

    print("=" * 70)
    print(" 🚀 AURA DESKTOP ACTIVITY & 10-SECOND INACTIVITY LOCK AGENT ACTIVE")
    print(f" 👤 Monitored User ID:    {args.user_id.upper()}")
    print(f" ⏱️ Inactivity Lock Time: {args.idle_threshold}s")
    print(f" 🔗 Supabase Connected:   {'YES' if args.supabase_url else 'NO (Local Console Log Mode)'}")
    print("=" * 70)
    print("Monitoring system-wide activity (mouse, keyboard, games, YouTube, apps)...")
    print("If mouse/keyboard is idle for 10s anywhere on Windows, black lock screen will appear!")
    print("Press Ctrl+C to terminate.")

    is_currently_locked = False
    last_title = ""
    title_time = 0

    def on_unlocked():
        nonlocal is_currently_locked
        is_currently_locked = False

    try:
        while True:
            # 1. Check System-Wide Inactivity (Mouse & Keyboard anywhere on Windows)
            idle_sec = get_system_idle_seconds()
            
            # Active window title check
            current_title = get_active_window_title().strip()
            if not current_title:
                current_title = "Desktop / Idle"

            # Check if user is currently inside the web app
            is_inside_web_app = "Aura Monitor" in current_title or "localhost:5173" in current_title or "my-monitoring-project" in current_title

            # Requirement:
            # "appkulla irukkumpothu vara venaam app aah close pannalum oru ten seconds kalichu entha moment iruntha antha black screen vanthudanumda"
            # When the web app is closed or minimized or user is on any other window/game/desktop,
            # and no movement occurs for 10 seconds:
            if idle_sec >= args.idle_threshold and not is_currently_locked:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🛑 10s System Inactivity Detected! Triggering Fullscreen Black Lock Screen...")
                is_currently_locked = True
                
                # Launch Fullscreen Desktop Black Screen Lock
                lock_screen = DesktopBlackScreenLock(
                    user_id=args.user_id,
                    supabase_url=args.supabase_url,
                    anon_key=args.anon_key,
                    idle_start_sec=idle_sec,
                    on_unlock_callback=on_unlocked
                )
                lock_screen.root.mainloop()

            # 2. Track Window Activity (Games, YouTube, Discord, Apps)
            if not is_currently_locked:
                if current_title == last_title:
                    title_time += 1
                else:
                    if last_title and title_time >= 5:
                        category = categorize_activity(last_title)
                        payload = {
                            "user_id": args.user_id.upper(),
                            "activity_type": "window_active",
                            "title": last_title,
                            "url_or_app": last_title,
                            "category": category,
                            "duration_seconds": title_time,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                        post_to_supabase(args.supabase_url, args.anon_key, "activity_logs", payload)
                    last_title = current_title
                    title_time = 1

                # Periodic log if staying in same window for 30s
                if title_time >= 30:
                    category = categorize_activity(last_title)
                    payload = {
                        "user_id": args.user_id.upper(),
                        "activity_type": "window_active",
                        "title": last_title,
                        "url_or_app": last_title,
                        "category": category,
                        "duration_seconds": title_time,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    post_to_supabase(args.supabase_url, args.anon_key, "activity_logs", payload)
                    title_time = 0

            time.sleep(1)

    except KeyboardInterrupt:
        print("\nDesktop Agent stopped.")

if __name__ == "__main__":
    main()
