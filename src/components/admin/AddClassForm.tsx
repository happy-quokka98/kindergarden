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
          <label className="admin-label" style={{ marginBottom: '8px', display: 'block' }}>სწრაფი არჩევა (ასაკობრივი ჯგუფი):</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {agePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setClassName(preset)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: className === preset ? `2px solid ${selectedColor}` : '1px solid #ddd',
                  background: className === preset ? `${selectedColor}15` : '#f8f9fa',
                  color: className === preset ? selectedColor : '#333',
                  fontWeight: className === preset ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">ჯგუფის / ასაკის დასახელება</label>
          <input
            className="admin-input"
            type="text"
            placeholder="მაგ: 2-3 წელი (მცირე ჯგუფი)"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
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