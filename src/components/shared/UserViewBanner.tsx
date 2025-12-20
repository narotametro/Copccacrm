import React, { useState, useEffect } from 'react';
import { User, useAuth } from '../../lib/auth-context';
import { Eye, Info } from 'lucide-react';
import { getInitials, getAvatarColor, formatName } from '../../lib/utils';
import { userAPI } from '../../lib/api';

export function UserViewBanner() {
  const { isAdmin, selectedUserId, user } = useAuth();
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin && selectedUserId && selectedUserId !== user?.id) {
      loadViewingUser();
    } else {
      setViewingUser(null);
    }
  }, [selectedUserId, user, isAdmin]);

  const loadViewingUser = async () => {
    if (!selectedUserId) return;
    
    try {
      setLoading(true);
      const { users } = await userAPI.getAll();
      const foundUser = users?.find(u => u.id === selectedUserId);
      if (foundUser) {
        setViewingUser(foundUser);
      }
    } catch (error) {
      console.error('Failed to load viewing user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only show banner if admin is viewing another user's data
  if (!isAdmin || !selectedUserId || !viewingUser || selectedUserId === user?.id) {
    return null;
  }

  return (
    <div 
      className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-purple-700">
        <Eye size={16} aria-hidden="true" />
        <span>
          Administrator view - Showing data from <strong>{formatName(viewingUser.name)}</strong> ({viewingUser.email || viewingUser.phone || 'No contact'})
        </span>
      </div>
    </div>
  );
}