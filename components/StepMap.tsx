import React, { useState, useEffect } from 'react';
import { CsvRow, FieldMapping, XFField } from '../types';

interface Props {
  headers: string[];
  dataPreview: CsvRow[];
  mapping: FieldMapping;
  onMappingChange: (mapping: FieldMapping) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepMap: React.FC<Props> = ({ headers, dataPreview, mapping, onMappingChange, onNext, onBack }) => {
  const [localMapping, setLocalMapping] = useState<FieldMapping>(mapping);

  const fields = [
    { key: XFField.TITLE, label: 'Resource Title', required: true, desc: 'The main name of the resource.' },
    { key: XFField.TAG_LINE, label: 'Tag Line', required: true, desc: 'Short description (required by XF). Will use AI if not mapped.' },
    { key: XFField.DESCRIPTION, label: 'Description', required: true, desc: 'Full content body.' },
    { key: XFField.VERSION, label: 'Version String', required: false, desc: 'e.g., 1.0.2' },
    { key: XFField.EXTERNAL_URL, label: 'Download/Purchase URL', required: false, desc: 'Link to external file.' },
  ];

  // Auto-guess mapping based on header names
  useEffect(() => {
    const newMapping = { ...localMapping };
    headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('title') || lower.includes('name')) newMapping[XFField.TITLE] = h;
        else if (lower.includes('tag') || lower.includes('short')) newMapping[XFField.TAG_LINE] = h;
        else if (lower.includes('desc') || lower.includes('content')) newMapping[XFField.DESCRIPTION] = h;
        else if (lower.includes('ver')) newMapping[XFField.VERSION] = h;
        else if (lower.includes('url') || lower.includes('link')) newMapping[XFField.EXTERNAL_URL] = h;
    });
    setLocalMapping(newMapping);
    onMappingChange(newMapping);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleChange = (field: XFField, header: string) => {
    const updated = { ...localMapping, [field]: header };
    setLocalMapping(updated);
    onMappingChange(updated);
  };

  const isValid = !!localMapping[XFField.TITLE] && !!localMapping[XFField.DESCRIPTION];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
           Map CSV Columns
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                {fields.map((f) => (
                    <div key={f.key} className="bg-slate-50 p-4 rounded border border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                            <span>{f.label} {f.required && <span className="text-red-500">*</span>}</span>
                            {localMapping[f.key as XFField] && <span className="text-xs text-green-600 font-bold">Mapped</span>}
                        </label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={localMapping[f.key as XFField] || ''}
                            onChange={(e) => handleChange(f.key as XFField, e.target.value)}
                        >
                            <option value="">-- Select Column --</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
                        {f.key === XFField.TAG_LINE && !localMapping[XFField.TAG_LINE] && (
                             <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Gemini AI will generate this if left empty.
                             </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col h-full">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-medium text-sm text-slate-700">
                    Data Preview (First 3 Rows)
                </div>
                <div className="overflow-auto flex-1 bg-white p-4">
                    {dataPreview.slice(0, 3).map((row, idx) => (
                        <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="text-xs font-bold text-slate-400 mb-1">Row {idx + 1}</div>
                            {Object.entries(row).map(([k, v]) => (
                                <div key={k} className="flex gap-2 text-sm mb-1">
                                    <span className="font-medium text-slate-600 min-w-[100px] block truncate" title={k}>{k}:</span>
                                    <span className="text-slate-800 truncate block flex-1" title={v}>{v}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-md font-medium text-slate-600 hover:bg-slate-200 transition"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`px-6 py-2 rounded-md font-medium transition shadow-lg ${
            isValid 
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30' 
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          Start Import
        </button>
      </div>
    </div>
  );
};

export default StepMap;