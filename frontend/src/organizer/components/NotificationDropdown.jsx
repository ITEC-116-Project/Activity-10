import { useState, useRef, useEffect } from 'react';
import { announcementService } from '../../shared/services/announcementService';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: ''
  });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Load announcements on component mount
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
    setLoading(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNotification = async () => {
    if (formData.title.trim() && formData.body.trim()) {
      setLoading(true);
      try {
        await announcementService.create(formData.title, formData.body);
        setFormData({ title: '', body: '' });
        setShowAddForm(false);
        await loadAnnouncements();
      } catch (error) {
        console.error('Failed to create announcement:', error);
        alert('Failed to create announcement');
      }
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    setLoading(true);
    try {
      await announcementService.delete(id);
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert('Failed to delete announcement');
    }
    setLoading(false);
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (date) => {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return dateObj.toLocaleDateString();
  };

  const formatFullDate = (date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button 
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-modal">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button 
              className="add-notification-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              title="Add notification"
            >
              +
            </button>
          </div>

          {showAddForm && (
            <div className="add-notification-form">
              <input
                type="text"
                placeholder="Notification title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                placeholder="Notification body..."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows="3"
              />
              <div className="form-buttons">
                <button 
                  className="btn-confirm"
                  onClick={handleAddNotification}
                >
                  Add
                </button>
                <button 
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ title: '', body: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="notifications-list">
            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">No notifications yet</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <div className="notification-date">
                      {formatFullDate(notification.createdAt)}
                    </div>
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-body">{notification.body}</p>
                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
