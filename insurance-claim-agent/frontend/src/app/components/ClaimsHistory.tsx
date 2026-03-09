import { useState } from 'react';
import { Search, Filter, Download, Eye, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export function ClaimsHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const claims = [
    {
      id: 'CLM-2024-0847',
      patient: 'Sarah Johnson',
      patientId: 'P001',
      procedure: 'Knee Arthroscopy',
      cpt: '29881',
      insurer: 'Blue Cross',
      status: 'approved',
      risk: 'low',
      submittedAt: '2024-03-09 10:30 AM',
      approvedAt: '2024-03-09 02:15 PM',
      amount: '$8,500',
      processingTime: '3h 45m',
    },
    {
      id: 'CLM-2024-0846',
      patient: 'Michael Chen',
      patientId: 'P002',
      procedure: 'Lumbar Fusion',
      cpt: '22630',
      insurer: 'Aetna',
      status: 'pending',
      risk: 'medium',
      submittedAt: '2024-03-09 07:20 AM',
      approvedAt: null,
      amount: '$24,000',
      processingTime: '5h 30m',
    },
    {
      id: 'CLM-2024-0845',
      patient: 'Emma Davis',
      patientId: 'P003',
      procedure: 'Rotator Cuff Repair',
      cpt: '29827',
      insurer: 'UnitedHealth',
      status: 'needs-review',
      risk: 'high',
      submittedAt: '2024-03-08 03:45 PM',
      approvedAt: null,
      amount: '$12,500',
      processingTime: '22h 15m',
      issues: ['Missing ultrasound report', 'Policy verification needed'],
    },
    {
      id: 'CLM-2024-0844',
      patient: 'James Wilson',
      patientId: 'P004',
      procedure: 'Hip Replacement',
      cpt: '27130',
      insurer: 'Cigna',
      status: 'approved',
      risk: 'low',
      submittedAt: '2024-03-08 11:00 AM',
      approvedAt: '2024-03-08 04:30 PM',
      amount: '$18,000',
      processingTime: '5h 30m',
    },
    {
      id: 'CLM-2024-0843',
      patient: 'Lisa Anderson',
      patientId: 'P005',
      procedure: 'Spinal Decompression',
      cpt: '63047',
      insurer: 'Blue Cross',
      status: 'rejected',
      risk: 'high',
      submittedAt: '2024-03-07 02:15 PM',
      approvedAt: null,
      amount: '$15,500',
      processingTime: '1d 4h',
      rejectionReason: 'Insufficient medical necessity documentation',
    },
    {
      id: 'CLM-2024-0842',
      patient: 'Robert Taylor',
      patientId: 'P006',
      procedure: 'Carpal Tunnel Release',
      cpt: '64721',
      insurer: 'Aetna',
      status: 'approved',
      risk: 'low',
      submittedAt: '2024-03-07 09:30 AM',
      approvedAt: '2024-03-07 01:15 PM',
      amount: '$3,200',
      processingTime: '3h 45m',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'needs-review':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      case 'needs-review':
        return 'bg-amber-100 text-amber-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'high':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.procedure.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || claim.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Claims History</h1>
        <p className="text-slate-600">Track and manage all pre-authorization submissions</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by claim ID, patient, or procedure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="needs-review">Needs Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium">
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Claim ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Patient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Procedure</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Insurer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Risk</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm font-medium text-slate-900">{claim.id}</p>
                    <p className="text-xs text-slate-500">{claim.submittedAt}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{claim.patient}</p>
                    <p className="text-sm text-slate-600">{claim.patientId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{claim.procedure}</p>
                    <p className="text-sm text-slate-600 font-mono">CPT: {claim.cpt}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{claim.insurer}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{claim.amount}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getRiskColor(
                        claim.risk
                      )}`}
                    >
                      {claim.risk.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(claim.status)}
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          claim.status
                        )}`}
                      >
                        {claim.status === 'needs-review'
                          ? 'NEEDS REVIEW'
                          : claim.status.toUpperCase()}
                      </span>
                    </div>
                    {claim.issues && (
                      <p className="text-xs text-amber-700 mt-1">{claim.issues.length} issue(s)</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{claim.processingTime}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <Eye className="w-5 h-5 text-slate-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing <span className="font-medium">{filteredClaims.length}</span> of{' '}
          <span className="font-medium">{claims.length}</span> claims
        </p>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium disabled:opacity-50">
            Previous
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            1
          </button>
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">
            2
          </button>
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
