import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserMenu.css';

interface UserMenuProps {
  onOpenProfile: (position: { x: number; y: number }, mode: 'view' | 'edit') => void;
  onChangePassword: (position: { x: number; y: number }) => void;
}

export default function UserMenu({ onOpenProfile, onChangePassword }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const getButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: window.innerWidth - 100, y: 100 };
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    onChangePassword(getButtonPosition());
  };

  const handleEditProfile = () => {
    setIsOpen(false);
    onOpenProfile(getButtonPosition(), 'edit');
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    onOpenProfile(getButtonPosition(), 'view');
  };

  return (
    <div className="user-menu-container">
      <button 
        ref={buttonRef}
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="User menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {isOpen && (
        <>
          <div className="menu-overlay" onClick={toggleMenu}></div>
          <div className="user-dropdown">
            <div className="dropdown-header">
              <div className="user-avatar">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name-display">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
                {user?.registrationNumber && (
                  <div className="user-reg">Reg: {user.registrationNumber}</div>
                )}
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-menu">
              <button className="menu-item" onClick={handleViewProfile}>
                <span className="menu-icon">👤</span>
                <span className="menu-text">View Profile</span>
              </button>

              {user?.registrationNumber && (
                <div className="menu-item-info">
                  <span className="menu-icon">🎓</span>
                  <span className="menu-text">
                    <span className="info-label">Registration</span>
                    <span className="info-value">{user.registrationNumber}</span>
                  </span>
                </div>
              )}

              {user?.phoneNumber && (
                <div className="menu-item-info">
                  <span className="menu-icon">📱</span>
                  <span className="menu-text">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{user.phoneNumber}</span>
                  </span>
                </div>
              )}

              <button className="menu-item" onClick={handleEditProfile}>
                <span className="menu-icon">✏️</span>
                <span className="menu-text">Edit Profile</span>
              </button>

              <button className="menu-item" onClick={handleChangePassword}>
                <span className="menu-icon">🔒</span>
                <span className="menu-text">Change Password</span>
              </button>

              <div className="dropdown-divider"></div>

              <button className="menu-item logout-item" onClick={handleLogout}>
                <span className="menu-icon">🚪</span>
                <span className="menu-text">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
