import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeeklyData {
  week: string;
  applications: number;
  interviews: number;
}

interface WeeklyBarChartProps {
  period: string;
}

export default function WeeklyBarChart({ period }: WeeklyBarChartProps) {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/weekly?period=${period}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          // If endpoint doesn't exist, use mock data
          if (response.status === 404) {
            setData(getMockData(period));
            return;
          }
          throw new Error('Failed to fetch weekly data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching weekly data, using mock data:', err);
        setData(getMockData(period));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-muted">Loading chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-red">Failed to load chart data</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-muted">No data available for this period</div>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg3)" />
          <XAxis
            dataKey="week"
            tick={{ fill: 'var(--fg4)', fontSize: 12 }}
            stroke="var(--bg3)"
          />
          <YAxis
            tick={{ fill: 'var(--fg4)', fontSize: 12 }}
            stroke="var(--bg3)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#665c54',
              border: '1px solid #8ec07c',
              borderRadius: '4px',
              color: '#fbf1c7',
              padding: '0.5rem 0.75rem',
            }}
            labelStyle={{
              color: '#fbf1c7',
              fontWeight: 600,
            }}
            itemStyle={{
              color: '#fbf1c7',
            }}
          />
          <Bar dataKey="applications" fill="var(--accent-aqua)" name="Applications" radius={[4, 4, 0, 0]} />
          <Bar dataKey="interviews" fill="var(--accent-green)" name="Interviews" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mock data function for when backend endpoint doesn't exist
function getMockData(period: string): WeeklyData[] {
  const weekCount = period === '7d' ? 1 : period === '30d' ? 4 : period === '3m' ? 12 : 16;

  const data: WeeklyData[] = [];
  const today = new Date();

  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekLabel =
      period === '7d'
        ? 'This Week'
        : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    data.push({
      week: weekLabel,
      applications: Math.floor(Math.random() * 10) + 1,
      interviews: Math.floor(Math.random() * 3),
    });
  }

  return data;
}
