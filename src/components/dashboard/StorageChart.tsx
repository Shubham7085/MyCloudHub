import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const data = [
  { name: 'Documents', value: 28, color: '#3b82f6' },
  { name: 'Images', value: 55, color: '#10b981' },
  { name: 'Videos', value: 12, color: '#8b5cf6' },
  { name: 'Audio', value: 2, color: '#f59e0b' },
  { name: 'Archives', value: 1.5, color: '#f43f5e' },
  { name: 'Other', value: 1.5, color: '#6b7280' },
];

export function StorageChart() {
  return (
    <Card className="border-border/60 flex flex-col h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold">Storage Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Usage']}
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
