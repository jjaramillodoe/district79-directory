'use client';

import { FileText, Upload } from 'lucide-react';

interface UploadSectionProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadStatus: string;
}

export default function UploadSection({ onFileUpload, uploading, uploadStatus }: UploadSectionProps) {
  return (
    <div className="surface-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Quick CSV upload</h2>
          <p className="mt-1 text-sm text-slate-500">
            Replaces directory fields in the same category. Descriptions and map coordinates are kept for matching site names.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-d79-navy px-4 py-2 text-sm font-medium text-white hover:bg-d79-blue">
          {uploading ? 'Uploading...' : (
            <>
              <Upload className="h-4 w-4" />
              Choose CSV
            </>
          )}
          <input
            type="file"
            accept=".csv"
            onChange={onFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {uploadStatus && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            uploadStatus.startsWith('✅') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {uploadStatus}
        </div>
      )}

      <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Adult Education and Youth Program files are categorized automatically.
      </p>
    </div>
  );
}
