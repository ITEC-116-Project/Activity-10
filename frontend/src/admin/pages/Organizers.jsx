import React from 'react';

const Organizers = () => {
  return (
    <div className="section">
      <div className="section-header">
        <h2>Organizers & Staff</h2>
        <button className="btn-primary">+ Add Organizer</button>
      </div>

      <div className="organizers-grid">
        <div className="empty-state">
          <p>No organizers registered yet</p>
        </div>
      </div>
    </div>
  );
};

export default Organizers;
