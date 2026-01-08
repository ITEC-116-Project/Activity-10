import React from 'react';
import { MdHome, MdEvent, MdAssessment, MdConfirmationNumber } from 'react-icons/md';

const SideNav = ({ activeSection, onChange }) => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}
          onClick={() => onChange('home')}
        >
          <MdHome className="icon" />
          <span>Home</span>
        </button>
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
          <span>My Ticket</span>
        </button>
        <button
          className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
          onClick={() => onChange('reports')}
        >
          <MdAssessment className="icon" />
          <span>Reports</span>
        </button>
      </nav>
    </aside>
  );
};

export default SideNav;
