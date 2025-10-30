import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI, facilitiesAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user's bookings
      const bookingsResponse = await bookingsAPI.getAll({
        limit: 10,
        startDate: moment().startOf('day').toISOString(),
        endDate: moment().add(30, 'days').endOf('day').toISOString()
      });

      // Fetch facilities
      const facilitiesResponse = await facilitiesAPI.getAll({
        availableOnly: true,
        limit: 6
      });

      const bookings = bookingsResponse.data.bookings || [];
      const upcoming = bookings.filter(booking =>
        booking.status === 'confirmed' &&
        moment(booking.startTime).isAfter(moment())
      );

      setRecentBookings(bookings.slice(0, 5));
      setUpcomingBookings(upcoming.slice(0, 3));
      setFacilities(facilitiesResponse.data.facilities || []);

      // Calculate stats
      setStats({
        totalBookings: bookings.length,
        upcomingBookings: upcoming.length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingsAPI.cancel(bookingId);
      toast.success('Booking cancelled successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel booking');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="loading-spinner"></div>
    </div>;
  }

  return (
    <div className="container py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your leisure club activities today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">🎉</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelledBookings}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="card-title">📅 Upcoming Bookings</h2>
              <Link
                to="/bookings"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View All
              </Link>
            </div>
            <div className="card-body">
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📅</span>
                  <p className="text-gray-600 mb-4">No upcoming bookings</p>
                  <Link
                    to="/facilities"
                    className="btn btn-primary"
                  >
                    Book a Facility
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {booking.facilityName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            📅 {moment(booking.startTime).format('MMMM DD, YYYY')}
                          </p>
                          <p className="text-sm text-gray-600">
                            🕐 {moment(booking.startTime).format('h:mm A')} - {moment(booking.endTime).format('h:mm A')}
                          </p>
                          {booking.notes && (
                            <p className="text-sm text-gray-500 mt-2">
                              📝 {booking.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Available Facilities */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">⚡ Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <Link
                  to="/facilities"
                  className="w-full btn btn-primary text-center"
                >
                  🏢 Book a Facility
                </Link>
                <Link
                  to="/bookings"
                  className="w-full btn btn-outline text-center"
                >
                  📋 My Bookings
                </Link>
                <Link
                  to="/profile"
                  className="w-full btn btn-outline text-center"
                >
                  👤 Update Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Available Facilities */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="card-title">🏢 Popular Facilities</h2>
              <Link
                to="/facilities"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View All
              </Link>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {facilities.slice(0, 3).map((facility) => (
                  <div key={facility.id} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{facility.name}</h4>
                      <p className="text-sm text-gray-600">{facility.type}</p>
                    </div>
                    <Link
                      to={`/facilities/${facility.id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm"
                    >
                      Book →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;