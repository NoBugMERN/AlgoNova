import { useState, useRef, useCallback } from 'react';
import {
  FileText, AlertCircle, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, Send, Shield, Upload,
  Zap, Activity, Clock, DollarSign, FlaskConical,
  Stethoscope, Pill, ClipboardList, TriangleAlert,
} from 'lucide-react';

const BACKEND = "http://localhost:3001";
const AI_ENGINE = "http://localhost:8001";

// Map patient name mentions in note → patientId + insurerId + procedureId
const PATIENT_MAP: Record<string, { patientId: string; insurerId: string }> = {
  "rajesh kumar": { patientId: "PAT_001", insurerId: "INS_A" },
  "sunita rao":   { patientId: "PAT_002", insurerId: "INS_B" },
};

const PROCEDURE_MAP: Record<string, string> = {
  "lumbar discectomy": "CPT_63030",
  "discectomy":        "CPT_63030",
  "knee replacement":  "CPT_27447",
  "cholecystectomy":   "CPT_47562",
};

function detectParams(note: string): { patientId: string; insurerId: string; procedureId: string } | null {
  const lower = note.toLowerCase();
  let patientId = "", insurerId = "";
  for (const [name, ids] of Object.entries(PATIENT_MAP)) {
    if (lower.includes(name)) { patientId = ids.patientId; insurerId = ids.insurerId; break; }
  }
  let procedureId = "";
  for (const [keyword, cpt] of Object.entries(PROCEDURE_MAP)) {
    if (lower.includes(keyword)) { procedureId = cpt; break; }
  }
  if (!patientId || !procedureId) return null;
  return { patientId, insurerId, procedureId };
}

const SAMPLE_NOTE = `Patient Rajesh Kumar, 45-year-old male, presents with severe lower back pain radiating to the left leg for over 14 months. MRI confirms L4-L5 disc herniation with significant nerve root compression. Conservative treatments including 6 weeks of physiotherapy and two epidural steroid injections have failed to provide lasting relief. I strongly recommend proceeding with Lumbar Discectomy (L4-L5). The procedure is medically necessary to prevent permanent neurological damage.`;

const STEPS = [
  { id: 0, name: 'Upload Document', icon: Upload },
  { id: 1, name: 'Extraction & Validation', icon: FileText },
  { id: 2, name: 'Evidence Collection', icon: Shield },
  { id: 3, name: 'Review & Submit', icon: Send },
];

export function NewClaim() {
  const [currentStep, setCurrentStep] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- PDF text extraction via AI engine ---
  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setError(null);
    if (file.type === "application/pdf") {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${AI_ENGINE}/extract_pdf`, { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setNoteText(data.text || "");
        }
      } catch {
        // fallback: let user paste manually
      }
    } else {
      const text = await file.text();
      setNoteText(text);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // --- Main analyze: calls backend /api/analyze ---
  const handleAnalyze = async () => {
    if (!noteText.trim()) { setError("Please provide a surgeon's note."); return; }
    const params = detectParams(noteText);
    if (!params) {
      setError("Could not auto-detect patient or procedure from the note. Make sure it mentions the patient name (Rajesh Kumar / Sunita Rao) and procedure.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      setLoadingMsg("🔍 Parsing surgeon's note...");
      await new Promise(r => setTimeout(r, 600));
      setLoadingMsg("📋 Fetching insurance policy rules...");
      await new Promise(r => setTimeout(r, 500));
      setLoadingMsg("🏥 Searching patient EHR...");
      await new Promise(r => setTimeout(r, 500));
      setLoadingMsg("⚖️ Running gap analysis & risk scoring...");

      const res = await fetch(`${BACKEND}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, surgeonNoteText: noteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backend error");
      setResult(data);
      setCurrentStep(1);
    } catch (e: any) {
      setError(e.message || "Backend not reachable. Make sure node server.js is running on port 3001.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const canNext = currentStep === 0 ? false : !!result;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Pre-Authorization</h1>
          <p className="text-slate-500 text-sm mt-0.5">AI-powered • Auto-detects patient & procedure • Under 10 minutes</p>
        </div>
        {result && (
          <RiskBadge level={result.risk?.level} score={result.risk?.score} />
        )}
      </div>

      {/* Step bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center max-w-4xl mx-auto">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isDone = currentStep > idx;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone ? 'bg-emerald-500 border-emerald-500' : isActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                  }`}>
                    {isDone
                      ? <CheckCircle className="w-5 h-5 text-white" />
                      : <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
                  </div>
                  <span className={`mt-1.5 text-xs font-semibold ${isActive || isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.name}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          {currentStep === 0 && (
            <Step1Upload
              noteText={noteText} setNoteText={setNoteText}
              fileName={fileName} fileRef={fileRef}
              handleFile={handleFile} handleDrop={handleDrop}
              handleAnalyze={handleAnalyze}
              loading={loading} loadingMsg={loadingMsg} error={error}
            />
          )}
          {currentStep === 1 && <Step2Extraction result={result} />}
          {currentStep === 2 && <Step3Evidence result={result} />}
          {currentStep === 3 && <Step4Review result={result} />}
        </div>
      </div>

      {/* Footer nav */}
      <div className="bg-white border-t border-slate-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-slate-400">Step {currentStep + 1} of {STEPS.length}</span>
          <button
            onClick={() => {
              if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
              else alert("✅ Pre-authorization package submitted to billing team!");
            }}
            disabled={currentStep === 0 || !canNext}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-sm transition-colors"
          >
            {currentStep === STEPS.length - 1 ? 'Submit to Billing' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Upload ────────────────────────────────────────────────────────────

function Step1Upload({ noteText, setNoteText, fileName, fileRef, handleFile, handleDrop, handleAnalyze, loading, loadingMsg, error }: any) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-6">
      {/* Auto-detect info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <Zap className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-blue-900 text-sm">Fully Automated — One Upload Only</p>
          <p className="text-blue-700 text-sm mt-0.5">
            The agent will auto-detect the patient, procedure, and insurer from the note, then fetch EHR data, run gap analysis, and score rejection risk — automatically.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={(e) => { handleDrop(e); setDragOver(false); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileRef} type="file" accept=".pdf,.txt" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-blue-500' : 'text-slate-400'}`} />
        {fileName ? (
          <div>
            <p className="font-semibold text-slate-900">{fileName}</p>
            <p className="text-sm text-emerald-600 mt-1 flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" /> File loaded — text extracted below
            </p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-slate-700">Drop PDF or TXT here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse · Surgeon's recommendation note</p>
          </div>
        )}
      </div>

      {/* Text area */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Surgeon's Recommendation Note</h2>
          <button
            onClick={() => setNoteText(SAMPLE_NOTE)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >Use sample note</button>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={7}
          placeholder="Or paste the surgeon's recommendation note here..."
          className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {noteText && (
          <NotePreview note={noteText} />
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!noteText.trim() || loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
      >
        {loading ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            <span>{loadingMsg || "Analyzing..."}</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Run AI Agent — Auto-Analyze Everything
          </>
        )}
      </button>
    </div>
  );
}

// Shows auto-detected params from the note
function NotePreview({ note }: { note: string }) {
  const params = detectParams(note);
  if (!params) return (
    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
      <TriangleAlert className="w-3.5 h-3.5" />
      Patient/procedure not detected yet — make sure the note mentions the name and procedure
    </p>
  );
  const patientName = note.toLowerCase().includes("rajesh") ? "Rajesh Kumar (PAT_001)" : "Sunita Rao (PAT_002)";
  const procName = Object.entries(PROCEDURE_MAP).find(([k]) => note.toLowerCase().includes(k))?.[0] || "";
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Tag color="blue" label="Patient" value={patientName} />
      <Tag color="purple" label="Insurer" value={params.insurerId} />
      <Tag color="emerald" label="Procedure" value={`${procName} (${params.procedureId})`} />
    </div>
  );
}

function Tag({ color, label, value }: { color: string; label: string; value: string }) {
  const styles: any = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
  return (
    <span className={`text-xs border rounded-full px-3 py-1 font-medium ${styles[color]}`}>
      ✓ {label}: {value}
    </span>
  );
}

// ─── Step 2: Extraction ────────────────────────────────────────────────────────

function Step2Extraction({ result }: any) {
  if (!result) return null;
  const { parsedNote, ehrEvidence, request } = result;

  // Insurance policy data comes from ehrEvidence context via backend
  const missingDocs: string[] = ehrEvidence?.missing_documents || [];
  const allRequiredDocs = [
    "MRI Lumbar Spine", "Surgeon Recommendation Letter",
    "Physiotherapy Records", "Certificate of Medical Necessity"
  ];

  return (
    <div className="space-y-6">
      {/* Extracted fields */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-semibold text-slate-900">AI-Extracted Clinical Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Procedure", value: parsedNote?.procedure, icon: ClipboardList },
            { label: "CPT Code", value: parsedNote?.cpt_code, icon: FileText },
            { label: "ICD-10 Code", value: parsedNote?.icd10_code, icon: Activity },
            { label: "Urgency", value: parsedNote?.urgency, icon: Clock },
            { label: "Patient ID", value: request?.patientId, icon: FileText },
            { label: "Insurer", value: request?.insurerId, icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
              </div>
              <p className="font-mono font-bold text-slate-900 text-sm">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Policy requirements */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Insurance Policy Requirements</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Max Approved</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">₹1,80,000</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Pre-auth Timeline</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">7 days</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Required Documents</h3>
        <div className="space-y-2">
          {allRequiredDocs.map((doc, idx) => {
            const isMissing = missingDocs.includes(doc);
            return (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                isMissing ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-3">
                  {isMissing
                    ? <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    : <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                  <span className={`font-medium text-sm ${isMissing ? 'text-red-900' : 'text-emerald-900'}`}>{doc}</span>
                </div>
                {isMissing && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">ACTION REQUIRED</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Evidence ──────────────────────────────────────────────────────────

function Step3Evidence({ result }: any) {
  if (!result) return null;
  const ehr = result.ehrEvidence;

  const stats = [
    { value: ehr?.matched_diagnoses?.length || 0, label: "Diagnoses", icon: Activity, color: "blue" },
    { value: ehr?.relevant_labs?.length || 0, label: "Lab Reports", icon: FlaskConical, color: "purple" },
    { value: ehr?.prior_treatments?.length || 0, label: "Treatments", icon: Stethoscope, color: "emerald" },
    { value: ehr?.medications?.length || 0, label: "Medications", icon: Pill, color: "orange" },
  ];

  const colorMap: any = {
    blue: "bg-blue-500", purple: "bg-purple-500", emerald: "bg-emerald-500", orange: "bg-orange-500"
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ value, label, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <div className={`w-10 h-10 rounded-full ${colorMap[color]} bg-opacity-10 flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Diagnoses */}
      <EvidenceCard title="Matched Diagnoses" icon={Activity} color="blue">
        {ehr?.matched_diagnoses?.map((d: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 text-sm">{d.description}</p>
              <p className="text-xs text-slate-500 mt-0.5">ICD-10: <span className="font-mono font-bold text-blue-700">{d.icd10}</span></p>
            </div>
            <span className="text-xs text-slate-400">{d.date}</span>
          </div>
        ))}
      </EvidenceCard>

      {/* Prior Treatments */}
      <EvidenceCard title="Prior Conservative Treatments" icon={Stethoscope} color="emerald" badge="Medical Necessity Demonstrated">
        {ehr?.prior_treatments?.map((t: any, i: number) => (
          <div key={i} className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-sm">{t.type}</h4>
              <span className="text-xs text-slate-400">{t.date}</span>
            </div>
            <div className="flex gap-6 text-sm">
              {t.duration && <span className="text-slate-600">Duration: <strong>{t.duration}</strong></span>}
              <span className="text-slate-600">Outcome: <strong>{t.outcome}</strong></span>
            </div>
          </div>
        ))}
      </EvidenceCard>

      {/* Labs */}
      <EvidenceCard title="Relevant Lab Reports" icon={FlaskConical} color="purple">
        {ehr?.relevant_labs?.map((lab: any, i: number) => (
          <div key={i} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{lab.type}</p>
                <p className="text-xs text-slate-600 mt-0.5">{lab.findings}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-xs text-slate-400">{lab.date}</p>
                <p className="text-xs text-emerald-700 font-bold mt-0.5">✓ Included</p>
              </div>
            </div>
          </div>
        ))}
      </EvidenceCard>

      {/* Missing docs alert */}
      {(ehr?.missing_documents?.length > 0) && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 mb-2">Agent Alert — Missing Documents</p>
              <p className="text-sm text-amber-800 mb-3">The following must be obtained before submission:</p>
              <div className="space-y-1.5">
                {ehr.missing_documents.map((doc: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-800">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    Obtain and upload: <strong>{doc}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceCard({ title, icon: Icon, color, badge, children }: any) {
  const colorMap: any = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {badge && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{badge}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─── Step 4: Review & Submit ───────────────────────────────────────────────────

function Step4Review({ result }: any) {
  if (!result) return null;
  const { parsedNote, ehrEvidence, gapAnalysis, risk, request } = result;

  // Normalize risk — backend returns level as "Medium" or "LOW" etc
  const rawLevel = (risk?.level || "").toUpperCase();
  const riskLevel = rawLevel.includes("LOW") ? "LOW" : rawLevel.includes("HIGH") ? "HIGH" : "MEDIUM";
  const riskScore = risk?.score ?? 54;
  const topDrivers: string[] = risk?.topDrivers || [];
  const missingDocs: string[] = gapAnalysis?.missingEvidence || ehrEvidence?.missing_documents || [];

  const riskStyle = {
    LOW:    { bar: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
    MEDIUM: { bar: "bg-amber-400",   bg: "bg-amber-50",   border: "border-amber-400",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-800" },
    HIGH:   { bar: "bg-red-500",     bg: "bg-red-50",     border: "border-red-400",     text: "text-red-700",     badge: "bg-red-100 text-red-800" },
  }[riskLevel];

  return (
    <div className="space-y-6">
      {/* Risk score */}
      <div className={`bg-white rounded-xl border-2 ${riskStyle.border} p-6`}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Rejection Risk Assessment</h2>
            <p className="text-slate-500 text-sm mt-1">Based on documentation completeness + historical patterns</p>
          </div>
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full ${riskStyle.bg} border-4 ${riskStyle.border} flex items-center justify-center`}>
              <span className={`text-2xl font-black ${riskStyle.text}`}>{riskScore}</span>
            </div>
            <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${riskStyle.badge}`}>
              {riskLevel} RISK
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>0 — High risk</span><span>100 — Low risk</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${riskStyle.bar}`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        {topDrivers.length > 0 && (
          <>
            <h3 className="font-semibold text-slate-800 text-sm mb-2">Risk Drivers</h3>
            <div className="space-y-2">
              {topDrivers.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{d}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pre-auth package */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Pre-Authorization Package</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Patient", value: ehrEvidence?.patient_name },
            { label: "Procedure", value: parsedNote?.procedure },
            { label: "CPT Code", value: parsedNote?.cpt_code },
            { label: "ICD-10", value: parsedNote?.icd10_code },
            { label: "Insurer ID", value: request?.insurerId },
            { label: "Policy Number", value: ehrEvidence?.policy_number },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">{label}</p>
              <p className="font-semibold text-slate-900 text-sm">{value || "—"}</p>
            </div>
          ))}
        </div>

        {missingDocs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm mb-2">Action Required Before Submission</p>
                {missingDocs.map((doc, i) => (
                  <p key={i} className="text-sm text-amber-800">• Obtain and upload: <strong>{doc}</strong></p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => alert("✅ Pre-authorization package submitted to billing team!")}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-xl font-bold text-base hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send className="w-5 h-5" />
        Submit Pre-Authorization to Billing Team
      </button>
    </div>
  );
}

// ─── Risk badge for header ─────────────────────────────────────────────────────

function RiskBadge({ level, score }: { level?: string; score?: number }) {
  if (!level) return null;
  const raw = (level || "").toUpperCase();
  const l = raw.includes("LOW") ? "LOW" : raw.includes("HIGH") ? "HIGH" : "MEDIUM";
  const styles = {
    LOW:    "bg-emerald-100 text-emerald-800 border-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH:   "bg-red-100 text-red-800 border-red-300",
  }[l];
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${styles}`}>
      <Activity className="w-4 h-4" />
      Risk Score: {score} — {l}
    </div>
  );
}