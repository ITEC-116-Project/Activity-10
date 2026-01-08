import React from 'react';
import { MdEvent, MdConfirmationNumber, MdPerson } from 'react-icons/md';

const SideNav = ({ activeSection, onChange }) => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeSection === 'events' ? 'active' : ''}`}
          onClick={() => onChange('events')}
        >
          <MdEvent className="icon" />
          <span>Events</span>
        </button>
        <button
          className={`nav-item ${activeSection === 'mytickets' ? 'active' : ''}`}
          onClick={() => onChange('mytickets')}
        >
          <MdConfirmationNumber className="icon" />
          <span>My Tickets</span>
        </button>
        <button
          className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => onChange('profile')}
        >
          <MdPerson className="icon" />
          <span>Profile</span>
        </button>
      </nav>
    </aside>
  );
};

export default SideNav;
