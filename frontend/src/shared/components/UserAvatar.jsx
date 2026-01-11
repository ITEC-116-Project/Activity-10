import { useState, useEffect } from 'react';
import './UserAvatar.css';

const UserAvatar = ({ userName }) => {
  const [initials, setInitials] = useState('');

  useEffect(() => {
    if (userName) {
      const parts = userName.trim().split(/\s+/);
      const initial = parts.length > 0 ? parts[0][0].toUpperCase() : 'U';
      setInitials(initial);
    }
  }, [userName]);

  return (
    <div className="avatar-circle">
      {initials}
    </div>
  );
};

export default UserAvatar;
