"use client";
import React, { useState, useEffect } from "react";
import { IoCalendarOutline, IoSaveOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoSparklesOutline } from "react-icons/io5";
import { FaChalkboardTeacher, FaBookOpen } from "react-icons/fa";

const CalendarIcon = IoCalendarOutline as React.FC<{ size?: number | string; className?: string }>;
const SaveIcon = IoSaveOutline as React.FC<{ size?: number | string; className?: string }>;
const TrashIcon = IoTrashOutline as React.FC<{ size?: number | string; className?: string }>;
const CheckmarkIcon = IoCheckmarkCircleOutline as React.FC<{ size?: number | string; className?: string }>;
const SparklesIcon = IoSparklesOutline as React.FC<{ size?: number | string; className?: string }>;
const TeacherIcon = FaChalkboardTeacher as React.FC<{ size?: number | string; className?: string }>;
const BookIcon = FaBookOpen as React.FC<{ size?: number | string; className?: string }>;
import GroupRoutineEditor from "./GroupRoutineEditor";

const days = ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი"];
const lessonsPerDay = 7;
const lessonRoman = ["I", "II", "III", "IV", "V", "VI", "VII"];

interface Teacher {
  _id: string;
  name: string;
  surname: string;
  user_ID?: string;
}

interface Subject {
  _id: string;
  name: string;
}

interface ClassSubject {
  subject_id: string;
  teacher_id: string;
}

interface ClassObj {
  _id: string;
  classname: string;
  damrigebeli?: string;
  tutor_id?: string;
  subjects?: ClassSubject[];
  calendar?: { subject_id: string; teacher_id: string }[][];
}

interface GroupScheduleManagerProps {
  tutorClasses: ClassObj[];
  teachesClasses: ClassObj[];
  allClasses: ClassObj[];
  allSubjects: Subject[];
  allTeachers: Teacher[];
  currentTeacherId: string;
  initialClassId?: string | null;
  onScheduleUpdated?: () => void;
  showToast?: (msg: string, type: 'success' | 'error') => void;
}

export default function GroupScheduleManager({
  tutorClasses,
  teachesClasses,
  allClasses,
  allSubjects,
  allTeachers,
  currentTeacherId,
  initialClassId = null,
  onScheduleUpdated,
  showToast
}: GroupScheduleManagerProps) {
  // Combine managed classes prioritising tutor classes
  const managedClasses = React.useMemo(() => {
    const list: ClassObj[] = [];
    const addedIds = new Set<string>();

    tutorClasses.forEach(c => {
      if (c && c._id && !addedIds.has(c._id)) {
        addedIds.add(c._id);
        list.push(c);
      }
    });

    teachesClasses.forEach(c => {
      if (c && c._id && !addedIds.has(c._id)) {
        addedIds.add(c._id);
        list.push(c);
      }
    });

    return list;
  }, [tutorClasses, teachesClasses]);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [calendar, setCalendar] = useState<{ subject_id: string; teacher_id: string }[][]>(
    Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: "", teacher_id: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Set default selected class ID
  useEffect(() => {
    if (initialClassId && managedClasses.some(c => c._id === initialClassId)) {
      setSelectedClassId(initialClassId);
    } else if (tutorClasses.length > 0) {
      setSelectedClassId(tutorClasses[0]._id);
    } else if (managedClasses.length > 0) {
      setSelectedClassId(managedClasses[0]._id);
    }
  }, [initialClassId, tutorClasses, managedClasses]);

  // Load calendar grid when selected class changes
  useEffect(() => {
    if (!selectedClassId) return;

    const currentClass = managedClasses.find(c => c._id === selectedClassId);
    if (currentClass && currentClass.calendar && Array.isArray(currentClass.calendar) && currentClass.calendar.length === 5) {
      const formattedCal = currentClass.calendar.map(dayArr => {
        if (!Array.isArray(dayArr)) return Array(lessonsPerDay).fill({ subject_id: "", teacher_id: "" });
        const padded = dayArr.map(slot => ({
          subject_id: slot && slot.subject_id ? String(slot.subject_id) : "",
          teacher_id: slot && slot.teacher_id ? String(slot.teacher_id) : ""
        }));
        while (padded.length < lessonsPerDay) {
          padded.push({ subject_id: "", teacher_id: "" });
        }
        return padded.slice(0, lessonsPerDay);
      });
      setCalendar(formattedCal);
    } else {
      setCalendar(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: "", teacher_id: "" })));
    }
  }, [selectedClassId, managedClasses]);

  const handleCellChange = (dayIdx: number, lessonIdx: number, field: "subject_id" | "teacher_id", value: string) => {
    setCalendar(prev => {
      const updated = prev.map(row => [...row]);
      const currentCell = { ...updated[dayIdx][lessonIdx] };

      if (field === "subject_id") {
        currentCell.subject_id = value;
        // Auto-assign teacher if subject has assigned teacher in class or default to current teacher
        const currentClassObj = managedClasses.find(c => c._id === selectedClassId);
        const assignedSubject = currentClassObj?.subjects?.find(s => String(s.subject_id) === String(value));
        if (assignedSubject && assignedSubject.teacher_id) {
          currentCell.teacher_id = String(assignedSubject.teacher_id);
        } else if (!currentCell.teacher_id && currentTeacherId) {
          currentCell.teacher_id = currentTeacherId;
        }
      } else {
        currentCell.teacher_id = value;
      }

      updated[dayIdx][lessonIdx] = currentCell;
      return updated;
    });
  };

  const handleSaveCalendar = async () => {
    if (!selectedClassId) {
      if (showToast) showToast("გთხოვთ აირჩიოთ ჯგუფი", "error");
      return;
    }

    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/class/set-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: selectedClassId,
          calendar: calendar,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        if (showToast) showToast("ჯგუფის დღის განრიგი წარმატებით შენახულია!", "success");
        if (onScheduleUpdated) onScheduleUpdated();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        if (showToast) showToast(data.message || "შენახვა ვერ მოხერხდა", "error");
        else alert(data.message || "შენახვა ვერ მოხერხდა");
      }
    } catch {
      if (showToast) showToast("სერვერთან დაკავშირება ვერ მოხერხდა", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCalendar = () => {
    if (!selectedClassId) return;
    if (!confirm("ნამდვილად გსურთ არჩეული ჯგუფის განრიგის გასუფთავება?")) return;
    setCalendar(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: "", teacher_id: "" })));
  };

  const currentClassObj = managedClasses.find(c => c._id === selectedClassId);
  const isTutorClass = tutorClasses.some(c => c._id === selectedClassId);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "24px",
          padding: "24px 28px",
          color: "#ffffff",
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#60a5fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                დღის განრიგის შეტანა & ცვლილება
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
                შეიტანეთ ან შეცვალეთ დღის განრიგი თქვენს მობარებულ ჯგუფში
              </p>
            </div>
          </div>

          {/* Group Selector */}
          <div style={{ minWidth: "260px", flex: "1 1 300px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
              აირჩიეთ მობარებული ჯგუფი:
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
              }}
            >
              <option value="" style={{ color: "#000" }}>-- აირჩიეთ ჯგუფი --</option>
              {managedClasses.map(cls => {
                const isHomeroom = tutorClasses.some(tc => tc._id === cls._id);
                return (
                  <option key={cls._id} value={cls._id} style={{ color: "#000" }}>
                    {isHomeroom ? `⭐ ${cls.classname} (მობარებული ჯგუფი)` : cls.classname}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Selected Group Badge */}
        {currentClassObj && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: "20px",
                background: isTutorClass ? "#2563eb" : "#475569",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              {isTutorClass ? "⭐ თქვენი მობარებული ჯგუფი" : "ჯგუფის განრიგი"}
            </span>
            <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 700 }}>
              ჯგუფის სახელი: <strong>{currentClassObj.classname}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      {selectedClassId ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Action Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SparklesIcon size={20} className="text-blue-600" />
              <span style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>
                კვირის დღის რეჟიმი & საათები (7 გაკვეთილი/აქტივობა)
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleClearCalendar}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "1px solid #fee2e2",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <TrashIcon size={16} />
                გასუფთავება
              </button>

              <button
                type="button"
                onClick={handleSaveCalendar}
                disabled={loading}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  border: "none",
                  background: saveSuccess ? "#16a34a" : "#2563eb",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: saveSuccess ? "0 4px 14px rgba(22, 163, 74, 0.3)" : "0 4px 14px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                {saveSuccess ? (
                  <>
                    <CheckmarkIcon size={18} /> შენახულია!
                  </>
                ) : (
                  <>
                    <SaveIcon size={18} /> {loading ? "ინახება..." : "განრიგის შენახვა"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Schedule Table Container */}
          <div style={{ overflowX: "auto", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ width: "50px", padding: "12px 8px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>#</th>
                  {days.map((day, dIdx) => (
                    <th key={dIdx} style={{ padding: "12px", textAlign: "center", color: "#1e293b", fontWeight: 800, fontSize: "14px" }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(lessonsPerDay)].map((_, lessonIdx) => (
                  <tr key={lessonIdx} style={{ borderBottom: lessonIdx === lessonsPerDay - 1 ? "none" : "1px solid #f1f5f9" }}>
                    <td style={{ textAlign: "center", fontWeight: 900, color: "#94a3b8", background: "#fafafa", fontSize: "13px" }}>
                      {lessonRoman[lessonIdx]}
                    </td>
                    {days.map((_, dayIdx) => {
                      const cell = calendar[dayIdx]?.[lessonIdx] || { subject_id: "", teacher_id: "" };
                      const hasValue = !!cell.subject_id;

                      return (
                        <td
                          key={dayIdx}
                          style={{
                            padding: "8px",
                            verticalAlign: "top",
                            background: hasValue ? "#f0f9ff" : "#ffffff",
                            transition: "background 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {/* Subject / Activity Selector */}
                            <select
                              value={cell.subject_id}
                              onChange={e => handleCellChange(dayIdx, lessonIdx, "subject_id", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "10px",
                                border: hasValue ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
                                background: hasValue ? "#ffffff" : "#f8fafc",
                                fontWeight: 700,
                                fontSize: "13px",
                                color: hasValue ? "#1e40af" : "#475569",
                                outline: "none",
                              }}
                            >
                              <option value="">-- საგანი / აქტივობა --</option>
                              {allSubjects.map(sub => (
                                <option key={sub._id} value={sub._id}>
                                  {sub.name}
                                </option>
                              ))}
                            </select>

                            {/* Caregiver / Teacher Selector */}
                            <select
                              value={cell.teacher_id}
                              onChange={e => handleCellChange(dayIdx, lessonIdx, "teacher_id", e.target.value)}
                              disabled={!cell.subject_id}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                background: cell.subject_id ? "#ffffff" : "#f1f5f9",
                                fontSize: "12px",
                                color: cell.subject_id ? "#334155" : "#a1a1aa",
                                outline: "none",
                                opacity: cell.subject_id ? 1 : 0.5,
                              }}
                            >
                              <option value="">-- აღმზრდელი --</option>
                              {allTeachers.map(t => (
                                <option key={t._id} value={t._id}>
                                  {t.name} {t.surname}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Save Bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button
              type="button"
              onClick={handleSaveCalendar}
              disabled={loading}
              style={{
                padding: "12px 32px",
                borderRadius: "14px",
                border: "none",
                background: saveSuccess ? "#16a34a" : "#2563eb",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)",
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckmarkIcon size={20} /> განრიგი წარმატებით შენახულია!
                </>
              ) : (
                <>
                  <SaveIcon size={20} /> {loading ? "ინახება..." : "განრიგის შენახვა"}
                </>
              )}
            </button>
          </div>

          {/* Group Daily Routine Activities List Editor */}
          {selectedClassId && (
            <GroupRoutineEditor
              classId={selectedClassId}
              classNameStr={managedClasses.find(c => c._id === selectedClassId)?.classname}
              showToast={showToast}
            />
          )}
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: "24px", padding: "40px", textAlign: "center", color: "#64748b" }}>
          გთხოვთ აირჩიოთ ჯგუფი განრიგის სანახავად და შესატანად.
        </div>
      )}
    </div>
  );
}
