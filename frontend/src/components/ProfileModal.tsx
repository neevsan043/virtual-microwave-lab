import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import CustomDatePicker from './CustomDatePicker';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuPosition?: { x: number; y: number };
  mode: 'view' | 'edit';
}

export default function ProfileModal({ isOpen, onClose, menuPosition, mode }: ProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    registrationNumber: user?.registrationNumber || '',
    birthday: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        registrationNumber: user.registrationNumber || '',
        birthday: user.birthday || '',
      });
    }
  }, [user, isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, birthday: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profileService.updateProfile({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        registrationNumber: formData.registrationNumber,
        birthday: formData.birthday,
      });
      
      // Refresh user data in context
      if (refreshUser) {
        await refreshUser();
      }
      
      alert('Profile updated successfully!');
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        registrationNumber: user.registrationNumber || '',
        birthday: user.birthday || '',
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const isEditMode = mode === 'edit';

  return (
    <>
      <div className="profile-modal-overlay" onClick={onClose}></div>
      <div 
        className={`profile-modal ${isOpen ? 'open' : ''}`}
        style={{
          '--menu-x': menuPosition ? `${menuPosition.x}px` : '50%',
          '--menu-y': menuPosition ? `${menuPosition.y}px` : '50%',
        } as React.CSSProperties}
      >
        <div className="profile-modal-header">
          <div className="profile-avatar-large">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="profile-modal-content">
          <h2 className="profile-title">
            {isEditMode ? 'Edit Profile' : 'My Profile'}
          </h2>

          <div className="profile-form">
            <div className="form-field">
              <label className="field-label">
                <span className="field-icon">👤</span>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditMode}
                className="field-input"
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                <span className="field-icon">📧</span>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={true}
                className="field-input"
                title="Email cannot be changed"
              />
            </div>

            {user?.role === 'student' && (
              <div className="form-field">
                <label className="field-label">
                  <span className="field-icon">🎓</span>
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="field-input"
                  placeholder="Enter your registration number"
                />
              </div>
            )}

            <div className="form-field">
              <label className="field-label">
                <span className="field-icon">📱</span>
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={!isEditMode}
                className="field-input"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                <span className="field-icon">🎂</span>
                Birthday
              </label>
              <CustomDatePicker
                value={formData.birthday}
                onChange={handleDateChange}
                disabled={!isEditMode}
                placeholder="Select your birthday"
              />
            </div>
          </div>

          <div className="profile-actions">
            {!isEditMode ? (
              <button 
                className="btn-profile-primary"
                onClick={onClose}
              >
                Close
              </button>
            ) : (
              <>
                <button 
                  className="btn-profile-secondary"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  className="btn-profile-primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
