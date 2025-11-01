import React, { useState, useEffect } from 'react';
import { bookingsAPI, facilitiesAPI, authAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFacilities: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [bookingsStats, facilitiesData, bookingsData] = await Promise.all([
        bookingsAPI.getStats().catch(() => ({ data: { totalBookings: 0, activeBookings: 0, revenue: 0 } })),
        facilitiesAPI.getAll().catch(() => ({ data: [] })),
        bookingsAPI.getAllBookings({ limit: 10 }).catch(() => ({ data: [] }))
      ]);

      setStats(prev => ({
        ...prev,
        totalBookings: bookingsStats.data?.totalBookings || 0,
        activeBookings: bookingsStats.data?.activeBookings || 0,
        totalRevenue: bookingsStats.data?.revenue || 0,
        totalFacilities: facilitiesData.data?.length || 0
      }));

      setFacilities(facilitiesData.data || []);
      setRecentBookings(bookingsData.data || []);

      // Try to get user count (this might need a separate endpoint)
      try {
        // This is a placeholder - you might need to implement this endpoint
        const usersResponse = await authAPI.getProfile();
        setStats(prev => ({
          ...prev,
          totalUsers: 1 // This would be replaced with actual user count
        }));
      } catch (error) {
        console.log('User count not available');
      }

    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFacilityTypeIcon = (type) => {
    const icons = {
      'tennis_court': '🎾',
      'swimming_pool': '🏊',
      'gym': '💪',
      'meeting_room': '💼',
      'squash_court': '🏸',
      'spa': '💆'
    };
    return icons[type] || '🏢';
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800',
      'no_show': 'bg-gray-100 text-gray-800',
      'available': 'bg-green-100 text-green-800',
      'maintenance': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-red-100 text-red-800'
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your leisure club operations</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'bookings', 'facilities'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Facilities</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalFacilities}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
            {recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.user_name || 'Unknown User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="mr-2">
                              {getFacilityTypeIcon(booking.facility_type)}
                            </span>
                            {booking.facility_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {moment(booking.start_time).format('MMM D, h:mm A')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${booking.total_cost || '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No recent bookings found</p>
            )}
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.user_name || 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {getFacilityTypeIcon(booking.facility_type)}
                          </span>
                          {booking.facility_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {moment(booking.start_time).format('MMM D, h:mm A')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No bookings found</p>
          )}
        </div>
      )}

      {/* Facilities Tab */}
      {activeTab === 'facilities' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Facility Management</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add Facility
            </button>
          </div>

          {facilities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => (
                <div key={facility.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{getFacilityTypeIcon(facility.type)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{facility.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{facility.type.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div>Capacity: {facility.capacity} people</div>
                    <div>Location: {facility.location || 'Not specified'}</div>
                    <div>Hours: {facility.operating_hours_start} - {facility.operating_hours_end}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(facility.status)}`}>
                      {facility.status}
                    </span>
                    <div className="space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No facilities found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;