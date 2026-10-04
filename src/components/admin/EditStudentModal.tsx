"use client";
import React, { useState, useEffect } from 'react';
import { useColor } from '../ColorContext';
import { IoMdClose } from 'react-icons/io';

import MonthlyPaymentButtons from '../MonthlyPaymentButtons';

const CloseIcon = IoMdClose as React.FC<{ size?: number | string }>;

interface Student {
    _id: string;
    name: string;
    surname: string;
    ID?: string;
    user_ID: string;
    role?: string;
    image?: string;
    class_id?: string;
    classInfo?: {
        _id?: string;
        classname: string;
    };
    payment_due_day?: number;
    payment_amount?: number;
    payment_status?: 'paid' | 'unpaid';
    monthly_payments?: Record<string, 'paid' | 'unpaid'>;
}

interface Class {
    _id:string;
    classname: string;
}

interface EditStudentModalProps {
    isOpen: boolean;
    student: Student | null;
    classes: Class[];
    onClose: () => void;
    onSave: (student: Student) => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, student, classes, onClose, onSave }) => {
    const [formData, setFormData] = useState<Student | null>(null);
    const { selectedColor } = useColor();

    useEffect(() => {
        if (student) {
            const idVal = student.ID || student.user_ID || '';
            setFormData({
                _id: student._id,
                name: student.name,
                surname: student.surname,
                ID: idVal,
                user_ID: idVal,
                role: student.role || "student",
                image: student.image || "",
                class_id: student.class_id || student.classInfo?._id || "",
                classInfo: student.classInfo || undefined,
                payment_due_day: student.payment_due_day ?? 10,
                payment_amount: student.payment_amount ?? 150,
                payment_status: student.payment_status || 'unpaid',
                monthly_payments: student.monthly_payments || {},
            });
        }
    }, [student]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'class_id') {
            const classInfo = classes.find(c => c._id === value);
            setFormData({ ...formData, class_id: value, classInfo: classInfo ? { _id: value, classname: classInfo.classname } : undefined });
        } else if (name === 'payment_due_day' || name === 'payment_amount') {
            setFormData({ ...formData, [name]: value === '' ? '' : Number(value) as any });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const idVal = formData.ID || formData.user_ID || '';
        onSave({
            _id: formData._id,
            name: formData.name,
            surname: formData.surname,
            ID: idVal,
            user_ID: idVal,
            role: formData.role || "student",
            image: formData.image || "",
            class_id: formData.class_id,
            classInfo: formData.classInfo,
            payment_due_day: formData.payment_due_day ? Number(formData.payment_due_day) : 10,
            payment_amount: formData.payment_amount ? Number(formData.payment_amount) : 150,
            payment_status: formData.payment_status || 'unpaid',
        } as Student);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div 
                className="admin-form-container animate-zoom-in" 
                style={{ 
                    position: 'relative', 
                    maxWidth: '540px', 
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: '24px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    padding: 0
                }}
            >
                {/* Modal Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(30, 41, 59, 0.95)'
                }}>
                    <h2 className="admin-form-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                        აღსაზრდელის მონაცემების რედაქტირება
                    </h2>
                    <button 
                        type="button"
                        onClick={onClose} 
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <CloseIcon size={24} />
                    </button>
                </div>
                
                {/* Scrollable Form Body */}
                <form id="edit-student-form" onSubmit={handleSubmit} style={{
                    padding: '24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    flex: 1
                }}>
                    <div className="admin-form-group">
                        <label className="admin-label">სახელი</label>
                        <input className="admin-input" type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">გვარი</label>
                        <input className="admin-input" type="text" name="surname" value={formData.surname} onChange={handleChange} required />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">პირადი ნომერი / ID (პ/ნ)</label>
                        <input className="admin-input" type="text" name="ID" value={formData.ID || formData.user_ID || ''} onChange={handleChange} required />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">ასაკობრივი ჯგუფი</label>
                        <select className="admin-select" name="class_id" value={formData.class_id || ''} onChange={handleChange}>
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.classname}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">გადასახადის გადახდის დღე (რიცხვი 1-31)</label>
                        <input className="admin-input" type="number" name="payment_due_day" min="1" max="31" value={formData.payment_due_day ?? 10} onChange={handleChange} />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">გადასახდელი თანხა (₾)</label>
                        <input className="admin-input" type="number" name="payment_amount" min="0" step="any" value={formData.payment_amount ?? 150} onChange={handleChange} />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">გადახდის სტატუსი</label>
                        <select className="admin-select" name="payment_status" value={formData.payment_status || 'unpaid'} onChange={handleChange}>
                            <option value="unpaid">🔴 გადაუხდელია</option>
                            <option value="paid">🟢 გადახდილია</option>
                        </select>
                    </div>

                    <MonthlyPaymentButtons
                        studentId={formData._id || formData.ID || formData.user_ID}
                        monthlyPayments={formData.monthly_payments}
                        selectedColor={selectedColor}
                        onPaymentUpdated={(month, newStatus) => {
                            setFormData(prev => prev ? {
                                ...prev,
                                monthly_payments: {
                                    ...(prev.monthly_payments || {}),
                                    [month]: newStatus
                                }
                            } : null);
                        }}
                    />
                </form>

                {/* Fixed Action Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    background: 'rgba(15, 23, 42, 0.95)'
                }}>
                    <button type="button" onClick={onClose} className="admin-cancel-btn">
                        გაუქმება
                    </button>
                    <button type="submit" form="edit-student-form" className="admin-submit-btn" style={{ background: selectedColor, margin: 0, width: 'auto', padding: '12px 32px', fontWeight: 800 }}>
                        შენახვა
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditStudentModal; 