import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data;
      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        email: userData.email || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(formData);
      toast.success('Profile updated successfully!');
      setEditMode(false);
      loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
      console.error('Error changing password:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800',
      'staff': 'bg-blue-100 text-blue-800',
      'member': 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'suspended': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32"></div>
            <div className="relative px-6 pb-6">
              <div className="flex items-center -mt-12 mb-4">
                <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {user.first_name} {user.last_name}
              </h2>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>{user.email}</div>
                {user.phone && <div>{user.phone}</div>}
                <div>Member since: {new Date(user.created_at).toLocaleDateString()}</div>
              </div>

              <div className="flex space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                  {user.status}
                </span>
                {user.email_verified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  editMode
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                    title="Email cannot be changed here"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change email address</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        phone: user.phone || '',
                        email: user.email || ''
                      });
                    }}
                    className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                    <p className="text-gray-900">{user.first_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                    <p className="text-gray-900">{user.last_name || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                  <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Account Status</label>
                    <p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                    <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;