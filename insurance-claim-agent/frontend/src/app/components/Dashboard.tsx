import { Link } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
} from 'lucide-react';

export function Dashboard() {
  const stats = [
    {
      label: 'Claims This Month',
      value: '247',
      change: '+12%',
      trend: 'up',
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Approval Rate',
      value: '87%',
      change: '+5%',
      trend: 'up',
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Avg Processing Time',
      value: '8.2m',
      change: '-23%',
      trend: 'up',
      icon: Clock,
      color: 'purple',
    },
    {
      label: 'Rejection Rate',
      value: '13%',
      change: '-5%',
      trend: 'up',
      icon: XCircle,
      color: 'red',
    },
  ];

  const recentClaims = [
    {
      id: 'CLM-2024-0847',
      patient: 'Sarah Johnson',
      procedure: 'Knee Arthroscopy',
      insurer: 'Blue Cross',
      status: 'approved',
      risk: 'low',
      submittedAt: '2 hours ago',
    },
    {
      id: 'CLM-2024-0846',
      patient: 'Michael Chen',
      procedure: 'Lumbar Fusion',
      insurer: 'Aetna',
      status: 'pending',
      risk: 'medium',
      submittedAt: '5 hours ago',
    },
    {
      id: 'CLM-2024-0845',
      patient: 'Emma Davis',
      procedure: 'Rotator Cuff Repair',
      insurer: 'UnitedHealth',
      status: 'needs-review',
      risk: 'high',
      submittedAt: '1 day ago',
    },
    {
      id: 'CLM-2024-0844',
      patient: 'James Wilson',
      procedure: 'Hip Replacement',
      insurer: 'Cigna',
      status: 'approved',
      risk: 'low',
      submittedAt: '1 day ago',
    },
  ];

  const alerts = [
    {
      type: 'warning',
      message: 'CLM-2024-0845 missing ultrasound report',
      action: 'Review Now',
    },
    {
      type: 'info',
      message: '3 claims ready for submission',
      action: 'Submit',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's your claim overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendIcon className="w-4 h-4" />
                  <span className="font-medium">{stat.change}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8 space-y-3">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 rounded-lg ${
                alert.type === 'warning'
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`w-5 h-5 ${
                    alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                  }`}
                >
                  {alert.message}
                </span>
              </div>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  alert.type === 'warning'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {alert.action}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent Claims */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Claims</h2>
            <p className="text-sm text-slate-600 mt-1">Latest pre-authorization submissions</p>
          </div>
          <Link
            to="/claims"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-200">
          {recentClaims.map((claim) => (
            <div
              key={claim.id}
              className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {claim.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        claim.risk === 'low'
                          ? 'bg-green-100 text-green-700'
                          : claim.risk === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {claim.risk.toUpperCase()} RISK
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        claim.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : claim.status === 'pending'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {claim.status === 'needs-review'
                        ? 'NEEDS REVIEW'
                        : claim.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{claim.patient}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>{claim.procedure}</span>
                    <span>•</span>
                    <span>{claim.insurer}</span>
                    <span>•</span>
                    <span>{claim.submittedAt}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action */}
      <Link
        to="/new-claim"
        className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2 font-medium"
      >
        <FileText className="w-5 h-5" />
        Create New Claim
      </Link>
    </div>
  );
}
