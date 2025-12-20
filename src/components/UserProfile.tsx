import { useAuth } from '../lib/auth-context';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Settings, User as UserIcon, Shield } from 'lucide-react';
import { getInitials, getAvatarColor, formatName } from '../lib/utils';

export function UserProfile() {
  const { user, logout, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleProfileClick = () => {
    setIsOpen(false);
    // TODO: Navigate to profile when implemented
    console.log('Profile clicked');
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    // TODO: Navigate to settings when implemented
    console.log('Settings clicked');
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm">{formatName(user.name)}</p>
          <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'Team Member'}</p>
        </div>
        <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.role)} flex items-center justify-center text-white flex-shrink-0`}>
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            <span className="text-sm">{getInitials(user.name)}</span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${getAvatarColor(user.role)} flex items-center justify-center text-white`}>
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <span>{getInitials(user.name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">{formatName(user.name)}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            {isAdmin && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                <Shield size={12} />
                Administrator
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
              onClick={handleProfileClick}
            >
              <UserIcon size={18} className="text-gray-400" />
              <span>My Profile</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
              onClick={handleSettingsClick}
            >
              <Settings size={18} className="text-gray-400" />
              <span>Settings</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogoutClick}
              className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}