"use client";
import React, { useState } from 'react';
import { useColor } from '../ColorContext';

interface AddClassFormProps {
  onAddClass: (className: string) => void;
  onCancel: () => void;
}

const AddClassForm: React.FC<AddClassFormProps> = ({ onAddClass, onCancel }) => {
  const [className, setClassName] = useState('');
  const { selectedColor } = useColor();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (className.trim()) {
      onAddClass(className.trim());
      setClassName('');
    }
  };

  const agePresets = ["1-2 წელი", "2-3 წელი", "3-4 წელი", "4-5 წელი", "5-6 წელი"];

  return (
    <div className="admin-view-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <form onSubmit={handleSubmit} className="admin-form-container animate-zoom-in">
        <h2 className="admin-form-title">ჯგუფის დამატება</h2>
        

        <div className="admin-form-group">
          <label className="admin-label">ჯგუფის დასახელება / სახელი</label>
          <input
            className="admin-input"
            type="text"
            placeholder="მაგ: ვარსკვლავები, ფუტკრები, ციცინათელები, 3-4 წელი..."
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            💡 პოპულარული სახელების შაბლონები (დააჭირეთ ასარჩევად):
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              "⭐ ვარსკვლავები",
              "🐝 ფუტკრები",
              "💡 ციცინათელები",
              "☀️ მზის სხივები",
              "🧠 პატარა გენიოსები",
              "🧸 2-3 წელი (მცირე ჯგუფი)",
              "🎨 3-4 წელი (საშუალო ჯგუფი)",
              "🚀 4-5 წელი (უფროსი ჯგუფი)",
              "🎓 5-6 წელი (სასკოლო მზაობა)"
            ].map(preset => {
              const cleanName = preset.split(' ').slice(1).join(' ');
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setClassName(cleanName)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: className === cleanName ? `2px solid ${selectedColor}` : '1px solid rgba(255,255,255,0.15)',
                    background: className === cleanName ? `${selectedColor}33` : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button type="button" onClick={onCancel} className="admin-cancel-btn" style={{ flex: 1 }}>
            გაუქმება
          </button>
          <button type="submit" className="admin-submit-btn" style={{ background: selectedColor, margin: 0, flex: 1 }}>
            დამატება
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClassForm; 