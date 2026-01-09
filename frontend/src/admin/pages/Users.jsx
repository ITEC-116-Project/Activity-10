import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';
import { manageAccountService } from '../../shared/services/manageAccountService';

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
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await manageAccountService.listUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Unable to load users', text: err.message || 'Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((u) => {
      const matchesRole = filterRole === 'all' ? true : u.role === filterRole;
      const matchesSearch = term
        ? `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
        : true;
      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, filterRole]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      role: 'attendees',
      phone: ''
    });
  };

  const handleAddUser = async () => {
    setSubmitting(true);
    try {
      const created = await manageAccountService.createUser({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone || undefined,
      });

      setUsers((prev) => [created, ...prev]);
      // Show a success notification but don't reveal the temporary password in the alert
      Swal.fire({ icon: 'success', title: 'User added', text: 'User was created successfully.' });
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Unable to add user', text: err.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>User Management</h2>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add User</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="organizer">Organizer</option>
          <option value="attendees">Attendee</option>
          <option value="admin">Admin</option>
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
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-state">Loading users...</td>
              </tr>
            ) : currentUsers.length > 0 ? (
              currentUsers.map(user => {
                const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
                const roleName = (r) => ({ attendees: 'Attendee', organizer: 'Organizer', admin: 'Admin' }[r] || capitalize(r));
                const status = (user.status || (user.disabled || user.isActive === false ? 'inactive' : 'active')).toLowerCase();

                return (
                  <tr key={user.id}>
                    <td>{`${capitalize(user.firstName || '')} ${capitalize(user.lastName || '')}`.trim()}</td>
                    <td>{user.email}</td>
                    <td>{roleName(user.role)}</td>
                    <td><span className={`status ${status}`}>{capitalize(status)}</span></td>
                    <td>{/* Action buttons */}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > itemsPerPage && (
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
                  disabled={!newUser.firstName || !newUser.lastName || !newUser.email || submitting}
                >
                  {submitting ? 'Adding...' : 'Add User'}
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
