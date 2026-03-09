import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Clock, Target, AlertTriangle } from 'lucide-react';

export function Analytics() {
  const monthlyData = [
    { month: 'Sep', approved: 65, rejected: 12, pending: 8 },
    { month: 'Oct', approved: 72, rejected: 10, pending: 6 },
    { month: 'Nov', approved: 78, rejected: 9, pending: 5 },
    { month: 'Dec', approved: 85, rejected: 7, pending: 4 },
    { month: 'Jan', approved: 92, rejected: 6, pending: 3 },
    { month: 'Feb', approved: 98, rejected: 5, pending: 2 },
  ];

  const processingTimeData = [
    { month: 'Sep', time: 18.5 },
    { month: 'Oct', time: 16.2 },
    { month: 'Nov', time: 14.8 },
    { month: 'Dec', time: 12.5 },
    { month: 'Jan', time: 10.3 },
    { month: 'Feb', time: 8.2 },
  ];

  const insurerData = [
    { name: 'Blue Cross', value: 35, color: '#3b82f6' },
    { name: 'Aetna', value: 28, color: '#8b5cf6' },
    { name: 'UnitedHealth', value: 22, color: '#10b981' },
    { name: 'Cigna', value: 15, color: '#f59e0b' },
  ];

  const rejectionReasons = [
    { reason: 'Missing Documentation', count: 42, percentage: 35 },
    { reason: 'Policy Mismatch', count: 28, percentage: 23 },
    { reason: 'Coding Errors', count: 24, percentage: 20 },
    { reason: 'Insufficient Medical Necessity', count: 18, percentage: 15 },
    { reason: 'Timeline Issues', count: 8, percentage: 7 },
  ];

  const topProcedures = [
    { procedure: 'Total Knee Arthroplasty', count: 45, avgAmount: '$15,200', approvalRate: 92 },
    { procedure: 'Lumbar Fusion', count: 38, avgAmount: '$24,800', approvalRate: 85 },
    { procedure: 'Rotator Cuff Repair', count: 32, avgAmount: '$12,500', approvalRate: 88 },
    { procedure: 'Hip Replacement', count: 28, avgAmount: '$18,000', approvalRate: 94 },
    { procedure: 'Carpal Tunnel Release', count: 22, avgAmount: '$3,200', approvalRate: 96 },
  ];

  const kpis = [
    {
      label: 'Revenue Processed',
      value: '$2.4M',
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Avg Processing Time',
      value: '8.2 min',
      change: '-56%',
      trend: 'up',
      icon: Clock,
      color: 'blue',
    },
    {
      label: 'Approval Rate',
      value: '87%',
      change: '+12%',
      trend: 'up',
      icon: Target,
      color: 'purple',
    },
    {
      label: 'Active Issues',
      value: '12',
      change: '-40%',
      trend: 'up',
      icon: AlertTriangle,
      color: 'amber',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics & Insights</h1>
        <p className="text-slate-600">Performance metrics and trends for pre-authorization claims</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${kpi.color}-50 flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${kpi.color}-600`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendIcon className="w-4 h-4" />
                  <span className="font-medium">{kpi.change}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{kpi.value}</h3>
              <p className="text-sm text-slate-600">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Monthly Claims */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Claim Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="approved" fill="#10b981" name="Approved" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
              <Bar dataKey="pending" fill="#3b82f6" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Processing Time Trend */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Processing Time Trend (minutes)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processingTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="time"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Avg Time"
                dot={{ fill: '#3b82f6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Insurer Distribution */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Claims by Insurer</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={insurerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {insurerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Rejection Reasons */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Rejection Reasons</h2>
          <div className="space-y-4">
            {rejectionReasons.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900">{item.reason}</span>
                  <span className="text-sm font-semibold text-slate-600">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Procedures Table */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Procedures by Volume</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Procedure
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Volume
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Avg Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Approval Rate
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {topProcedures.map((proc, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{proc.procedure}</td>
                  <td className="px-6 py-4 text-slate-600">{proc.count} claims</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{proc.avgAmount}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        proc.approvalRate >= 90
                          ? 'bg-green-100 text-green-700'
                          : proc.approvalRate >= 80
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {proc.approvalRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          proc.approvalRate >= 90
                            ? 'bg-green-500'
                            : proc.approvalRate >= 80
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${proc.approvalRate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-3">AI-Powered Insights</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm text-blue-100 mb-1">Key Finding</p>
            <p className="font-medium">
              Processing time reduced 56% since implementing AI document extraction
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm text-blue-100 mb-1">Recommendation</p>
            <p className="font-medium">
              Focus on reducing "Missing Documentation" rejections - highest impact opportunity
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm text-blue-100 mb-1">Prediction</p>
            <p className="font-medium">
              Approval rate projected to reach 92% by end of Q2 with current trends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
