'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { joinNamedPhones, parseNamedPhones, type NamedPhone } from '@/lib/staff';

interface Site {
  _id: string;
  siteName: string;
  businessPhone?: string;
  daytimeDays?: string;
  daytimeHours?: string;
  eveningDays?: string;
  eveningHours?: string;
  saturdayHours?: string;
  siteSupervisor?: string;
  siteSupervisorPhone?: string;
}

interface ChangeRequestModalProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
}

const emptyForm = (site: Site) => ({
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

const emptySupervisors = (site: Site): NamedPhone[] => {
  const parsed = parseNamedPhones(site.siteSupervisor, site.siteSupervisorPhone);
  return parsed.length > 0 ? parsed : [{ name: '', phone: '' }];
};

function Field({
  label,
  name,
  value,
  current,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  current?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="select-field"
      />
      {current !== undefined && (
        <span className="mt-1 block text-xs text-slate-400">Current: {current || 'Not provided'}</span>
      )}
    </label>
  );
}

export default function ChangeRequestModal({ site, isOpen, onClose }: ChangeRequestModalProps) {
  const [formData, setFormData] = useState(() => emptyForm(site));
  const [supervisors, setSupervisors] = useState<NamedPhone[]>(() => emptySupervisors(site));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(emptyForm(site));
      setSupervisors(emptySupervisors(site));
      setSubmitStatus(null);
    }
    // Reset when the dialog opens or the site changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, site._id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const { names: siteSupervisor, phones: siteSupervisorPhone } = joinNamedPhones(supervisors);

      const response = await fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site._id,
          siteName: site.siteName,
          ...formData,
          siteSupervisor,
          siteSupervisorPhone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Change request submitted. An admin will review it shortly.',
        });
        setTimeout(onClose, 1600);
      } else {
        setSubmitStatus({ type: 'error', message: data.error || 'Failed to submit change request' });
      }
    } catch {
      setSubmitStatus({ type: 'error', message: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateSupervisor = (index: number, field: keyof NamedPhone, value: string) => {
    setSupervisors((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addSupervisor = () => {
    setSupervisors((current) => [...current, { name: '', phone: '' }]);
  };

  const removeSupervisor = (index: number) => {
    setSupervisors((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ name: '', phone: '' }];
    });
  };

  const currentSupervisorLabel =
    parseNamedPhones(site.siteSupervisor, site.siteSupervisorPhone)
      .map((s) => [s.name, s.phone].filter(Boolean).join(' · '))
      .filter(Boolean)
      .join(' / ') || 'Not provided';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-request-title"
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Report changes</p>
            <h2 id="change-request-title" className="mt-0.5 text-lg font-semibold text-d79-navy">
              {site.siteName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {submitStatus && (
              <div
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  submitStatus.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <p className="rounded-lg bg-d79-sky px-3 py-2 text-sm text-d79-navy">
              Phone numbers, hours, and site supervisors can be updated here. Admins review every request before it
              goes live.
            </p>

            <Field
              label="Business phone"
              name="businessPhone"
              type="tel"
              value={formData.businessPhone}
              current={site.businessPhone}
              onChange={handleChange}
              placeholder="e.g., 718-333-7455"
            />

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Site supervisor(s)</p>
                <button
                  type="button"
                  onClick={addSupervisor}
                  className="inline-flex items-center gap-1 text-xs font-medium text-d79-blue hover:text-d79-navy"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add supervisor
                </button>
              </div>
              <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                {supervisors.map((supervisor, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={supervisor.name}
                        onChange={(e) => updateSupervisor(index, 'name', e.target.value)}
                        placeholder="Supervisor name"
                        className="select-field"
                      />
                      <input
                        type="tel"
                        value={supervisor.phone}
                        onChange={(e) => updateSupervisor(index, 'phone', e.target.value)}
                        placeholder="Phone number"
                        className="select-field"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSupervisor(index)}
                      className="mt-2 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove supervisor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <span className="block text-xs text-slate-400">Current: {currentSupervisorLabel}</span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Hours</p>
              <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Daytime days"
                    name="daytimeDays"
                    value={formData.daytimeDays}
                    current={site.daytimeDays}
                    onChange={handleChange}
                    placeholder="e.g., M, T, W, Th"
                  />
                  <Field
                    label="Daytime hours"
                    name="daytimeHours"
                    value={formData.daytimeHours}
                    current={site.daytimeHours}
                    onChange={handleChange}
                    placeholder="e.g., 4:00 PM – 8:30 PM"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Evening days"
                    name="eveningDays"
                    value={formData.eveningDays}
                    current={site.eveningDays}
                    onChange={handleChange}
                    placeholder="e.g., Mon–Thu"
                  />
                  <Field
                    label="Evening hours"
                    name="eveningHours"
                    value={formData.eveningHours}
                    current={site.eveningHours}
                    onChange={handleChange}
                    placeholder="e.g., 5:00 PM – 8:00 PM"
                  />
                </div>
                <Field
                  label="Saturday hours"
                  name="saturdayHours"
                  value={formData.saturdayHours}
                  current={site.saturdayHours}
                  onChange={handleChange}
                  placeholder="e.g., 9:00 AM – 1:00 PM"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Your contact</p>
              <div className="space-y-3">
                <Field
                  label="Name"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Email"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="you@schools.nyc.gov"
                    required
                  />
                  <Field
                    label="Phone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Notes
                  </span>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Anything else admins should know"
                    className="select-field min-h-[72px] resize-y"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.contactName || !formData.contactEmail}
              className="inline-flex items-center gap-2 rounded-lg bg-d79-navy px-4 py-2 text-sm font-medium text-white hover:bg-d79-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
