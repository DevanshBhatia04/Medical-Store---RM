import React from 'react'

const colorMap = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: 'bg-green-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'bg-blue-500/20' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'bg-red-500/20' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', icon: 'bg-orange-500/20' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', icon: 'bg-gray-500/20' },
}

export default function MetricCard({ title, value, icon: Icon, color = 'gray', trend }) {
  const c = colorMap[color] || colorMap.gray

  return (
    <div className={`glass rounded-2xl p-5 ${c.bg} ${c.border} border hover:scale-[1.02] transition-all duration-300`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${c.icon}`}>
            <Icon size={20} className={c.text} />
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${c.text}`}>
        {value ?? '-'}
      </div>
      {trend !== undefined && (
        <div className={`mt-1 flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </div>
  )
}
