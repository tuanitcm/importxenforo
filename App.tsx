import React, { useState } from 'react';
import { XFConfig, CsvRow, FieldMapping } from './types';
import StepConfig from './components/StepConfig';
import StepUpload from './components/StepUpload';
import StepMap from './components/StepMap';
import StepRun from './components/StepRun';

const App: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  
  // App State
  const [config, setConfig] = useState<XFConfig>({
    baseUrl: '',
    apiKey: '',
    categoryId: 0,
    userId: 1, // Default Admin
    allowCorsProxy: false, // Default to Direct Mode (Requires Plugin)
    proxyUrl: '' 
  });
  
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [mapping, setMapping] = useState<FieldMapping>({
    title: '',
    tag_line: '',
    description: '',
    version_string: '',
    external_purchase_url: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleDataLoaded = (data: CsvRow[]) => {
    setCsvData(data);
    if (data.length > 0) {
      setHeaders(Object.keys(data[0]));
    }
    nextStep();
  };

  const handleReset = () => {
      setStep(1);
      setCsvData([]);
      setHeaders([]);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">XF</div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">XenForo Resource Importer</h1>
                    <p className="text-xs text-slate-400">CSV to Resource Manager via API</p>
                </div>
            </div>
            {/* Step Indicator */}
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-2 w-8 rounded-full transition-colors ${step >= s ? 'bg-blue-500' : 'bg-slate-700'}`} />
                ))}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {step === 1 && (
            <StepConfig 
                config={config} 
                onChange={setConfig} 
                onNext={nextStep} 
            />
        )}

        {step === 2 && (
            <StepUpload 
                onDataLoaded={handleDataLoaded} 
                onBack={prevStep} 
            />
        )}

        {step === 3 && (
            <StepMap 
                headers={headers} 
                dataPreview={csvData}
                mapping={mapping} 
                onMappingChange={setMapping} 
                onNext={nextStep} 
                onBack={prevStep}
            />
        )}

        {step === 4 && (
            <StepRun 
                config={config} 
                data={csvData} 
                mapping={mapping} 
                onReset={handleReset}
            />
        )}

      </main>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-sm mt-8">
        <p>Uses XenForo API 2.2+. Requires 'resource:write' scope.</p>
        <p className="mt-1">Enhanced with Google Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;