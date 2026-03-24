import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';

interface PromisePieChartProps {
  paid: number;
  promise: number;
  remainingDays?: number | null;
  formatCurrency: (amount: number) => string;
}

export default function PromisePieChart({ 
  paid, 
  promise, 
  remainingDays = null,
  formatCurrency 
}: PromisePieChartProps) {
  const remaining = Math.max(0, promise - paid);
  
  const chartData = [
    { name: 'Bezahlt', value: paid, color: '#10b981' },
    { name: 'Ausstehend', value: remaining, color: '#e5e7eb' }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          {remainingDays !== null && (
            <Label
              value={remainingDays >= 0 ? `${remainingDays}` : '0'}
              position="center"
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                fill: remainingDays >= 0 ? '#1f2937' : '#ef4444'
              }}
            />
          )}
          {remainingDays !== null && (
            <Label
              value={remainingDays >= 0 ? 'Tage' : 'Abgelaufen'}
              position="center"
              dy={20}
              style={{
                fontSize: '12px',
                fill: '#6b7280'
              }}
            />
          )}
        </Pie>
        <Tooltip 
          formatter={(value) => {
            const numValue = typeof value === 'number' ? value : 0;
            return formatCurrency(numValue);
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
