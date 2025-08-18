/* eslint-disable */
// This file contains chart components that require inline styles for dynamic sizing
// The ESLint rules are disabled for this file specifically

import React from 'react';

// Line chart component for focus time
export const FocusTimeBarChart: React.FC<{
  data: Array<{
    date: string;
    focusMinutes: number;
    sessions: number;
    completedTasks: number;
    mood: string;
  }>;
  formatMinutes: (minutes: number) => string;
}> = ({ data, formatMinutes }) => {
  const maxFocusMinutes = Math.max(...data.map(day => day.focusMinutes), 60); // Minimum 60 for scale
  const chartHeight = 192; // 48 * 4 = 192px
  
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">No focus data yet</div>
          <div className="text-sm">Start a focus session to see your progress here</div>
        </div>
      </div>
    );
  }
  
  // Create SVG path for the line
  const createPath = () => {
    const width = 100; // percentage
    const points = data.map((day, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = 100 - (day.focusMinutes / maxFocusMinutes) * 100;
      return `${x},${y}`;
    }).join(' ');
    return `M ${points}`;
  };
  
  return (
    <div className="h-64 relative">
      {/* Chart area */}
      <div className="h-48 relative mb-4">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute w-full border-t border-gray-200 dark:border-gray-700"
              style={{ top: `${percent}%` }}
            />
          ))}
        </div>
        
        {/* Line chart */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Area under the line */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {data.length > 1 && (
            <>
              {/* Area fill */}
              <path
                d={`${createPath()} L 100,100 L 0,100 Z`}
                fill="url(#areaGradient)"
              />
              
              {/* Line */}
              <path
                d={createPath()}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
          
          {/* Data points */}
          {data.map((day, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (day.focusMinutes / maxFocusMinutes) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1"
                fill="rgb(99, 102, 241)"
                vectorEffect="non-scaling-stroke"
                className="hover:r-2 transition-all cursor-pointer"
              >
                <title>{`${day.date}: ${formatMinutes(day.focusMinutes)}`}</title>
              </circle>
            );
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between -ml-12">
          <span className="text-xs text-gray-400">{formatMinutes(maxFocusMinutes)}</span>
          <span className="text-xs text-gray-400">{formatMinutes(Math.floor(maxFocusMinutes * 0.75))}</span>
          <span className="text-xs text-gray-400">{formatMinutes(Math.floor(maxFocusMinutes * 0.5))}</span>
          <span className="text-xs text-gray-400">{formatMinutes(Math.floor(maxFocusMinutes * 0.25))}</span>
          <span className="text-xs text-gray-400">0m</span>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between px-2">
        {data.map((day, index) => (
          <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
            {day.date}
          </div>
        ))}
      </div>
    </div>
  );
};

// Task distribution chart component
export const TaskDistributionChart: React.FC<{
  data: Array<{
    name: string;
    totalMinutes: number;
    percentage: number;
  }>;
}> = ({ data }) => {
  // Filter out categories with 0 percentage and sort by percentage
  const filteredData = data
    .filter(category => category.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
  
  if (filteredData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-lg mb-2">No task data yet</div>
          <div className="text-sm">Complete tasks to see distribution</div>
        </div>
      </div>
    );
  }
  
  const colors = [
    'bg-indigo-600',
    'bg-emerald-600', 
    'bg-purple-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-cyan-600',
    'bg-slate-600'
  ];
  
  return (
    <div className="space-y-4">
      {filteredData.map((category, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{category.name}</span>
            <span className="text-gray-500 dark:text-gray-400">{category.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                colors[index % colors.length]
              }`}
              style={{ width: `${Math.max(category.percentage, 2)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {category.totalMinutes > 0 ? `${Math.floor(category.totalMinutes / 60)}h ${category.totalMinutes % 60}m` : 'No time logged'}
          </div>
        </div>
      ))}
    </div>
  );
};
