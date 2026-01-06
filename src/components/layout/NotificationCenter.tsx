import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, X, ShoppingBag, BarChart3, TrendingUp, Target, Megaphone, DollarSign, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  category: string;
  icon: any;
  color: string;
  bgColor: string;
  title: string;
  description?: string;
  details?: Record<string, any>;
  time: string;
  priority: 'high' | 'medium' | 'low';
  read?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all as read when panel is opened
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      const timer = setTimeout(() => {
        const allIds = new Set(notifications.map(n => n.id));
        setReadNotifications(allIds);
      }, 500); // Small delay to allow user to see the notifications
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readNotifications.has(n.id)).length;
  }, [notifications, readNotifications]);

  const categories = useMemo(() => {
    return ['All', ...new Set(notifications.map(n => n.category))];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return filter === 'All' 
      ? notifications 
      : notifications.filter(n => n.category === filter);
  }, [notifications, filter]);

  const unreadFilteredCount = useMemo(() => {
    return filteredNotifications.filter(n => !readNotifications.has(n.id)).length;
  }, [filteredNotifications, readNotifications]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600" />
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[480px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div>
              <h3 className="font-medium">Activity Center</h3>
              <p className="text-xs text-white/80">
                {unreadFilteredCount > 0 ? `${unreadFilteredCount} unread • ` : ''}
                {notifications.length} total activities
              </p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setExpandedId(null);
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filter */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => {
                const categoryCount = notifications.filter(n => n.category === category).length;
                const unreadCategoryCount = notifications.filter(n => 
                  n.category === category && !readNotifications.has(n.id)
                ).length;
                
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setFilter(category);
                      setExpandedId(null);
                    }}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                      filter === category
                        ? 'bg-pink-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {category}
                    {category !== 'All' && (
                      <span className="ml-1 opacity-70">
                        ({categoryCount})
                      </span>
                    )}
                    {unreadCategoryCount > 0 && (
                      <span className="ml-1 w-1.5 h-1.5 bg-red-400 rounded-full inline-block"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">Activity will appear here as it happens</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => {
                  const Icon = notification.icon;
                  const isExpanded = expandedId === notification.id;
                  const isUnread = !readNotifications.has(notification.id);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`transition-colors ${
                        isUnread ? 'bg-blue-50/50' : ''
                      } ${notification.priority === 'high' ? 'bg-red-50/30' : ''} ${isExpanded ? 'bg-gray-50' : ''}`}
                    >
                      <div
                        onClick={() => toggleExpand(notification.id)}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {isUnread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          )}
                          <div className={`p-2 rounded-lg ${notification.bgColor} flex-shrink-0`}>
                            <Icon size={16} className={notification.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {notification.priority === 'high' && (
                                  <AlertCircle size={14} className="text-red-500" />
                                )}
                                {isExpanded ? (
                                  <ChevronUp size={16} className="text-gray-400" />
                                ) : (
                                  <ChevronDown size={16} className="text-gray-400" />
                                )}
                              </div>
                            </div>
                            {notification.description && (
                              <p className="text-xs text-gray-600 mb-2">{notification.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="px-2 py-0.5 rounded bg-gray-100">
                                {notification.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {notification.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && notification.details && (
                        <div className="px-4 pb-4 pl-[52px] space-y-2 border-t border-gray-200 pt-3 bg-white">
                          <h4 className="text-xs uppercase text-gray-500 mb-2">Details</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(notification.details).map(([key, value]) => {
                              if (!value || value === 'N/A' || value === 'undefined') return null;
                              
                              return (
                                <div key={key} className="text-xs">
                                  <span className="text-gray-500 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <div className="text-gray-900 font-medium mt-0.5">
                                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to the specific module
                                console.log('Navigate to:', notification.type, notification.id);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-pink-50 text-pink-600 rounded hover:bg-pink-100 transition-colors"
                            >
                              <ExternalLink size={12} />
                              View Details
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {unreadFilteredCount > 0 && `${unreadFilteredCount} unread • `}
                  {filteredNotifications.length} of {notifications.length} activities
                </span>
                <button
                  onClick={() => {
                    setExpandedId(null);
                    setFilter('All');
                  }}
                  className="hover:text-pink-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
