import React, { useState } from 'react';
import { CsvRow } from '../types';
import { parseCSV } from '../utils/csvParser';

interface Props {
  onDataLoaded: (data: CsvRow[]) => void;
  onBack: () => void;
}

const StepUpload: React.FC<Props> = ({ onDataLoaded, onBack }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setError('CSV file appears empty or invalid.');
        } else {
          onDataLoaded(parsed);
        }
      } catch (err) {
        setError('Failed to parse CSV.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
           <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload CSV Data
        </h2>

        <div 
            className={`border-2 border-dashed rounded-lg p-12 text-center transition cursor-pointer ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            }}
        >
            <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept=".csv"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
                <div className="mx-auto h-12 w-12 text-slate-400 mb-3">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <p className="text-lg font-medium text-slate-700">Drop your CSV file here</p>
                <p className="text-sm text-slate-500 mt-1">or click to browse</p>
            </label>
        </div>

        {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
            </div>
        )}

        <div className="mt-6 bg-slate-50 p-4 rounded text-sm text-slate-600">
            <h3 className="font-semibold mb-2">Expected Format Tips:</h3>
            <ul className="list-disc list-inside space-y-1">
                <li>Headers on the first row are required.</li>
                <li>Ensure column names are unique.</li>
                <li>File encoding should be UTF-8.</li>
            </ul>
        </div>
      </div>

      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-md font-medium text-slate-600 hover:bg-slate-200 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default StepUpload;