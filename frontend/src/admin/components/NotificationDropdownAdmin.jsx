import { useState, useRef, useEffect } from 'react';
import './NotificationDropdownAdmin.css';

const NotificationDropdownAdmin = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: ''
  });
  const dropdownRef = useRef(null);

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

  const handleAddNotification = () => {
    if (formData.title.trim() && formData.body.trim()) {
      const notification = {
        id: Date.now(),
        title: formData.title,
        body: formData.body,
        date: new Date(),
        read: false
      };
      setNotifications([notification, ...notifications]);
      setFormData({ title: '', body: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="notification-dropdown-admin" ref={dropdownRef}>
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
            {notifications.length === 0 ? (
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
                      {formatFullDate(notification.date)}
                    </div>
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-body">{notification.body}</p>
                    <span className="notification-time">
                      {formatTime(notification.date)}
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

export default NotificationDropdownAdmin;
