import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: ''
  });

  useEffect(() => {
    // Load profile data from localStorage
    setFormData({
      firstName: localStorage.getItem('firstName') || '',
      lastName: localStorage.getItem('lastName') || '',
      email: localStorage.getItem('email') || '',
      company: localStorage.getItem('company') || '',
      phone: localStorage.getItem('phone') || ''
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields (only name and email)
    if (!formData.firstName || !formData.email) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Information',
        text: 'Please fill in Name and Email fields to complete your profile.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0f766e'
      });
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('firstName', formData.firstName);
    localStorage.setItem('lastName', formData.lastName);
    localStorage.setItem('email', formData.email);
    localStorage.setItem('company', formData.company);
    localStorage.setItem('phone', formData.phone);
    
    setIsEditing(false);
    Swal.fire({
      icon: 'success',
      title: 'Profile Updated!',
      text: 'Your profile has been updated successfully.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#0f766e'
    });
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      firstName: localStorage.getItem('firstName') || '',
      lastName: localStorage.getItem('lastName') || '',
      email: localStorage.getItem('email') || '',
      company: localStorage.getItem('company') || '',
      phone: localStorage.getItem('phone') || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>My Profile</h2>
        <button className="btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
      </div>

      <div className="profile-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="profile-view">
            <div className="profile-card">
              <div className="profile-avatar" style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '40px', 
                color: 'white', 
                fontWeight: 'bold',
                margin: '0 auto 20px'
              }}>
                {formData.firstName.charAt(0).toUpperCase()}{formData.lastName.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info" style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '5px' }}>
                  {formData.firstName && formData.lastName 
                    ? `${formData.firstName} ${formData.lastName}`
                    : formData.firstName || 'Not set'}
                </h3>
                <p style={{ color: '#666' }}>Attendee</p>
              </div>
              <div className="profile-details" style={{ textAlign: 'left' }}>
                <div className="profile-field" style={{ marginBottom: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Name *</label>
                  <p style={{ margin: 0, fontSize: '16px', color: (formData.firstName || formData.lastName) ? '#111827' : '#9ca3af' }}>
                    {formData.firstName && formData.lastName 
                      ? `${formData.firstName} ${formData.lastName}`
                      : formData.firstName || 'Not provided'}
                  </p>
                </div>
                <div className="profile-field" style={{ marginBottom: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Email *</label>
                  <p style={{ margin: 0, fontSize: '16px', color: formData.email ? '#111827' : '#9ca3af' }}>{formData.email || 'Not provided'}</p>
                </div>
                <div className="profile-field" style={{ marginBottom: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Company (Optional)</label>
                  <p style={{ margin: 0, fontSize: '16px', color: formData.company ? '#111827' : '#9ca3af' }}>{formData.company || 'Not provided'}</p>
                </div>
                <div className="profile-field" style={{ marginBottom: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Phone (Optional)</label>
                  <p style={{ margin: 0, fontSize: '16px', color: formData.phone ? '#111827' : '#9ca3af' }}>{formData.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
      </div>

      {isEditing && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-button" onClick={handleCancel}>×</button>
            </div>
            <div style={{ padding: '20px 30px 30px 30px' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div className="form-group">
                  <label>Company (Optional)</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
