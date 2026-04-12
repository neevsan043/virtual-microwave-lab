import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import './ChangePasswordModal.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuPosition?: { x: number; y: number };
}

export default function ChangePasswordModal({ isOpen, onClose, menuPosition }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChanging, setIsChanging] = useState(false);

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
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsChanging(true);
    try {
      await authService.changePassword(formData.currentPassword, formData.newPassword);
      alert('Password changed successfully! Please use your new password next time you login.');
      handleClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      setErrors(prev => ({
        ...prev,
        currentPassword: errorMessage.includes('incorrect') ? errorMessage : '',
      }));
      if (!errorMessage.includes('incorrect')) {
        alert(errorMessage);
      }
    } finally {
      setIsChanging(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="password-modal-overlay" onClick={handleClose}></div>
      <div 
        className={`password-modal ${isOpen ? 'open' : ''}`}
        style={{
          '--menu-x': menuPosition ? `${menuPosition.x}px` : '50%',
          '--menu-y': menuPosition ? `${menuPosition.y}px` : '50%',
        } as React.CSSProperties}
      >
        <div className="password-modal-header">
          <div className="password-icon">
            🔒
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="password-modal-content">
          <h2 className="password-title">Change Password</h2>
          <p className="password-subtitle">Enter your current password and choose a new one</p>

          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-field">
              <label className="field-label">
                <span className="field-icon">🔑</span>
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={`field-input ${errors.currentPassword ? 'error' : ''}`}
                placeholder="Enter current password"
              />
              {errors.currentPassword && (
                <span className="field-error">{errors.currentPassword}</span>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                <span className="field-icon">🔐</span>
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={`field-input ${errors.newPassword ? 'error' : ''}`}
                placeholder="Enter new password (min 6 characters)"
              />
              {errors.newPassword && (
                <span className="field-error">{errors.newPassword}</span>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                <span className="field-icon">✅</span>
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`field-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>

            <div className="password-actions">
              <button 
                type="button"
                className="btn-password-secondary"
                onClick={handleClose}
                disabled={isChanging}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-password-primary"
                disabled={isChanging}
              >
                {isChanging ? 'Changing...' : '🔒 Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
