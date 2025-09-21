/* eslint-disable */
// This file contains chart components that require inline styles for dynamic sizing
// The ESLint rules are disabled for this file specifically

import React from 'react';

// Line chart component for focus time comparison
export const FocusTimeBarChart: React.FC<{
  currentWeekData: Array<{
    date: string;
    focusMinutes: number;
    sessions: number;
    completedTasks: number;
    mood: string;
  }>;
  lastWeekData: Array<{
    date: string;
    focusMinutes: number;
    sessions: number;
    completedTasks: number;
    mood: string;
  }>;
  formatMinutes: (minutes: number) => string;
}> = ({ currentWeekData, lastWeekData, formatMinutes }) => {
  const allData = [...currentWeekData, ...lastWeekData];
  const maxFocusMinutes = Math.max(...allData.map(day => day.focusMinutes), 60);
  
  if (currentWeekData.length === 0 && lastWeekData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">No focus data yet</div>
          <div className="text-sm">Start a focus session to see your progress here</div>
        </div>
      </div>
    );
  }
  
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create smooth SVG path for a week's data using basis interpolation
  const createPath = (weekData: typeof currentWeekData) => {
    if (weekData.length === 0) return '';
    
    const points = weekData.map((day, index) => {
      const x = (index / 6) * 100; // 7 days = 0 to 100%
      const y = 100 - (day.focusMinutes / maxFocusMinutes) * 100;
      return { x, y };
    });
    
    if (points.length < 2) {
      return `M ${points[0].x},${points[0].y}`;
    }
    
    // Create smooth curve using quadratic bezier curves
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      if (i === 1) {
        // First curve - use current point as control
        const cpx = prev.x + (curr.x - prev.x) * 0.5;
        const cpy = prev.y + (curr.y - prev.y) * 0.5;
        path += ` Q ${cpx},${cpy} ${curr.x},${curr.y}`;
      } else {
        // Subsequent curves - create smooth transitions
        const next = points[i + 1] || curr;
        const cpx1 = prev.x + (curr.x - prev.x) * 0.6;
        const cpy1 = prev.y;
        const cpx2 = curr.x - (next.x - prev.x) * 0.2;
        const cpy2 = curr.y;
        path += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${curr.x},${curr.y}`;
      }
    }
    
    return path;
  };
  
  return (
    <div className="h-64 relative">
      {/* Legend */}
      <div className="flex justify-center space-x-6 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-indigo-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Current Week</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-purple-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Last Week</span>
        </div>
      </div>
      
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
          <defs>
            <linearGradient id="currentWeekGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lastWeekGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Last week line */}
          {lastWeekData.length > 0 && (
            <>
              <path
                d={createPath(lastWeekData)}
                fill="none"
                stroke="rgb(147, 51, 234)"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {lastWeekData.map((day, index) => {
                const x = (index / 6) * 100;
                const y = 100 - (day.focusMinutes / maxFocusMinutes) * 100;
                return (
                  <circle
                    key={`last-${index}`}
                    cx={x}
                    cy={y}
                    r="1"
                    fill="rgb(147, 51, 234)"
                    vectorEffect="non-scaling-stroke"
                  >
                    <title>{`Last ${dayLabels[index]}: ${formatMinutes(day.focusMinutes)}`}</title>
                  </circle>
                );
              })}
            </>
          )}
          
          {/* Current week line */}
          {currentWeekData.length > 0 && (
            <>
              <path
                d={createPath(currentWeekData)}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="0.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {currentWeekData.map((day, index) => {
                const x = (index / 6) * 100;
                const y = 100 - (day.focusMinutes / maxFocusMinutes) * 100;
                return (
                  <circle
                    key={`current-${index}`}
                    cx={x}
                    cy={y}
                    r="1.2"
                    fill="rgb(99, 102, 241)"
                    vectorEffect="non-scaling-stroke"
                  >
                    <title>{`${dayLabels[index]}: ${formatMinutes(day.focusMinutes)}`}</title>
                  </circle>
                );
              })}
            </>
          )}
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
        {dayLabels.map((day, index) => (
          <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
            {day}
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
