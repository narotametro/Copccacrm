import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Check,
  Trash2,
  Filter,
  Search,
  Clock,
  User,
  Calendar,
  ChevronRight,
  Mail,
  MailOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatName, formatRole } from '@/lib/textFormat';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  fullDetails: string;
  time: string;
  date: string;
  read: boolean;
  sender: string;
  senderRole: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  actionLink?: string;
  relatedTo?: string;
}

const demoNotifications: Notification[] = [];

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'success' | 'warning' | 'info' | 'error'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const typeFilters: Array<typeof filterType> = ['all', 'unread', 'success', 'warning', 'info'];

  const categories = ['all', ...Array.from(new Set(notifications.map(n => n.category)))];
  
  const filteredNotifications = notifications.filter(n => {
    const matchesType = filterType === 'all' || (filterType === 'unread' ? !n.read : n.type === filterType);
    const matchesCategory = filterCategory === 'all' || n.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.sender.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-600" size={20} />;
      case 'warning': return <AlertTriangle className="text-orange-600" size={20} />;
      case 'error': return <AlertTriangle className="text-red-600" size={20} />;
      default: return <Info className="text-blue-600" size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-slate-100 text-slate-700 border-slate-300',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Notifications List */}
      <div className="w-2/5 flex flex-col">
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="text-primary-600" size={24} />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                <p className="text-sm text-slate-600">{unreadCount} unread messages</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check size={16} className="mr-2" />
                Mark All Read
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {typeFilters.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type === 'unread' && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    filterCategory !== 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Filter size={14} />
                  {filterCategory !== 'all' ? filterCategory : 'Category'}
                </button>
                {showFilterMenu && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFilterCategory(cat);
                          setShowFilterMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-600">No notifications found</p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${
                  !notification.read ? 'bg-blue-50/50 border-l-blue-500' : 'border-l-transparent'
                } ${selectedNotification?.id === notification.id ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-sm text-slate-900 ${!notification.read ? 'font-bold' : ''}`}>
                        {notification.title}
                      </h3>
                      {!notification.read ? (
                        <Mail className="text-blue-600 flex-shrink-0" size={16} />
                      ) : (
                        <MailOpen className="text-slate-400 flex-shrink-0" size={16} />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                        {notification.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {notification.time}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-400 flex-shrink-0" size={18} />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Notification Details */}
      <div className="flex-1">
        {selectedNotification ? (
          <Card className="p-6 h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(selectedNotification.type)} border-2`}>
                  {getTypeIcon(selectedNotification.type)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedNotification.title}</h2>
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityBadge(selectedNotification.priority)}`}>
                      {selectedNotification.priority.toUpperCase()} PRIORITY
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {selectedNotification.category}
                    </span>
                    {selectedNotification.actionRequired && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-300">
                        ACTION REQUIRED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{formatName(selectedNotification.sender)}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs">{formatRole(selectedNotification.senderRole)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{selectedNotification.date}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteNotification(selectedNotification.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="prose prose-sm max-w-none">
                <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Quick Summary:</p>
                  <p className="text-sm text-slate-600">{selectedNotification.message}</p>
                </div>
                
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.fullDetails}
                </div>

                {selectedNotification.relatedTo && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Related To:</p>
                    <p className="text-sm text-blue-700">{selectedNotification.relatedTo}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              {selectedNotification.actionLink && (
                <Button
                  onClick={() => {
                    const link = selectedNotification.actionLink;
                    if (!link) return;
                    if (link.startsWith('/')) {
                      navigate(link);
                      return;
                    }
                    window.open(link, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex-1"
                >
                  Take Action
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  markAsRead(selectedNotification.id);
                  setSelectedNotification(null);
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-12 h-full flex items-center justify-center">
            <div className="text-center">
              <Bell className="mx-auto text-slate-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Select a notification</h3>
              <p className="text-slate-600">Click on any notification to view full details</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
