import React, { useState } from 'react';
import { XFConfig } from '../types';
import { testConnection } from '../services/xfService';

interface Props {
  config: XFConfig;
  onChange: (config: XFConfig) => void;
  onNext: () => void;
}

const StepConfig: React.FC<Props> = ({ config, onChange, onNext }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [errorCode, setErrorCode] = useState(''); // 'PROXY_BLOCKED' | 'CORS_ERROR'
  const [categoryName, setCategoryName] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: string | number | boolean = value;

    if (type === 'checkbox') {
        val = (e.target as HTMLInputElement).checked;
    }
    else if (name === 'categoryId' || name === 'userId') val = parseInt(value) || 0;

    onChange({
      ...config,
      [name]: val,
    });
    
    // Reset test status when config changes
    if (testStatus !== 'idle') {
        setTestStatus('idle');
        setTestMessage('');
        setErrorCode('');
        setCategoryName('');
    }
  };

  const handleTest = async () => {
      if (!config.baseUrl || !config.apiKey || !config.categoryId) return;
      
      setTestStatus('testing');
      setTestMessage('Đang kết nối...');
      setErrorCode('');
      setCategoryName('');

      const result = await testConnection(config);
      
      if (result.success) {
          setTestStatus('success');
          setTestMessage(result.message);
          if (result.categoryName) setCategoryName(result.categoryName);
      } else {
          setTestStatus('error');
          setTestMessage(result.message);
          if (result.message === 'PROXY_BLOCKED') setErrorCode('PROXY_BLOCKED');
          if (result.message === 'CORS_ERROR') setErrorCode('CORS_ERROR');
      }
  };

  // Validation Checkers
  const isUrlFormatValid = !config.baseUrl || /^https?:\/\//i.test(config.baseUrl);
  const isValid = config.baseUrl.length > 0 && isUrlFormatValid && config.apiKey.length > 0 && config.categoryId > 0 && (config.userId > 0 || config.userId === undefined);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Guide Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden transition-all">
        <button 
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-blue-100 transition"
        >
            <div className="flex items-center gap-2 text-blue-800 font-semibold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Hướng dẫn & Lưu ý quan trọng</span>
            </div>
            <svg className={`w-5 h-5 text-blue-600 transition-transform ${showGuide ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        
        {showGuide && (
            <div className="p-4 border-t border-blue-200 text-sm text-slate-700 space-y-3 bg-white">
                 <div>
                    <strong className="text-slate-900 block mb-1">Cách lấy thông tin:</strong>
                    <ul className="list-disc list-inside ml-2 space-y-1 text-slate-600">
                        <li>Vào <code>Setup &gt; API Keys</code> -> Tạo key mới.</li>
                        <li>Scopes: Chọn <code>resource:write</code> và <code>resource:read</code>.</li>
                        <li><strong>Category ID:</strong> Số ID của chuyên mục tài nguyên.</li>
                    </ul>
                    <div className="mt-3 p-2 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-xs">
                        <strong>Lưu ý:</strong> Tool chạy ở chế độ Trực Tiếp. Bạn phải cài Plugin <a href="https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbagpbmhkcghm" target="_blank" className="underline font-bold">Allow CORS</a> trên trình duyệt thì mới kết nối được.
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Cấu hình Forum
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">XenForo Base URL</label>
            <input
              type="url"
              name="baseUrl"
              placeholder="https://forum.cuaban.com"
              value={config.baseUrl}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md outline-none transition ${
                  !isUrlFormatValid 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {!isUrlFormatValid && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    URL phải bắt đầu bằng <strong>http://</strong> hoặc <strong>https://</strong>
                </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
            <input
              type="password"
              name="apiKey"
              placeholder="Dán API Key vào đây..."
              value={config.apiKey}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category ID</label>
                <input
                  type="number"
                  name="categoryId"
                  placeholder="Ví dụ: 2"
                  value={config.categoryId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
                <input
                  type="number"
                  name="userId"
                  placeholder="Ví dụ: 1"
                  value={config.userId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
          </div>
        </div>
      </div>

      {errorCode === 'CORS_ERROR' && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm animate-fade-in">
               <div className="flex items-start">
                  <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                  </div>
                  <div className="ml-3">
                      <h3 className="text-sm font-bold text-amber-800">Chặn kết nối (CORS)</h3>
                      <div className="mt-1 text-sm text-amber-700">
                          <p className="mb-2">Trình duyệt đang chặn kết nối đến Forum. Do bạn đã tắt Proxy, bạn <strong>bắt buộc</strong> phải cài Plugin này để tool hoạt động:</p>
                          <a 
                            href="https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbagpbmhkcghm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline"
                        >
                            👉 Cài đặt Allow CORS Plugin
                        </a>
                        <p className="mt-2 italic text-xs">Sau khi cài, hãy nhớ bấm vào biểu tượng Plugin trên thanh trình duyệt để BẬT nó lên (Icon sáng màu).</p>
                      </div>
                  </div>
               </div>
          </div>
      )}

      {/* Test Status Feedback (Success or Generic Error) */}
      {testStatus !== 'idle' && errorCode === '' && (
          <div className={`p-4 rounded-lg flex items-center gap-3 border ${
              testStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
              testStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
              {testStatus === 'testing' && (
                   <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
              )}
              {testStatus === 'success' && (
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
              )}
              {testStatus === 'error' && (
                   <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
              )}
              
              <div className="flex-1">
                  <div className="font-semibold">
                      {testStatus === 'error' ? 'Kết nối thất bại!' : testMessage}
                  </div>
                  {testStatus === 'error' && (
                       <div className="text-sm text-slate-600 mt-1">{testMessage}</div>
                  )}
                  {categoryName && <div className="text-sm opacity-80 mt-1">Tìm thấy chuyên mục: <strong>{categoryName}</strong></div>}
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
         <button
          onClick={handleTest}
          disabled={!isValid || testStatus === 'testing'}
          className={`px-6 py-2 rounded-md font-medium transition border border-slate-300 hover:bg-slate-50 text-slate-700 ${
             !isValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Test API
        </button>

        <button
          onClick={onNext}
          disabled={!isValid || testStatus === 'testing'}
          className={`px-6 py-2 rounded-md font-medium transition flex items-center gap-2 ${
            isValid 
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30' 
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          Tiếp theo
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default StepConfig;