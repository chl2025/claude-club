import React, { useState, useEffect } from 'react';
import { bookingsAPI, facilitiesAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsResponse, facilitiesResponse] = await Promise.all([
        bookingsAPI.getAll(),
        facilitiesAPI.getAll()
      ]);

      setBookings(bookingsResponse.data || []);
      setFacilities(facilitiesResponse.data || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedFacility || !selectedDate || !selectedStartTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const endTime = moment(selectedDate + ' ' + selectedStartTime)
        .add(60, 'minutes')
        .toISOString();

      const bookingData = {
        facilityId: selectedFacility,
        startTime: moment(selectedDate + ' ' + selectedStartTime).toISOString(),
        endTime: endTime,
        notes: notes || undefined
      };

      const response = await bookingsAPI.create(bookingData);

      if (response.data) {
        toast.success('Booking created successfully!');
        setShowCreateModal(false);
        setSelectedFacility('');
        setSelectedStartTime('');
        setNotes('');
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create booking');
      console.error('Error creating booking:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingsAPI.cancel(bookingId);
      toast.success('Booking cancelled successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to cancel booking');
      console.error('Error cancelling booking:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800',
      'no_show': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Booking
        </button>
      </div>

      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const facility = facilities.find(f => f.id === booking.facility_id);
            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">
                      {facility ? getFacilityTypeIcon(facility.type) : '🏢'}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {facility?.name || 'Unknown Facility'}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {facility?.type?.replace('_', ' ') || 'Facility'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Date:</span>
                      <span>{moment(booking.start_time).format('MMMM D, YYYY')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Time:</span>
                      <span>
                        {moment(booking.start_time).format('h:mm A')} - {moment(booking.end_time).format('h:mm A')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Duration:</span>
                      <span>{moment(booking.end_time).diff(moment(booking.start_time), 'minutes')} minutes</span>
                    </div>
                    {booking.total_cost && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Cost:</span>
                        <span>${booking.total_cost}</span>
                      </div>
                    )}
                    {booking.notes && (
                      <div className="flex items-start">
                        <span className="font-medium mr-2">Notes:</span>
                        <span className="flex-1">{booking.notes}</span>
                      </div>
                    )}
                  </div>

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {booking.status === 'completed' && (
                    <div className="text-center text-green-600 font-medium">
                      Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
          <p className="text-gray-600 mb-6">You haven't made any bookings yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Booking
          </button>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Booking</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facility *
                </label>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a facility</option>
                  {facilities
                    .filter(f => f.status === 'available')
                    .map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name} ({facility.type.replace('_', ' ')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={moment().format('YYYY-MM-DD')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <select
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select start time</option>
                  {generateTimeSlots().map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requirements or notes..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBooking}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;