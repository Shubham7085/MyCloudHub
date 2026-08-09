import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export interface StorageChartDatum {
  name: string;
  value: number;
  color: string;
}

interface StorageChartProps {
  data: StorageChartDatum[];
}

export function StorageChart({ data }: StorageChartProps) {
  const hasData = data.some(d => d.value > 0);

  return (
    <Card className="border-border/60 flex flex-col h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold">Storage Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
        {hasData ? (
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
        ) : (
          <p className="text-sm text-muted-foreground text-center px-4">
            No files yet — upload something to see your storage breakdown.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
