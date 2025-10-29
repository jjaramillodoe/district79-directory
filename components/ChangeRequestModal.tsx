'use client';

import { useState } from 'react';

interface Site {
  _id: string;
  siteName: string;
  businessPhone?: string;
  daytimeDays?: string;
  daytimeHours?: string;
  eveningDays?: string;
  eveningHours?: string;
  saturdayHours?: string;
}

interface ChangeRequestModalProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangeRequestModal({ site, isOpen, onClose }: ChangeRequestModalProps) {
  const [formData, setFormData] = useState({
    businessPhone: site.businessPhone || '',
    daytimeDays: site.daytimeDays || '',
    daytimeHours: site.daytimeHours || '',
    eveningDays: site.eveningDays || '',
    eveningHours: site.eveningHours || '',
    saturdayHours: site.saturdayHours || '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site._id,
          siteName: site.siteName,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Change request submitted successfully! An admin will review it shortly.' });
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            businessPhone: site.businessPhone || '',
            daytimeDays: site.daytimeDays || '',
            daytimeHours: site.daytimeHours || '',
            eveningDays: site.eveningDays || '',
            eveningHours: site.eveningHours || '',
            saturdayHours: site.saturdayHours || '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            notes: '',
          });
          setTimeout(() => {
            onClose();
            setSubmitStatus(null);
          }, 1000);
        }, 2000);
      } else {
        setSubmitStatus({ type: 'error', message: data.error || 'Failed to submit change request' });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Failed to submit change request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Report Changes for {site.siteName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitStatus && (
            <div className={`p-4 rounded-lg ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {submitStatus.message}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Please only submit changes for phone numbers, hours, and times. Other information cannot be changed through this form.
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone Number
            </label>
            <input
              type="tel"
              name="businessPhone"
              value={formData.businessPhone}
              onChange={handleChange}
              placeholder={site.businessPhone || 'Enter phone number'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Current: {site.businessPhone || 'Not provided'}</p>
          </div>

          {/* Daytime Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daytime Days of Operation
              </label>
              <input
                type="text"
                name="daytimeDays"
                value={formData.daytimeDays}
                onChange={handleChange}
                placeholder={site.daytimeDays || 'e.g., Mon-Fri'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Current: {site.daytimeDays || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daytime Hours
              </label>
              <input
                type="text"
                name="daytimeHours"
                value={formData.daytimeHours}
                onChange={handleChange}
                placeholder={site.daytimeHours || 'e.g., 9:00 AM - 3:00 PM'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Current: {site.daytimeHours || 'Not provided'}</p>
            </div>
          </div>

          {/* Evening Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evening Days of Operation
              </label>
              <input
                type="text"
                name="eveningDays"
                value={formData.eveningDays}
                onChange={handleChange}
                placeholder={site.eveningDays || 'e.g., Mon-Thu'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Current: {site.eveningDays || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evening Hours
              </label>
              <input
                type="text"
                name="eveningHours"
                value={formData.eveningHours}
                onChange={handleChange}
                placeholder={site.eveningHours || 'e.g., 5:00 PM - 8:00 PM'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Current: {site.eveningHours || 'Not provided'}</p>
            </div>
          </div>

          {/* Saturday Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saturday Hours
            </label>
            <input
              type="text"
              name="saturdayHours"
              value={formData.saturdayHours}
              onChange={handleChange}
              placeholder={site.saturdayHours || 'e.g., 9:00 AM - 1:00 PM'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Current: {site.saturdayHours || 'Not provided'}</p>
          </div>

          {/* Contact Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional information about these changes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.contactName || !formData.contactEmail}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Change Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

