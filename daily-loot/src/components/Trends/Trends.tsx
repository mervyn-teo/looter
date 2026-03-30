import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import { useStore } from '../../store/useStore';
import './Trends.css';

type TimeRange = 'week' | 'month' | 'all';

export function Trends() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const getDailyStats = useStore(s => s.getDailyStats);
  const getCategoryBreakdown = useStore(s => s.getCategoryBreakdown);
  const getRarityDistribution = useStore(s => s.getRarityDistribution);

  const allStats = getDailyStats();
  const categories = getCategoryBreakdown();
  const rarities = getRarityDistribution().filter(r => r.count > 0);

  // Filter stats by time range
  const now = new Date();
  const filteredStats = allStats.filter(stat => {
    if (timeRange === 'all') return true;
    const cutoff = timeRange === 'week' ? subDays(now, 7) : subMonths(now, 1);
    return new Date(stat.date) >= cutoff;
  });

  const chartData = filteredStats.map(stat => ({
    ...stat,
    label: format(new Date(stat.date + 'T00:00:00'), timeRange === 'week' ? 'EEE' : 'MMM d'),
  }));

  if (allStats.length === 0) {
    return (
      <div className="trends-empty">
        <p>No data yet! Start logging items to see your trends.</p>
      </div>
    );
  }

  return (
    <div className="trends">
      {/* Time range filter */}
      <div className="time-filter">
        {(['week', 'month', 'all'] as TimeRange[]).map(range => (
          <button
            key={range}
            className={`filter-btn ${timeRange === range ? 'active' : ''}`}
            onClick={() => setTimeRange(range)}
          >
            {range === 'all' ? 'All time' : range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Happiness over time */}
      <div className="chart-section">
        <h3 className="chart-title">Daily Happiness</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#999" />
              <YAxis tick={{ fontSize: 11 }} stroke="#999" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="totalHappiness"
                stroke="#534AB7"
                strokeWidth={2}
                dot={{ fill: '#534AB7', r: 4 }}
                activeDot={{ r: 6 }}
                name="Happiness"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="chart-section">
          <h3 className="chart-title">Purchase Categories</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categories.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#999" />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                  stroke="#999"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#534AB7" radius={[0, 4, 4, 0]} name="Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rarity distribution */}
      {rarities.length > 0 && (
        <div className="chart-section">
          <h3 className="chart-title">Rarity Distribution</h3>
          <div className="chart-container rarity-chart">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={rarities}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {rarities.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
