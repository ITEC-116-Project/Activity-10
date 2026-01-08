import React, { useState } from 'react';
import Pagination from '../../components/Pagination';

const Users = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'attendees',
    phone: ''
  });

  // Sample users data - replace with actual data
  const allUsers = []; // This will be populated with actual user data

  const totalPages = Math.ceil(allUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = allUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleAddUser = () => {
    // TODO: Implement user creation logic
    console.log('Creating user:', newUser);
    setShowAddModal(false);
    // Reset form
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      role: 'attendees',
      phone: ''
    });
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>User Management</h2>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add User</button>
      </div>

      <div className="search-bar">
        <input type="text" placeholder="Search users..." />
        <select>
          <option>All Roles</option>
          <option>Organizer</option>
          <option>Attendee</option>
        </select>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{/* Action buttons */}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {allUsers.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="close-button" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label>Role <span className="required">*</span></label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  required
                >
                  <option value="attendees">Attendee</option>
                  <option value="organizer">Organizer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary" 
                  disabled={!newUser.firstName || !newUser.lastName || !newUser.email}
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
