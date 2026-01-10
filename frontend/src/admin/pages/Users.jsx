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
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingIds, setActionLoadingIds] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await manageAccountService.listUsers();
        // Deduplicate users by role+email to avoid duplicated rows from backend or DB
        const arr = Array.isArray(data) ? data : [];
        const unique = [...new Map(arr.map(u => [`${u.role}:${(u.email || '').toLowerCase()}`, u])).values()];
        setUsers(unique);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Unable to load users', text: err.message || 'Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const setActionLoading = (id, loading) => {
    setActionLoadingIds(prev => loading ? [...new Set([...prev, id])] : prev.filter(x => x !== id));
  };

  const handleToggleActive = async (user) => {
    if (user.role === 'admin') {
      Swal.fire({ icon: 'warning', title: 'Not allowed', text: 'Admin accounts cannot be deactivated.' });
      return;
    }

    const isCurrentlyActive = user.isActive !== false;
    const action = isCurrentlyActive ? 'Deactivate' : 'Activate';

    const confirmation = await Swal.fire({
      title: `${action} account?`,
      text: `Are you sure you want to ${action.toLowerCase()} this account for ${user.email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: action,
      cancelButtonText: 'Cancel',
    });

    if (!confirmation.isConfirmed) return;

    setActionLoading(user.id, true);

    try {
      const updated = await manageAccountService.updateUser(user.role, user.id, { isActive: !isCurrentlyActive });

      // Refresh the list from the server to ensure client state matches the backend
      try {
        const fresh = await manageAccountService.listUsers();
        const arr = Array.isArray(fresh) ? fresh : [];
        const unique = [...new Map(arr.map(u => [`${u.role}:${(u.email || '').toLowerCase()}`, u])).values()];
        setUsers(unique);

        // If the updated user is included in current filters, navigate to the page containing it so it stays visible
        const term = searchTerm.toLowerCase();
        const matches = unique.filter(u => {
          const matchesRole = filterRole === 'all' ? true : u.role === filterRole;
          const matchesSearch = term
            ? `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
            : true;
          const normalizeStatus = (usr) => (usr.status || (usr.disabled || usr.isActive === false ? 'inactive' : 'active')).toLowerCase();
          const matchesStatus = filterStatus === 'all' ? true : normalizeStatus(u) === filterStatus;
          return matchesRole && matchesSearch && matchesStatus;
        });

        const idx = matches.findIndex(u => u.id === updated.id);
        if (idx >= 0) {
          const page = Math.floor(idx / itemsPerPage) + 1;
          setCurrentPage(page);
        }
      } catch (err) {
        // Fallback to updating locally if reloading failed
        setUsers(prev => {
          const replaced = prev.map(u => (u.id === updated.id ? updated : u));
          if (!replaced.some(u => u.id === updated.id)) replaced.unshift(updated);
          const unique = [...new Map(replaced.map(u => [`${u.role}:${(u.email || '').toLowerCase()}`, u])).values()];
          return unique;
        });
      }

      Swal.fire({ icon: 'success', title: 'Success', text: `Account ${action.toLowerCase()}d successfully.` });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Operation failed', text: err.message || 'Please try again.' });
    } finally {
      setActionLoading(user.id, false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((u) => {
      const matchesRole = filterRole === 'all' ? true : u.role === filterRole;
      const matchesSearch = term
        ? `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
        : true;

      const normalizeStatus = (user) => (user.status || (user.disabled || user.isActive === false ? 'inactive' : 'active')).toLowerCase();
      const matchesStatus = filterStatus === 'all' ? true : normalizeStatus(u) === filterStatus;

      return matchesRole && matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // If the current page is out of range after filtering (e.g., toggling status reduces pages), clamp it
  React.useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    if (currentPage > total) {
      setCurrentPage(total);
    }
  }, [filteredUsers, currentPage, itemsPerPage]);

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

      // Prevent duplicates when adding (remove any existing user with same role+email)
      setUsers((prev) => [created, ...prev.filter(u => !(u.role === created.role && (u.email || '').toLowerCase() === (created.email || '').toLowerCase()))]);
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

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ marginLeft: '8px' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-state">Loading users...</td>
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
                    <td>{user.phone || '-'}</td>
                    <td>{roleName(user.role)}</td>
                    <td><span className={`status ${status}`}>{capitalize(status)}</span></td>
                    <td>
                      {user.role === 'admin' ? (
                        <span>—</span>
                      ) : (
                        <button
                          className="btn-secondary"
                          onClick={() => handleToggleActive(user)}
                          disabled={actionLoadingIds.includes(user.id)}
                        >
                          {actionLoadingIds.includes(user.id) ? 'Processing...' : (status === 'active' ? 'Deactivate' : 'Activate')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">No users found</td>
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
