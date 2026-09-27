import { getSupabase } from "./supabaseClient";
import { hashPassword, verifyPassword } from "./crypto";

// Local storage keys for fallback/mock mode
const STORAGE_KEYS = {
  USERS: "monitoring_users",
  ATTENDANCE: "monitoring_attendance",
  IDLE_LOGS: "monitoring_idle_logs",
  ACTIVITY_LOGS: "monitoring_activity_logs",
};

// Seed default initial mock users with pre-computed SHA-256 hashed passwords
// Default password for all demo accounts is "Password123!"
const DEFAULT_USERS = [
  {
    id: "u-admin-1",
    user_id: "ADMIN001",
    name: "Vikram Saravanan (Admin)",
    password_hash: "28e7e177bce9a0f443555543cf709772ee6b338605d6cb9a71a396263cb5352c", // Password123!
    role: "admin",
    department: "Executive & HR",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "u-emp-1",
    user_id: "EMP101",
    name: "Karthik Raja",
    password_hash: "28e7e177bce9a0f443555543cf709772ee6b338605d6cb9a71a396263cb5352c", // Password123!
    role: "employee",
    department: "Frontend Engineering",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "u-emp-2",
    user_id: "EMP102",
    name: "Sneha Ramachandran",
    password_hash: "28e7e177bce9a0f443555543cf709772ee6b338605d6cb9a71a396263cb5352c", // Password123!
    role: "employee",
    department: "Backend Engineering",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "u-emp-3",
    user_id: "EMP103",
    name: "Dinesh Kumar",
    password_hash: "28e7e177bce9a0f443555543cf709772ee6b338605d6cb9a71a396263cb5352c", // Password123!
    role: "employee",
    department: "QA & Testing",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

// Helper to initialize local storage demo data
function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const sampleAttendance = [
      {
        id: "att-001",
        user_id: "EMP102",
        date: todayStr,
        check_in_time: new Date(Date.now() - 4 * 3600000).toISOString(),
        check_out_time: null,
        status: "Present",
        total_active_seconds: 13200,
        total_idle_seconds: 1200,
      },
      {
        id: "att-002",
        user_id: "EMP103",
        date: todayStr,
        check_in_time: new Date(Date.now() - 3.5 * 3600000).toISOString(),
        check_out_time: null,
        status: "Present",
        total_active_seconds: 11000,
        total_idle_seconds: 1600,
      },
      {
        id: "att-003",
        user_id: "EMP101",
        date: yesterdayStr,
        check_in_time: new Date(Date.now() - 86400000 - 8 * 3600000).toISOString(),
        check_out_time: new Date(Date.now() - 86400000).toISOString(),
        status: "Present",
        total_active_seconds: 28800,
        total_idle_seconds: 2400,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sampleAttendance));
  }
  if (!localStorage.getItem(STORAGE_KEYS.IDLE_LOGS)) {
    const sampleIdle = [
      {
        id: "idle-1",
        user_id: "EMP102",
        start_time: new Date(Date.now() - 2 * 3600000).toISOString(),
        end_time: new Date(Date.now() - 2 * 3600000 + 420000).toISOString(),
        duration_seconds: 420,
        reason: "☕ Tea / Coffee Break",
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: "idle-2",
        user_id: "EMP103",
        start_time: new Date(Date.now() - 1 * 3600000).toISOString(),
        end_time: new Date(Date.now() - 1 * 3600000 + 780000).toISOString(),
        duration_seconds: 780,
        reason: "🍱 Lunch Break",
        created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.IDLE_LOGS, JSON.stringify(sampleIdle));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
    const sampleActivities = [
      {
        id: "act-1",
        user_id: "EMP102",
        activity_type: "website",
        title: "GitHub - Pull Request Review #142",
        url_or_app: "https://github.com/project/core",
        category: "Productive",
        duration_seconds: 3600,
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: "act-2",
        user_id: "EMP102",
        activity_type: "website",
        title: "YouTube - Lo-Fi Beats for Coding 24/7",
        url_or_app: "https://youtube.com/watch?v=lofi",
        category: "Entertainment",
        duration_seconds: 1400,
        timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      },
      {
        id: "act-3",
        user_id: "EMP103",
        activity_type: "tab_switch",
        title: "Steam - Counter Strike 2 (Minimized Work Tab)",
        url_or_app: "steam://rungameid/730",
        category: "Gaming",
        duration_seconds: 900,
        timestamp: new Date(Date.now() - 1.2 * 3600000).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(sampleActivities));
  }
}

// Call on startup
initLocalStorage();

/**
 * Register / Create a new User ID and Password
 * Passwords are automatically hashed with SHA-256 before storing!
 */
export async function registerUser({ userId, name, password, role = "employee", department = "Engineering" }) {
  const cleanUserId = userId.trim().toUpperCase();
  const passwordHash = await hashPassword(password);
  const supabase = getSupabase();

  if (supabase) {
    // 1. Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from("app_users")
      .select("user_id")
      .eq("user_id", cleanUserId)
      .maybeSingle();

    if (existing) {
      throw new Error(`User ID "${cleanUserId}" already exists! Please choose another ID.`);
    }

    // 2. Insert new user
    const { data, error } = await supabase
      .from("app_users")
      .insert([
        {
          user_id: cleanUserId,
          name: name.trim(),
          password_hash: passwordHash,
          role,
          department,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase user registration error:", error);
      throw new Error(error.message || "Failed to register user in Supabase");
    }
    return data;
  } else {
    // LocalStorage Fallback
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    if (users.some((u) => u.user_id.toUpperCase() === cleanUserId)) {
      throw new Error(`User ID "${cleanUserId}" already exists!`);
    }

    const newUser = {
      id: "u-" + Date.now(),
      user_id: cleanUserId,
      name: name.trim(),
      password_hash: passwordHash,
      role,
      department,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  }
}

/**
 * Login User & Automatically Mark Attendance for Today
 */
export async function loginAndMarkAttendance({ userId, password }) {
  const cleanUserId = userId.trim().toUpperCase();
  const passwordHash = await hashPassword(password);
  const supabase = getSupabase();
  const todayStr = new Date().toISOString().split("T")[0];

  let user = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("user_id", cleanUserId)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`User ID "${cleanUserId}" not found in Supabase!`);
    }

    if (data.password_hash !== passwordHash) {
      throw new Error("Invalid password! Please check your credentials.");
    }

    user = data;

    // Automatically Record Attendance for Today
    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", cleanUserId)
      .eq("date", todayStr)
      .maybeSingle();

    let todayAttendance = existingAttendance;

    if (!existingAttendance) {
      const { data: newAtt, error: attError } = await supabase
        .from("attendance")
        .insert([
          {
            user_id: cleanUserId,
            date: todayStr,
            check_in_time: new Date().toISOString(),
            status: "Present",
            total_active_seconds: 0,
            total_idle_seconds: 0,
          },
        ])
        .select()
        .single();

      if (attError) {
        console.warn("Could not insert attendance:", attError);
      } else {
        todayAttendance = newAtt;
      }
    }

    return { user, attendance: todayAttendance, isSupabase: true };
  } else {
    // LocalStorage Mode
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    user = users.find((u) => u.user_id.toUpperCase() === cleanUserId);

    if (!user) {
      throw new Error(`User ID "${cleanUserId}" not found!`);
    }

    if (user.password_hash !== passwordHash) {
      throw new Error("Invalid password!");
    }

    // Auto mark attendance in local storage
    const attendanceList = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]");
    let todayAttendance = attendanceList.find((a) => a.user_id === cleanUserId && a.date === todayStr);

    if (!todayAttendance) {
      todayAttendance = {
        id: "att-" + Date.now(),
        user_id: cleanUserId,
        date: todayStr,
        check_in_time: new Date().toISOString(),
        check_out_time: null,
        status: "Present",
        total_active_seconds: 0,
        total_idle_seconds: 0,
      };
      attendanceList.unshift(todayAttendance);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceList));
    }

    return { user, attendance: todayAttendance, isSupabase: false };
  }
}

/**
 * Fetch Attendance History for a specific user
 */
export async function getAttendanceHistory(userId) {
  const cleanUserId = userId.trim().toUpperCase();
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", cleanUserId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching attendance:", error);
      return [];
    }
    return data || [];
  } else {
    const attendanceList = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]");
    return attendanceList.filter((a) => a.user_id.toUpperCase() === cleanUserId);
  }
}

/**
 * Record Idle & Break Log (Triggered when user clicks Resume on 10s idle screen)
 * SAVED IN MINUTES AS REQUESTED!
 */
export async function recordIdleLog({ userId, startTime, endTime, durationSeconds, reason }) {
  const cleanUserId = userId.trim().toUpperCase();
  const supabase = getSupabase();
  const todayStr = new Date().toISOString().split("T")[0];

  // Convert seconds to minutes (e.g. 120s -> 2 mins, 90s -> 1.5 mins, 10s -> 0.2 mins)
  const durationMinutes = Math.max(0.1, Number((durationSeconds / 60).toFixed(1)));
  const formattedReason = reason.includes("mins") ? reason : `${reason} (${durationMinutes} mins)`;

  const logEntry = {
    user_id: cleanUserId,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_seconds: durationMinutes, // Saved in MINUTES
    reason: formattedReason,
  };

  if (supabase) {
    // 1. Insert into idle_logs table
    await supabase.from("idle_logs").insert([logEntry]);

    // 2. Increment total_idle_seconds in attendance (in minutes)
    const { data: att } = await supabase
      .from("attendance")
      .select("id, total_idle_seconds")
      .eq("user_id", cleanUserId)
      .eq("date", todayStr)
      .maybeSingle();

    if (att) {
      await supabase
        .from("attendance")
        .update({
          total_idle_seconds: Number(((att.total_idle_seconds || 0) + durationMinutes).toFixed(1)),
        })
        .eq("id", att.id);
    }
  } else {
    // LocalStorage
    const idleLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.IDLE_LOGS) || "[]");
    const newLog = {
      id: "idle-" + Date.now(),
      ...logEntry,
      created_at: new Date().toISOString(),
    };
    idleLogs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.IDLE_LOGS, JSON.stringify(idleLogs));

    // Update attendance in local storage (in minutes)
    const attendanceList = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]");
    const todayAtt = attendanceList.find((a) => a.user_id === cleanUserId && a.date === todayStr);
    if (todayAtt) {
      todayAtt.total_idle_seconds = Number(((todayAtt.total_idle_seconds || 0) + durationMinutes).toFixed(1));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceList));
    }
  }
}

/**
 * Fetch Idle & Break Logs for a user
 */
export async function getIdleLogs(userId) {
  const cleanUserId = userId.trim().toUpperCase();
  const supabase = getSupabase();

  if (supabase) {
    const { data } = await supabase
      .from("idle_logs")
      .select("*")
      .eq("user_id", cleanUserId)
      .order("start_time", { ascending: false });
    return data || [];
  } else {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.IDLE_LOGS) || "[]");
    return logs.filter((l) => l.user_id.toUpperCase() === cleanUserId);
  }
}

/**
 * Record Visited Website / Application Activity Log
 */
export async function recordActivityLog({ userId, activityType, title, urlOrApp, category = "Productive", durationSeconds = 0 }) {
  const cleanUserId = userId.trim().toUpperCase();
  const supabase = getSupabase();

  const activityEntry = {
    user_id: cleanUserId,
    activity_type: activityType || "website",
    title: title.trim(),
    url_or_app: urlOrApp || "",
    category: category,
    duration_seconds: durationSeconds,
    timestamp: new Date().toISOString(),
  };

  if (supabase) {
    const { error } = await supabase.from("activity_logs").insert([activityEntry]);
    if (error) console.error("Error logging activity to Supabase:", error);
  } else {
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS) || "[]");
    activities.unshift({
      id: "act-" + Date.now(),
      ...activityEntry,
    });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activities));
  }
}

/**
 * Fetch Activity Logs for a user (Websites, YouTube, Games, Apps)
 */
export async function getActivityLogs(userId) {
  const cleanUserId = userId.trim().toUpperCase();
  const supabase = getSupabase();

  if (supabase) {
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", cleanUserId)
      .order("timestamp", { ascending: false });
    return data || [];
  } else {
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS) || "[]");
    return activities.filter((a) => a.user_id.toUpperCase() === cleanUserId);
  }
}

/**
 * Admin: Get All Users and Today's Attendance Overview
 */
export async function getAdminOverview() {
  const supabase = getSupabase();
  const todayStr = new Date().toISOString().split("T")[0];

  if (supabase) {
    const [usersRes, attendanceRes, idleRes, activityRes] = await Promise.all([
      supabase.from("app_users").select("id, user_id, name, role, department, created_at"),
      supabase.from("attendance").select("*").eq("date", todayStr),
      supabase.from("idle_logs").select("*"),
      supabase.from("activity_logs").select("*"),
    ]);

    const users = usersRes.data || [];
    const todayAttendance = attendanceRes.data || [];
    const idleLogs = idleRes.data || [];
    const activityLogs = activityRes.data || [];

    // Map user list with today's attendance status
    const userAttendanceMap = users.map((u) => {
      const att = todayAttendance.find((a) => a.user_id === u.user_id);
      const userIdleToday = idleLogs.filter((i) => i.user_id === u.user_id && i.start_time.startsWith(todayStr));
      const userActivitiesToday = activityLogs.filter((a) => a.user_id === u.user_id && a.timestamp.startsWith(todayStr));

      return {
        ...u,
        isPresentToday: !!att,
        checkInTime: att ? att.check_in_time : null,
        totalActiveSeconds: att ? att.total_active_seconds : 0,
        totalIdleSeconds: att ? att.total_idle_seconds : 0,
        breaksCountToday: userIdleToday.length,
        activitiesCountToday: userActivitiesToday.length,
        status: att ? "Present" : "Absent",
      };
    });

    return {
      totalEmployees: users.filter((u) => u.role === "employee").length,
      presentTodayCount: todayAttendance.length,
      usersWithAttendance: userAttendanceMap,
      allUsers: users,
    };
  } else {
    // LocalStorage
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]");
    const idleLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.IDLE_LOGS) || "[]");
    const activityLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS) || "[]");

    const todayAttendance = attendance.filter((a) => a.date === todayStr);

    const userAttendanceMap = users.map((u) => {
      const att = todayAttendance.find((a) => a.user_id.toUpperCase() === u.user_id.toUpperCase());
      const userIdleToday = idleLogs.filter((i) => i.user_id.toUpperCase() === u.user_id.toUpperCase() && i.start_time.startsWith(todayStr));
      const userActivitiesToday = activityLogs.filter((a) => a.user_id.toUpperCase() === u.user_id.toUpperCase() && a.timestamp.startsWith(todayStr));

      return {
        ...u,
        isPresentToday: !!att,
        checkInTime: att ? att.check_in_time : null,
        totalActiveSeconds: att ? att.total_active_seconds : 0,
        totalIdleSeconds: att ? att.total_idle_seconds : 0,
        breaksCountToday: userIdleToday.length,
        activitiesCountToday: userActivitiesToday.length,
        status: att ? "Present" : "Absent",
      };
    });

    return {
      totalEmployees: users.filter((u) => u.role === "employee").length,
      presentTodayCount: todayAttendance.length,
      usersWithAttendance: userAttendanceMap,
      allUsers: users,
    };
  }
}

/**
 * Admin: Get Complete Dossier / History for a specific User ID
 */
export async function getAdminUserDetails(userId) {
  const cleanUserId = userId.trim().toUpperCase();
  const supabase = getSupabase();

  if (supabase) {
    const [userRes, attendanceRes, idleRes, activityRes] = await Promise.all([
      supabase.from("app_users").select("*").eq("user_id", cleanUserId).maybeSingle(),
      supabase.from("attendance").select("*").eq("user_id", cleanUserId).order("date", { ascending: false }),
      supabase.from("idle_logs").select("*").eq("user_id", cleanUserId).order("start_time", { ascending: false }),
      supabase.from("activity_logs").select("*").eq("user_id", cleanUserId).order("timestamp", { ascending: false }),
    ]);

    if (!userRes.data) {
      return null;
    }

    return {
      user: userRes.data,
      attendanceHistory: attendanceRes.data || [],
      idleLogs: idleRes.data || [],
      activityLogs: activityRes.data || [],
    };
  } else {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    const user = users.find((u) => u.user_id.toUpperCase() === cleanUserId);
    if (!user) return null;

    const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]").filter((a) => a.user_id.toUpperCase() === cleanUserId);
    const idleLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.IDLE_LOGS) || "[]").filter((i) => i.user_id.toUpperCase() === cleanUserId);
    const activityLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS) || "[]").filter((a) => a.user_id.toUpperCase() === cleanUserId);

    return {
      user,
      attendanceHistory: attendance,
      idleLogs,
      activityLogs,
    };
  }
}
