"use client";
import React, { useState, useEffect } from "react";
import { FaUtensils, FaBed, FaSmile, FaCheck, FaTimes, FaSave, FaChild, FaClock } from "react-icons/fa";
import { useColor } from "./ColorContext";

interface Student {
  _id: string;
  name: string;
  surname: string;
  user_ID: string;
}

interface Group {
  _id: string;
  classname: string;
}

interface RoutineLog {
  student_id: string;
  check_in_time: string;
  check_out_time: string;
  mood: 'happy' | 'calm' | 'sleepy' | 'energetic' | 'crying';
  breakfast: 'all' | 'half' | 'none';
  lunch: 'all' | 'half' | 'none';
  dinner?: 'all' | 'half' | 'none';
  snack: 'all' | 'half' | 'none';
  nap: 'slept' | 'rested' | 'awake';
  notes: string;
  present: boolean;
}

interface DailyRoutineTrackerProps {
  groupId?: string;
  assignedGroups?: Group[];
}

export default function DailyRoutineTracker({ groupId, assignedGroups }: DailyRoutineTrackerProps) {
  const { selectedColor } = useColor();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(groupId || "");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<Record<string, RoutineLog>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (assignedGroups !== undefined) {
      setGroups(assignedGroups);
      if (assignedGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(assignedGroups[0]._id);
      }
    } else {
      fetchGroups();
    }
  }, [assignedGroups]);

  useEffect(() => {
    if (selectedGroup) {
      fetchStudentsAndLogs();
    }
  }, [selectedGroup, selectedDate]);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (!selectedGroup && data.length > 0) {
          setSelectedGroup(data[0]._id);
        }
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const fetchStudentsAndLogs = async () => {
    setLoading(true);
    try {
      const [studentsRes, routineRes] = await Promise.all([
        fetch(`/api/student/all`),
        fetch(`/api/daily-routine?class_id=${selectedGroup}&date=${selectedDate}`)
      ]);

      let allStudents: Student[] = [];
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        allStudents = data.filter((s: any) => s.classInfo?._id === selectedGroup || s.class_id === selectedGroup);
      }
      setStudents(allStudents);

      const existingLogs: Record<string, RoutineLog> = {};
      if (routineRes.ok) {
        const savedData = await routineRes.json();
        if (Array.isArray(savedData)) {
          savedData.forEach((item: any) => {
            existingLogs[item.student_id] = {
              student_id: item.student_id,
              check_in_time: item.check_in_time || "08:30",
              check_out_time: item.check_out_time || "17:30",
              mood: item.mood || "happy",
              breakfast: item.breakfast || "all",
              lunch: item.lunch || "all",
              dinner: item.dinner || "all",
              snack: item.snack || "all",
              nap: item.nap || "slept",
              notes: item.notes || "",
              present: item.present !== undefined ? item.present : true,
            };
          });
        }
      }

      // Initialize missing students with default routine status
      allStudents.forEach((s) => {
        if (!existingLogs[s._id]) {
          existingLogs[s._id] = {
            student_id: s._id,
            check_in_time: "08:30",
            check_out_time: "17:30",
            mood: "happy",
            breakfast: "all",
            lunch: "all",
            dinner: "all",
            snack: "all",
            nap: "slept",
            notes: "",
            present: true,
          };
        }
      });

      setLogs(existingLogs);
    } catch (err) {
      console.error("Error loading routine data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogChange = (studentId: string, field: keyof RoutineLog, value: any) => {
    setLogs((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = Object.values(logs).map((log) => ({
        ...log,
        class_id: selectedGroup,
        date: selectedDate,
      }));

      const res = await fetch("/api/daily-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: payload }),
      });

      if (res.ok) {
        setMessage({ text: "დღის რეჟიმი წარმატებით შენახულია!", type: "success" });
      } else {
        setMessage({ text: "შენახვისას მოხდა შეცდომა", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "სერვერთან კავშირი ვერ დამყარდა", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const moodEmojis = {
    happy: "😊 მხიარული",
    calm: "😌 მშვიდი",
    energetic: "⚡ ენერგიული",
    sleepy: "😴 ეძინება",
    crying: "😢 ტირის",
  };

  return (
    <div style={{
      backgroundColor: "rgba(30, 41, 59, 0.7)",
      backdropFilter: "blur(12px)",
      borderRadius: "16px",
      padding: "24px",
      color: "white",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      border: "1px solid rgba(255,255,255,0.1)",
      maxWidth: "1100px",
      margin: "0 auto"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px", color: selectedColor }}>
            <FaChild size={24} /> საბავშვო ბაღის დღის რეჟიმი და კვების აღრიცხვა
          </h2>
          <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>
            აღსაზრდელების დასწრების, კვების, ძილის რეჟიმისა და გუნება-განწყობის ჟურნალი
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: "14px"
            }}
          >
            <option value="">აირჩიეთ ჯგუფი</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.classname} (ჯგუფი)
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: "14px"
            }}
          />

          <button
            onClick={handleSaveAll}
            disabled={saving || students.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: selectedColor,
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: `0 4px 14px ${selectedColor}66`
            }}
          >
            <FaSave /> {saving ? "ინახება..." : "შენახვა"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          backgroundColor: message.type === "success" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
          color: message.type === "success" ? "#4ade80" : "#f87171",
          border: `1px solid ${message.type === "success" ? "#22c55e" : "#ef4444"}`
        }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>იტვირთება მონაცემები...</div>
      ) : students.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
          ამ ჯგუფში აღსაზრდელები არ მოიძებნა.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(15, 23, 42, 0.9)", textAlign: "left", color: "#cbd5e1" }}>
                <th style={{ padding: "12px", borderRadius: "8px 0 0 0" }}>აღსაზრდელი</th>
                <th style={{ padding: "12px" }}>დასწრება</th>
                <th style={{ padding: "12px" }}>გუნება-განწყობა</th>
                <th style={{ padding: "12px" }}><FaUtensils /> საუზმე / სადილი / სამხარი</th>
                <th style={{ padding: "12px" }}><FaBed /> ძილის რეჟიმი</th>
                <th style={{ padding: "12px", borderRadius: "0 8px 0 0" }}>შენიშვნა მშობელს</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const log = logs[student._id] || {
                  student_id: student._id,
                  check_in_time: "08:30",
                  check_out_time: "17:30",
                  mood: "happy",
                  breakfast: "all",
                  lunch: "all",
                  snack: "all",
                  nap: "slept",
                  notes: "",
                  present: true,
                };

                return (
                  <tr
                    key={student._id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                      opacity: log.present ? 1 : 0.5
                    }}
                  >
                    <td style={{ padding: "12px", fontWeight: "600" }}>
                      {student.name} {student.surname}
                      <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "400" }}>
                        ID: {student.user_ID}
                      </div>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => handleLogChange(student._id, "present", !log.present)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "600",
                          backgroundColor: log.present ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)",
                          color: log.present ? "#4ade80" : "#f87171"
                        }}
                      >
                        {log.present ? <><FaCheck /> გამოცხადდა</> : <><FaTimes /> არ გამოცხადდა</>}
                      </button>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <select
                        value={log.mood}
                        disabled={!log.present}
                        onChange={(e) => handleLogChange(student._id, "mood", e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(15, 23, 42, 0.8)",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.15)"
                        }}
                      >
                        {Object.entries(moodEmojis).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: "6px", flexDirection: "column" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ width: "65px", fontSize: "12px", color: "#cbd5e1", fontWeight: "700" }}>საუზმე:</span>
                          <select
                            value={log.breakfast}
                            disabled={!log.present}
                            onChange={(e) => handleLogChange(student._id, "breakfast", e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: "6px", backgroundColor: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "12px" }}
                          >
                            <option value="all">🥣 სრულად</option>
                            <option value="half">🥛 ნახევარი</option>
                            <option value="none">❌ არ შეჭამა</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ width: "65px", fontSize: "12px", color: "#cbd5e1", fontWeight: "700" }}>სადილი:</span>
                          <select
                            value={log.lunch}
                            disabled={!log.present}
                            onChange={(e) => handleLogChange(student._id, "lunch", e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: "6px", backgroundColor: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "12px" }}
                          >
                            <option value="all">🍲 სრულად</option>
                            <option value="half">🥗 ნახევარი</option>
                            <option value="none">❌ არ შეჭამა</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ width: "65px", fontSize: "12px", color: "#cbd5e1", fontWeight: "700" }}>ვახშამი:</span>
                          <select
                            value={log.dinner || "all"}
                            disabled={!log.present}
                            onChange={(e) => handleLogChange(student._id, "dinner", e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "12px" }}
                          >
                            <option value="all">🍲 სრულად</option>
                            <option value="half">🥗 ნახევარი</option>
                            <option value="none">❌ არ შეჭამა</option>
                          </select>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <select
                        value={log.nap}
                        disabled={!log.present}
                        onChange={(e) => handleLogChange(student._id, "nap", e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(15, 23, 42, 0.8)",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.15)"
                        }}
                      >
                        <option value="slept">🛌 ტკბილად ეძინა</option>
                        <option value="rested">😴 დაისვენა</option>
                        <option value="awake">👀 ეღვიძა</option>
                      </select>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <input
                        type="text"
                        placeholder="კომენტარი..."
                        value={log.notes}
                        disabled={!log.present}
                        onChange={(e) => handleLogChange(student._id, "notes", e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(15, 23, 42, 0.8)",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.15)",
                          width: "100%"
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
