import { useState } from 'react';
import {
  User, FileText, AlertCircle, CheckCircle,
  XCircle, ChevronRight, ChevronLeft, Send, Shield,
} from 'lucide-react';

const AI_ENGINE = "http://localhost:8001";

export function NewClaim() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 0, name: 'Patient & Document', icon: User },
    { id: 1, name: 'Extraction & Validation', icon: FileText },
    { id: 2, name: 'Evidence Collection', icon: Shield },
    { id: 3, name: 'Review & Submit', icon: Send },
  ];

  const mockPatients = [
    { id: 'PAT_001', name: 'Rajesh Kumar', dob: '1978-04-12', insurer: 'StarHealth (INS_A)' },
    { id: 'PAT_002', name: 'Sunita Rao', dob: '1972-06-20', insurer: 'HDFC ERGO (INS_B)' },
  ];

  const handleAnalyze = async () => {
    if (!noteText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${AI_ENGINE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText }),
      });
      const data = await res.json();
      setAnalysisResult(data);
      setCurrentStep(1);
    } catch (e) {
      setError("AI Engine not reachable. Make sure python ai-engine/main.py is running on port 8001.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step1PatientDocument
          patients={mockPatients}
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
          noteText={noteText}
          setNoteText={setNoteText}
          handleAnalyze={handleAnalyze}
          loading={loading}
          error={error}
        />;
      case 1: return <Step2Extraction analysisResult={analysisResult} />;
      case 2: return <Step3Evidence analysisResult={analysisResult} />;
      case 3: return <Step4Review analysisResult={analysisResult} />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">New Pre-Authorization</h1>
        <p className="text-slate-600">AI-powered claim assembly in under 10 minutes</p>
      </div>

      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted ? 'bg-green-500 border-green-500'
                    : isActive ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-300'
                  }`}>
                    {isCompleted
                      ? <CheckCircle className="w-6 h-6 text-white" />
                      : <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    }
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    isActive || isCompleted ? 'text-slate-900' : 'text-slate-500'
                  }`}>{step.name}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto">{renderStepContent()}</div>
      </div>

      <div className="bg-white border-t border-slate-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={() => currentStep < steps.length - 1
              ? setCurrentStep(currentStep + 1)
              : alert("Claim submitted to billing team!")}
            disabled={currentStep === 0 || (currentStep > 0 && !analysisResult)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {currentStep === steps.length - 1 ? 'Submit Claim' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Step1PatientDocument({ patients, selectedPatient, setSelectedPatient, noteText, setNoteText, handleAnalyze, loading, error }: any) {
  const sampleNote = `Patient Rajesh Kumar, 45-year-old male, presents with severe lower back pain radiating to the left leg for over 14 months. MRI confirms L4-L5 disc herniation with significant nerve root compression. Conservative treatments including 6 weeks of physiotherapy and two epidural steroid injections have failed to provide lasting relief. I strongly recommend proceeding with Lumbar Discectomy (L4-L5). The procedure is medically necessary to prevent permanent neurological damage.`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Patient</h2>
        <div className="grid grid-cols-1 gap-3">
          {patients.map((patient: any) => (
            <button
              key={patient.id}
              onClick={() => setSelectedPatient(patient.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedPatient === patient.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                    <span>ID: {patient.id}</span>
                    <span>•</span>
                    <span>DOB: {patient.dob}</span>
                    <span>•</span>
                    <span>{patient.insurer}</span>
                  </div>
                </div>
                {selectedPatient === patient.id && <CheckCircle className="w-6 h-6 text-blue-600" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Surgeon's Recommendation Note</h2>
          <button
            onClick={() => setNoteText(sampleNote)}
            className="text-sm text-blue-600 hover:underline"
          >
            Use sample note
          </button>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={6}
          placeholder="Paste the surgeon's recommendation note here..."
          className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          onClick={handleAnalyze}
          disabled={!selectedPatient || !noteText.trim() || loading}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              AI Engine Analyzing... (10-20 seconds)
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Analyze with AI Engine
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Step2Extraction({ analysisResult }: any) {
  if (!analysisResult) return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
      <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
      <span className="text-blue-900">Waiting for analysis...</span>
    </div>
  );

  const { extracted, policy, evidence } = analysisResult;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Extracted Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Procedure", value: extracted.procedure },
            { label: "CPT Code", value: extracted.cpt_code },
            { label: "ICD-10 Code", value: extracted.icd10_code },
            { label: "Urgency", value: extracted.urgency },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">{item.label}</p>
              <p className="font-mono font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {policy?.required_documents && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Insurance Policy Requirements</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-1">Max Approved Amount</p>
              <p className="text-xl font-bold text-blue-900">
                ₹{policy.max_approved_amount_inr?.toLocaleString() || "N/A"}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700 mb-1">Pre-auth Timeline</p>
              <p className="text-xl font-bold text-purple-900">
                {policy.preauth_timeline_days || "N/A"} days
              </p>
            </div>
          </div>
          <h3 className="font-semibold text-slate-900 mb-3">Required Documents</h3>
          <div className="space-y-2">
            {policy.required_documents.map((doc: string, idx: number) => {
              const missing = evidence?.missing_documents?.includes(doc);
              return (
                <div key={idx} className={`p-3 rounded-lg border ${
                  missing ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {missing
                      ? <XCircle className="w-5 h-5 text-red-600" />
                      : <CheckCircle className="w-5 h-5 text-green-600" />}
                    <p className={`font-medium ${missing ? 'text-red-900' : 'text-green-900'}`}>
                      {doc}
                    </p>
                    {missing && (
                      <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                        ACTION REQUIRED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Step3Evidence({ analysisResult }: any) {
  if (!analysisResult) return null;
  const { evidence } = analysisResult;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Evidence Collection Complete</h2>
        <p className="text-blue-100">AI extracted supporting evidence from patient EHR</p>
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { value: evidence.matched_diagnoses?.length || 0, label: "Diagnosis Records" },
            { value: evidence.relevant_labs?.length || 0, label: "Relevant Labs" },
            { value: evidence.prior_treatments?.length || 0, label: "Prior Treatments" },
            { value: evidence.medications?.length || 0, label: "Medications" },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-blue-100">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Matched Diagnoses</h3>
        <div className="space-y-3">
          {evidence.matched_diagnoses?.map((d: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{d.description}</p>
                <p className="text-sm text-slate-600">ICD-10: {d.icd10}</p>
              </div>
              <span className="text-sm text-slate-500">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">
          Prior Conservative Treatments
          <span className="text-green-600 ml-2 text-sm">(Medical Necessity Demonstrated)</span>
        </h3>
        <div className="space-y-3">
          {evidence.prior_treatments?.map((t: any, idx: number) => (
            <div key={idx} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{t.type}</h4>
                <span className="text-sm text-slate-500">{t.date}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {t.duration && <div><span className="text-slate-600">Duration: </span><span className="font-medium">{t.duration}</span></div>}
                <div><span className="text-slate-600">Outcome: </span><span className="font-medium">{t.outcome}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Relevant Lab Reports</h3>
        <div className="space-y-2">
          {evidence.relevant_labs?.map((lab: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{lab.type}</p>
                  <p className="text-sm text-slate-600">{lab.findings}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-slate-500">{lab.date}</span>
                  <p className="text-xs text-green-700 font-medium mt-1">✓ Included</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4Review({ analysisResult }: any) {
  if (!analysisResult) return null;
  const { extracted, evidence, risk, policy } = analysisResult;
  const riskColors: any = { LOW: "green", MEDIUM: "amber", HIGH: "red" };
  const rc = riskColors[risk.level] || "slate";

  return (
    <div className="space-y-6">
      <div className={`bg-white rounded-xl p-6 border-2 border-${rc}-500`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Rejection Risk Assessment</h2>
            <p className="text-slate-600 mt-1">{risk.message}</p>
          </div>
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full bg-${rc}-100 flex items-center justify-center mb-2`}>
              <span className={`text-3xl font-bold text-${rc}-700`}>{risk.score}</span>
            </div>
            <span className={`inline-block px-4 py-1 bg-${rc}-100 text-${rc}-800 rounded-full font-semibold text-sm`}>
              {risk.level} RISK
            </span>
          </div>
        </div>
        <h3 className="font-semibold text-slate-900 mb-3">Risk Factors</h3>
        <div className="space-y-2">
          {risk.factors?.map((factor: any, idx: number) => (
            <div key={idx} className={`p-3 rounded-lg flex items-center justify-between ${
              factor.positive ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {factor.positive
                  ? <CheckCircle className="w-5 h-5 text-green-600" />
                  : <AlertCircle className="w-5 h-5 text-amber-600" />}
                <span className={`font-medium ${factor.positive ? 'text-green-900' : 'text-amber-900'}`}>
                  {factor.factor}
                </span>
              </div>
              {factor.impact !== 0 && (
                <span className="font-semibold text-red-700">{factor.impact}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pre-Authorization Package</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: "Patient", value: evidence.patient_name },
            { label: "Procedure", value: extracted.procedure },
            { label: "CPT Code", value: extracted.cpt_code },
            { label: "ICD-10", value: extracted.icd10_code },
            { label: "Insurer", value: evidence.insurer_id },
            { label: "Policy Number", value: evidence.policy_number },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">{item.label}</p>
              <p className="font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        {risk.missing_documents?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 mb-2">Action Required — Missing Documents</p>
                {risk.missing_documents.map((doc: string, idx: number) => (
                  <p key={idx} className="text-sm text-amber-800">
                    • Obtain and upload: <strong>{doc}</strong>
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => alert("✅ Claim package submitted to billing team!")}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Send className="w-5 h-5" />
        Submit Pre-Authorization to Billing Team
      </button>
    </div>
  );
}