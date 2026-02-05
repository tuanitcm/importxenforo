import React, { useState, useEffect, useRef } from 'react';
import { CsvRow, XFConfig, FieldMapping, XFField, LogEntry, ImportStats } from '../types';
import { postResource } from '../services/xfService';
import { generateTagLine, enhanceDescription } from '../services/geminiService';

interface Props {
  config: XFConfig;
  data: CsvRow[];
  mapping: FieldMapping;
  onReset: () => void;
}

const StepRun: React.FC<Props> = ({ config, data, mapping, onReset }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<ImportStats>({ total: data.length, success: 0, failed: 0, processed: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [currentAction, setCurrentAction] = useState<string>('Ready to start');

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (status: LogEntry['status'], message: string, details?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      status,
      message,
      details
    }]);
  };

  const runImport = async () => {
    setIsRunning(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      setStats(prev => ({ ...prev, processed: i + 1 }));
      
      const title = row[mapping[XFField.TITLE]];
      const rawDesc = row[mapping[XFField.DESCRIPTION]];
      
      // Basic Validation
      if (!title || !rawDesc) {
        addLog('error', `Row ${i+1}: Thiếu Title hoặc Description`, JSON.stringify(row));
        failCount++;
        setStats(prev => ({ ...prev, failed: failCount }));
        continue;
      }

      setCurrentAction(`Checking "${title}"...`);

      // Prepare Data
      let tagLine = row[mapping[XFField.TAG_LINE]] || '';
      let description = rawDesc;

      // AI Enhancement
      if (useAI) {
        if (!tagLine) {
            setIsAiProcessing(true);
            setCurrentAction(`AI: Generating Tagline for "${title}"...`);
            try {
                tagLine = await generateTagLine(title, rawDesc);
            } catch (e) {
                // Fallback handled in service, but ensure UI doesn't hang
            } finally {
                setIsAiProcessing(false);
            }
        }
        // Optional: Enhance description if it's too short, but let's keep it simple for now
        // description = await enhanceDescription(rawDesc);
      } else if (!tagLine) {
          tagLine = description.substring(0, 90); // Fallback truncation
      }

      // Construct API Payload
      const params = new URLSearchParams();
      params.append('resource_category_id', config.categoryId.toString());
      params.append('title', title);
      params.append('tag_line', tagLine);
      params.append('description', description);
      
      if (mapping[XFField.VERSION] && row[mapping[XFField.VERSION]]) {
          params.append('version_string', row[mapping[XFField.VERSION]]);
      } else {
          params.append('version_string', '1.0.0'); // Default
      }

      if (mapping[XFField.EXTERNAL_URL] && row[mapping[XFField.EXTERNAL_URL]]) {
          params.append('external_purchase_url', row[mapping[XFField.EXTERNAL_URL]]);
          params.append('is_fileless', '1'); // Usually required if no file uploaded
      }
      
      // Send to XF
      setCurrentAction(`Uploading "${title}" to XenForo...`);
      const result = await postResource(config, params);

      if (result.success) {
        addLog('success', `Success: ${title}`, `ID: ${result.resource?.resource_id}`);
        successCount++;
        setStats(prev => ({ ...prev, success: successCount }));
      } else {
        // Format error messages nicely
        const errorMsg = result.errors 
            ? result.errors.map(e => `[${e.code}] ${e.message}`).join(' | ') 
            : 'Unknown Error';
            
        addLog('error', `Failed: ${title}`, errorMsg);
        failCount++;
        setStats(prev => ({ ...prev, failed: failCount }));
      }

      // Small delay to be nice to the server
      await new Promise(r => setTimeout(r, 500));
    }

    setIsRunning(false);
    setCurrentAction('Import Complete');
    addLog('info', 'Process finished.');
  };

  const progressPercent = Math.round((stats.processed / stats.total) * 100) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Import
            </h2>
            {!isRunning && stats.processed === 0 && (
                 <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer bg-blue-50 px-3 py-1 rounded border border-blue-100">
                    <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="flex items-center gap-1">
                        Enable Gemini AI 
                        <span className="text-xs text-purple-600 font-medium bg-purple-50 px-1 rounded border border-purple-100">Auto-Tagline</span>
                    </span>
                 </label>
            )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>Progress: {stats.processed} / {stats.total}</span>
                <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${isAiProcessing ? 'bg-purple-500' : 'bg-blue-600'}`} 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
            
            <div className="mt-2 text-sm h-6 flex items-center gap-2">
                {isAiProcessing ? (
                   <>
                       <span className="flex h-3 w-3 relative">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                       </span>
                       <span className="text-purple-600 font-medium italic transition-colors animate-pulse">
                          {currentAction}
                       </span>
                   </>
                ) : (
                    <span className="text-slate-500 italic transition-colors">
                        {currentAction}
                    </span>
                )}
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <div className="text-xs text-green-800 font-medium uppercase tracking-wide">Success</div>
            </div>
            <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-xs text-red-800 font-medium uppercase tracking-wide">Failed</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-600">{stats.total - stats.processed}</div>
                <div className="text-xs text-slate-800 font-medium uppercase tracking-wide">Remaining</div>
            </div>
        </div>
        
        {/* Action Button */}
        <div className="flex justify-center">
            {!isRunning && stats.processed === 0 && (
                <button
                    onClick={runImport}
                    className="bg-blue-600 text-white px-8 py-3 rounded-md font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 transition transform flex items-center gap-2"
                >
                    Start Import
                </button>
            )}
             {!isRunning && stats.processed > 0 && (
                <button
                    onClick={onReset}
                    className="bg-slate-600 text-white px-8 py-3 rounded-md font-bold hover:bg-slate-700 transition"
                >
                    Start Over
                </button>
            )}
        </div>
      </div>

      {/* Logs Console */}
      <div className="bg-slate-900 rounded-lg shadow-lg overflow-hidden border border-slate-800">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
            <span className="text-slate-300 text-sm font-mono">System Logs</span>
            <span className="text-xs text-slate-500">{logs.length} lines</span>
        </div>
        <div ref={logContainerRef} className="h-64 overflow-y-auto p-4 font-mono text-sm space-y-1">
            {logs.length === 0 && <div className="text-slate-600 italic">Waiting to start...</div>}
            {logs.map(log => (
                <div key={log.id} className="flex gap-2">
                    <span className="text-slate-500">[{log.timestamp.toLocaleTimeString()}]</span>
                    <span className={`
                        min-w-[70px]
                        ${log.status === 'success' ? 'text-green-400' : ''}
                        ${log.status === 'error' ? 'text-red-400' : ''}
                        ${log.status === 'info' ? 'text-blue-300' : ''}
                    `}>
                        {log.status.toUpperCase()}:
                    </span>
                    <div className="flex flex-col">
                        <span className="text-slate-300">{log.message}</span>
                        {log.details && (
                            <span className="text-slate-400 text-xs mt-0.5 break-all opacity-80 pl-2 border-l border-slate-700">
                                {log.details}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
};

export default StepRun;