import { UserCheck, User } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface DataModeBannerProps {
  recordCount: number;
  entityName?: string;
}

export function DataModeBanner({ recordCount, entityName = 'records' }: DataModeBannerProps) {
  const { user, selectedUserId, isAdmin } = useAuth();

  // Don't show for normal users
  if (!isAdmin) return null;

  // Admin viewing all members
  if (!selectedUserId) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-r-lg mb-4">
        <div className="flex items-center gap-3">
          <UserCheck className="text-purple-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-purple-900">
              📊 Viewing All Members' Data
            </p>
            <p className="text-xs text-purple-700">
              Showing {recordCount} {entityName} from all team members
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin viewing specific user (not themselves)
  if (selectedUserId && selectedUserId !== user?.id) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-4">
        <div className="flex items-center gap-3">
          <User className="text-blue-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              👤 Viewing Team Member's Data
            </p>
            <p className="text-xs text-blue-700">
              Showing {recordCount} {entityName} for selected team member
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin viewing their own data
  return null;
}
