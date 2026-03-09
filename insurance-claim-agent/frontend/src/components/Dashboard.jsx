import React from 'react';
import { Link } from 'react-router-dom';

// Temporary mock data to build the UI fast
const mockClaims = [
  { id: 'REQ-001', patientName: 'John Doe', procedure: 'Total Knee Arthroplasty', status: 'Ready to Submit', risk: 'Low', date: '2026-03-09' },
  { id: 'REQ-002', patientName: 'Jane Smith', procedure: 'Lumbar Fusion', status: 'Missing Documents', risk: 'High', date: '2026-03-08' },
  { id: 'REQ-003', patientName: 'Robert Johnson', procedure: 'Cataract Surgery', status: 'Pending Review', risk: 'Medium', date: '2026-03-08' },
];

const Dashboard = () => {
  // Helper function to color-code the risk badges
  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'Low': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Low Risk</span>;
      case 'Medium': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Medium Risk</span>;
      case 'High': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">High Risk</span>;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pre-Authorization Command Center</h1>
          <p className="text-slate-500 mt-1">AI-Assisted Claim Processing Pipeline</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
          + New Prior Auth
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Claim ID</th>
              <th className="p-4 font-medium">Patient</th>
              <th className="p-4 font-medium">Procedure</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">AI Risk Score</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockClaims.map((claim) => (
              <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{claim.id}</td>
                <td className="p-4 text-slate-600">{claim.patientName}</td>
                <td className="p-4 text-slate-600">{claim.procedure}</td>
                <td className="p-4 text-slate-500 text-sm">{claim.date}</td>
                <td className="p-4">{getRiskBadge(claim.risk)}</td>
                <td className="p-4">
                  <span className={`text-sm font-medium ${claim.status === 'Missing Documents' ? 'text-orange-600' : 'text-slate-600'}`}>
                    {claim.status}
                  </span>
                </td>
                <td className="p-4">
                  {/* This Link connects the Dashboard to your ClaimDetails page */}
                  <Link 
                    to={`/claim/${claim.id}`} 
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-50 px-3 py-1.5 rounded-md transition-colors inline-block"
                  >
                    Review Form &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;