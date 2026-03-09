import React, { useState } from 'react';

export default function ClaimDetails() {
  const [activeHighlight, setActiveHighlight] = useState(null);

  const rawText = "Patient Rajesh Kumar, 45-year-old male, presents with severe lower back pain radiating to the left leg for over 14 months. MRI confirms L4-L5 disc herniation with significant nerve root compression. Conservative treatments including 6 weeks of physiotherapy and two epidural steroid injections have failed to provide lasting relief. The patient reports a pain score of 8/10 on the Visual Analog Scale. I strongly recommend proceeding with Lumbar Discectomy (L4-L5) to decompress the nerve root and restore function. The procedure is medically necessary to prevent permanent neurological damage.";

  const renderTextWithHighlights = () => {
    const parts = [
      { text: "Patient Rajesh Kumar, 45-year-old male, presents with severe lower back pain radiating to the left leg for over 14 months. ", key: null },
      { text: "MRI confirms L4-L5 disc herniation with significant nerve root compression.", key: "diagnosis" },
      { text: " ", key: null },
      { text: "Conservative treatments including 6 weeks of physiotherapy and two epidural steroid injections have failed to provide lasting relief.", key: "treatments" },
      { text: " The patient reports a pain score of 8/10 on the Visual Analog Scale. I strongly recommend proceeding with ", key: null },
      { text: "Lumbar Discectomy (L4-L5)", key: "procedure" },
      { text: " to decompress the nerve root and restore function. The procedure is ", key: null },
      { text: "medically necessary to prevent permanent neurological damage.", key: "necessity" }
    ];

    return (
      <p className="text-slate-300 leading-relaxed text-sm lg:text-base font-medium">
        {parts.map((part, i) => (
          <span 
            key={i} 
            className={`transition-all duration-300 ${part.key ? 'rounded px-1.5 py-0.5 ' : ''} ${
              activeHighlight === part.key 
                ? 'bg-indigo-500/30 text-indigo-200 ring-2 ring-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                : part.key 
                  ? 'bg-white/5 text-slate-200 cursor-pointer hover:bg-white/15' 
                  : ''
            }`}
            onMouseEnter={() => part.key && setActiveHighlight(part.key)}
            onMouseLeave={() => part.key && setActiveHighlight(null)}
          >
            {part.text}
          </span>
        ))}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center gap-1.5 ring-1 ring-indigo-500/30">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Assisted Processing
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">Draft Mode</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pre-Authorization Request</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Review the extracted details from the surgeon's notes before final submission.</p>
          </div>
          <div className="text-left md:text-right bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-full md:w-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Patient ID: <span className="font-semibold text-slate-900 dark:text-slate-200 ml-1">PAT_001</span></p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Date Generated: <span className="font-semibold text-slate-900 dark:text-slate-200 ml-1">Feb 10, 2024</span></p>
          </div>
        </header>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Extracted Patient Records
            </h2>
            
            {/* Patient Info Card */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all hover:shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 dark:border-slate-700/50">Demographics & Insurance</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Full Name</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">Rajesh Kumar</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Age & Gender</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-lg">45, Male</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Blood Group</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    B+
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Policy Number</p>
                  <p className="font-semibold text-indigo-700 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-500/10 inline-block px-2 py-1 rounded border border-indigo-100 dark:border-indigo-500/20">POL-2024-88321</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Insurer ID</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">INS_A</p>
                </div>
              </div>
            </div>

            {/* Diagnosis & Procedure Card */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 py-6 px-4 sm:px-6 transition-all hover:shadow-md">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 pb-3 border-b border-slate-100 dark:border-slate-700/50">Clinical Request Details</h3>
              <p className="text-xs text-slate-400 mb-6 italic">Hover over sections below to see exact source text in the AI Evidence Panel.</p>
              
              <div className="space-y-3">
                
                {/* Interactive Row: Diagnosis */}
                <div 
                  className={`group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl transition-all cursor-pointer border ${activeHighlight === 'diagnosis' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-inner' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                  onMouseEnter={() => setActiveHighlight("diagnosis")}
                  onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div className="md:w-1/3 mb-2 md:mb-0">
                    <p className={`text-sm font-bold flex items-center gap-2 ${activeHighlight === 'diagnosis' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      Primary Diagnosis
                      <svg className={`w-4 h-4 transition-transform ${activeHighlight === 'diagnosis' ? 'translate-x-1' : 'opacity-0 -translate-x-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </p>
                  </div>
                  <div className="md:w-2/3">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">Lumbar disc herniation</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ICD-10 Code: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">M51.1</span></p>
                  </div>
                </div>

                {/* Interactive Row: Procedure */}
                <div 
                  className={`group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl transition-all cursor-pointer border ${activeHighlight === 'procedure' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-inner' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                  onMouseEnter={() => setActiveHighlight("procedure")}
                  onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div className="md:w-1/3 mb-2 md:mb-0">
                    <p className={`text-sm font-bold flex items-center gap-2 ${activeHighlight === 'procedure' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      Requested Procedure
                      <svg className={`w-4 h-4 transition-transform ${activeHighlight === 'procedure' ? 'translate-x-1' : 'opacity-0 -translate-x-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </p>
                  </div>
                  <div className="md:w-2/3">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">Lumbar Discectomy (L4-L5)</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">CPT Code: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">CPT_63030</span></p>
                  </div>
                </div>

                {/* Interactive Row: Non-surgical treatments */}
                <div 
                  className={`group flex flex-col md:flex-row justify-between p-4 rounded-xl transition-all cursor-pointer border ${activeHighlight === 'treatments' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-inner' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                  onMouseEnter={() => setActiveHighlight("treatments")}
                  onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div className="md:w-1/3 mb-2 md:mb-0 pt-1">
                    <p className={`text-sm font-bold flex items-center gap-2 ${activeHighlight === 'treatments' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      Prior Treatments
                      <svg className={`w-4 h-4 transition-transform ${activeHighlight === 'treatments' ? 'translate-x-1' : 'opacity-0 -translate-x-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </p>
                  </div>
                  <div className="md:w-2/3">
                    <ul className="text-sm font-medium text-slate-700 dark:text-slate-300 space-y-3">
                      <li className="flex items-start gap-2.5 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                        <div className="flex-1">
                          <p className="text-slate-900 dark:text-slate-100">Physiotherapy <span className="text-slate-500 dark:text-slate-400 font-normal">(6 wks)</span></p>
                          <p className="text-red-600 dark:text-red-400 text-xs mt-0.5 font-bold uppercase tracking-wide">Failed - Partial relief only</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                        <div className="flex-1">
                          <p className="text-slate-900 dark:text-slate-100">Epidural steroid injection</p>
                          <p className="text-red-600 dark:text-red-400 text-xs mt-0.5 font-bold uppercase tracking-wide">Failed - Temporary relief only</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Interactive Row: Necessity */}
                <div 
                  className={`group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl transition-all cursor-pointer border ${activeHighlight === 'necessity' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-inner' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                  onMouseEnter={() => setActiveHighlight("necessity")}
                  onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div className="md:w-1/3 mb-2 md:mb-0">
                    <p className={`text-sm font-bold flex items-center gap-2 ${activeHighlight === 'necessity' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      Urgency
                      <svg className={`w-4 h-4 transition-transform ${activeHighlight === 'necessity' ? 'translate-x-1' : 'opacity-0 -translate-x-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </p>
                  </div>
                  <div className="md:w-2/3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                      Elective but time-sensitive
                    </span>
                  </div>
                </div>

              </div>
            </div>
            
          </div>

          {/* Right Column: AI Evidence Panel & Action */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8 h-fit">
            
            <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 relative">
              {/* Subtle background glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-indigo-500/20 blur-[100px] pointer-events-none"></div>

              {/* Panel Header */}
              <div className="bg-slate-900/80 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-white/10 z-10">
                <h3 className="text-white font-bold text-lg flex items-center gap-3">
                  <div className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
                  </div>
                  AI Evidence Panel
                </h3>
                <span className="text-xs text-indigo-200 font-semibold bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-full">Surgeon Notes</span>
              </div>
              
              {/* Document Body */}
              <div className="p-6 flex-1 relative bg-slate-900 z-10 min-h-[350px]">
                <div className="mb-4 flex gap-4 text-xs font-mono text-slate-500 border-b border-white/5 pb-4">
                  <div>
                    <span className="block text-slate-600 mb-0.5">DOCTOR</span>
                    <span className="text-slate-300">Dr. Anand Sharma</span>
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-0.5">SPECIALIZATION</span>
                    <span className="text-slate-300">Orthopedic Spine Surgeon</span>
                  </div>
                </div>

                {/* The actual text */}
                <div className="relative">
                  {renderTextWithHighlights()}
                </div>
                
                {/* Fallback instruction when not hovering */}
                <div className={`absolute bottom-6 left-0 right-0 text-center pointer-events-none transition-opacity duration-300 ${activeHighlight ? 'opacity-0' : 'opacity-100'}`}>
                  <span className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 text-sm font-medium px-4 py-2 rounded-full shadow-lg border border-white/5 ring-1 ring-white/5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Hover variables to trace evidence
                  </span>
                </div>
              </div>
              
              {/* Action Area */}
              <div className="bg-slate-950 p-6 mt-auto border-t border-white/5 z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-bold text-emerald-400">Rules Passed</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-400 block mb-0.5">AI CONFIDENCE</span>
                    <span className="text-sm font-bold text-white">99.8%</span>
                  </div>
                </div>

                <button className="w-full relative group overflow-hidden rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-4 shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:translate-y-0">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-[length:200%_auto] animate-gradient-x opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative flex items-center justify-center gap-2 text-lg drop-shadow-md">
                    Submit Final Claim
                    <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </button>
                <p className="text-center text-xs text-slate-500 mt-3 font-medium">This action will send the package to Insurer API.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s linear infinite;
        }
        ::-moz-selection {
          background: rgba(99, 102, 241, 0.3);
        }
        ::selection {
          background: rgba(99, 102, 241, 0.3);
        }
      `}} />
    </div>
  );
}
