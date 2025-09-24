
import React from 'react';

interface HeatmapProps {
  data: { [date: string]: number };
}

const LearningCalendarHeatmap: React.FC<HeatmapProps> = ({ data }) => {
  const today = new Date();
  const daysToShow = 126; // Exactly 18 weeks
  
  const startDate = new Date();
  startDate.setDate(today.getDate() - (daysToShow - 1));
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Align to the beginning of the week (Sunday)

  const days = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-200';
    if (count <= 2) return 'bg-green-200';
    if (count <= 5) return 'bg-green-400';
    if (count <= 10) return 'bg-green-600';
    return 'bg-green-800';
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months: { label: string; colStart: number }[] = [];
  
  days.forEach((day, index) => {
      const month = day.getMonth();
      const col = Math.floor(index / 7) + 1;
      if (!months.some(m => m.label === monthLabels[month])) {
          months.push({ label: monthLabels[month], colStart: col });
      }
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h2 className="text-lg font-bold text-slate-700 mb-4">學習熱力圖</h2>
      <div className="overflow-x-auto pb-2">
        <div className="inline-block">
          {/* Month Labels */}
          <div className="grid grid-cols-[repeat(18,1.25rem)] grid-rows-1 gap-x-1 ml-[2rem] h-5">
            {months.map(month => (
              <div key={month.label} className="text-xs text-slate-500 -mt-1" style={{ gridColumnStart: month.colStart }}>
                {month.label}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Day Labels */}
            <div className="grid grid-rows-7 gap-y-1 text-xs text-slate-400 text-right w-8">
              <span className="h-4 flex items-center"></span>
              <span className="h-4 flex items-center">Mon</span>
              <span className="h-4 flex items-center"></span>
              <span className="h-4 flex items-center">Wed</span>
              <span className="h-4 flex items-center"></span>
              <span className="h-4 flex items-center">Fri</span>
              <span className="h-4 flex items-center"></span>
            </div>
            
            {/* Heatmap Grid */}
            <div className="grid grid-rows-7 grid-flow-col gap-1">
              {days.map(day => {
                const dateString = day.toISOString().split('T')[0];
                const count = data[dateString] || 0;
                const isFuture = day > today;

                return (
                  <div key={dateString} className="group relative">
                    <div className={`w-4 h-4 rounded-sm ${isFuture ? 'bg-white' : getColor(count)}`} />
                    {!isFuture && (
                      <div className="absolute z-10 -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap">
                        {count} review{count !== 1 ? 's' : ''} on {dateString}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 transform rotate-45"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end text-xs text-slate-500 mt-2 space-x-2">
          <span>少</span>
          <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
          <div className="w-3 h-3 rounded-sm bg-green-200"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400"></div>
          <div className="w-3 h-3 rounded-sm bg-green-600"></div>
          <div className="w-3 h-3 rounded-sm bg-green-800"></div>
          <span>多</span>
      </div>
    </div>
  );
};

export default LearningCalendarHeatmap;
