import React, { useState, useEffect } from 'react';
import { facilitiesAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showAvailability, setShowAvailability] = useState(false);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const response = await facilitiesAPI.getAll();
      setFacilities(response.data.facilities || []);
    } catch (error) {
      toast.error('Failed to load facilities');
      console.error('Error loading facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (facilityId) => {
    try {
      const response = await facilitiesAPI.getAvailability(facilityId, selectedDate);
      setSelectedFacility({
        ...facilities.find(f => f.id === facilityId),
        availability: response.data
      });
      setShowAvailability(true);
    } catch (error) {
      toast.error('Failed to check availability');
      console.error('Error checking availability:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Facilities</h1>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((facility) => (
          <div key={facility.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">{getFacilityTypeIcon(facility.type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{facility.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{facility.type.replace('_', ' ')}</p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{facility.description}</p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Capacity:</span>
                  <span>{facility.capacity} people</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">Location:</span>
                  <span>{facility.location || 'Not specified'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">Hours:</span>
                  <span>
                    {facility.operating_hours_start && facility.operating_hours_end
                      ? `${facility.operating_hours_start} - ${facility.operating_hours_end}`
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">Duration:</span>
                  <span>{facility.booking_duration_minutes || 60} minutes</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    facility.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : facility.status === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {facility.status}
                  </span>
                  {facility.requires_supervision && (
                    <span className="text-xs text-blue-600">Supervision required</span>
                  )}
                </div>

                <button
                  onClick={() => checkAvailability(facility.id)}
                  disabled={facility.status !== 'available'}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Check Availability
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAvailability && selectedFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedFacility.name} - Availability
              </h2>
              <button
                onClick={() => setShowAvailability(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Date: {moment(selectedDate).format('MMMM D, YYYY')}
            </div>

            {selectedFacility.availability && selectedFacility.availability.length > 0 ? (
              <div className="space-y-2">
                {selectedFacility.availability.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">
                        {moment(slot.start_time).format('h:mm A')} - {moment(slot.end_time).format('h:mm A')}
                      </span>
                      {slot.status && (
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          slot.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {slot.status}
                        </span>
                      )}
                    </div>
                    {slot.status === 'available' && (
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        Book
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No availability data for this date.</p>
            )}
          </div>
        </div>
      )}

      {facilities.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Facilities Available</h3>
          <p className="text-gray-600">There are no facilities configured at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default Facilities;