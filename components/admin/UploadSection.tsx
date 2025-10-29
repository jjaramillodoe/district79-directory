'use client';

import { FileText, Upload } from 'lucide-react';

interface UploadSectionProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadStatus: string;
}

export default function UploadSection({ onFileUpload, uploading, uploadStatus }: UploadSectionProps) {
  return (
    <>
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload CSV Files</h2>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Upload your CSV files to update the directory
            </p>
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
              <Upload className="mr-2 h-5 w-5" />
              Choose File
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
            <div className={`p-4 rounded-lg ${
              uploadStatus.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">How to Upload CSV Files:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Click "Choose File" and select your CSV file</li>
          <li>Files will be automatically categorized as Adult Education or Youth Programs</li>
          <li>Existing sites in the same category will be replaced</li>
          <li>Wait for the success message before uploading another file</li>
        </ol>
      </div>
    </>
  );
}

