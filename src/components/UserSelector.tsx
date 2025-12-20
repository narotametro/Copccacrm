import { useState, useRef, useEffect } from 'react';
import { useAuth, User } from '../lib/auth-context';
import { userAPI } from '../lib/api';
import { UserCheck, ChevronDown, Search, Filter } from 'lucide-react';
import { getInitials, getAvatarColor, formatName } from '../lib/utils';

export function UserSelector() {
  const { isAdmin, selectedUserId, setSelectedUserId, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const { users } = await userAPI.getAll();
      setAllUsers(users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // Only show for admins
  if (!isAdmin || !user) return null;

  const selectedUser = selectedUserId ? allUsers.find(u => u.id === selectedUserId) : null;

  const handleUserSelect = (userId: string | null) => {
    console.log('🔄 User selection changed:', {
      from: selectedUserId || 'ALL_MEMBERS',
      to: userId || 'ALL_MEMBERS',
      userName: userId ? allUsers.find(u => u.id === userId)?.name : 'All Members'
    });
    setSelectedUserId(userId);
    setIsOpen(false);
  };

  const filteredUsers = allUsers.filter(u => 
    u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md border-2 ${
          !selectedUserId 
            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-400 hover:border-purple-500' 
            : selectedUserId === user.id
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-400'
            : 'bg-gradient-to-r from-green-50 to-teal-50 border-green-300 hover:border-green-400'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Filter size={18} className={
          !selectedUserId 
            ? 'text-purple-600' 
            : selectedUserId === user.id
            ? 'text-blue-600'
            : 'text-green-600'
        } />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-700">
            {selectedUser ? formatName(selectedUser?.name) : '👥 All Members'}
          </span>
          {!selectedUserId && (
            <span className="text-xs text-purple-600">Combined View</span>
          )}
          {selectedUserId && selectedUserId === user.id && (
            <span className="text-xs text-blue-600">Your Data</span>
          )}
          {selectedUserId && selectedUserId !== user.id && (
            <span className="text-xs text-green-600">Team Member</span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
            !selectedUserId 
              ? 'text-purple-600' 
              : selectedUserId === user.id
              ? 'text-blue-600'
              : 'text-green-600'
          }`} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto"
          role="listbox"
        >
          <div className="px-4 py-2 sticky top-0 bg-white z-10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white"
              />
            </div>
          </div>

          <button
            onClick={() => handleUserSelect(null)}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
              !selectedUserId ? 'bg-pink-50 text-pink-600' : ''
            }`}
            role="option"
            aria-selected={!selectedUserId}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs">
                All
              </div>
              <div>
                <p className="text-sm font-medium">All Members</p>
                <p className="text-xs text-gray-500">View combined data</p>
              </div>
            </div>
          </button>

          <div className="border-t border-gray-100 my-2" role="separator"></div>

          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => handleUserSelect(u.id)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  selectedUserId === u.id ? 'bg-pink-50 text-pink-600' : ''
                }`}
                role="option"
                aria-selected={selectedUserId === u.id}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${getAvatarColor(u.role)} rounded-full flex items-center justify-center text-white text-xs`}>
                    {getInitials(u.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{formatName(u.name)}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <p className="text-sm">No members found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}