import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { TelemetryReading } from '../../types';

interface Props {
  data: TelemetryReading[];
  height?: number;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B0D13] border border-[#1E2330] rounded-lg p-3 shadow-xl text-xs font-mono">
      <div className="text-[#8E95A5] text-[10.5px] mb-1.5 font-bold tracking-wide">{label} (UTC)</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 font-sans font-bold" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}:
          </span>
          <span className="font-extrabold text-white">
            {p.value} {p.dataKey === 'rssiDbm' ? 'dBm' : 'dB'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SignalChart({ data, height = 180 }: Props) {
  const chartData = data.map((d) => ({
    time: formatTime(d.timestamp),
    rssiDbm: d.rssiDbm,
    snrDb: d.snrDb,
  }));

  if (chartData.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-[#0B0D13] rounded-lg border border-[#1E2330] text-[#636B7C] text-xs font-mono"
      >
        No RF telemetry points logged
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#181C26" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#636B7C' }}
            tickLine={{ stroke: '#181C26' }}
            axisLine={{ stroke: '#181C26' }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="rssi"
            domain={[-115, -55]}
            tick={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', fill: '#8E95A5' }}
            tickLine={false}
            axisLine={{ stroke: '#181C26' }}
          />
          <YAxis
            yAxisId="snr"
            orientation="right"
            domain={[-10, 20]}
            tick={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', fill: '#FF4D4D' }}
            tickLine={false}
            axisLine={{ stroke: '#181C26' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId="rssi"
            type="monotone"
            dataKey="rssiDbm"
            name="RSSI (dBm)"
            stroke="#FF2B2B"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#FF2B2B', stroke: '#FFFFFF', strokeWidth: 2 }}
          />
          <Line
            yAxisId="snr"
            type="monotone"
            dataKey="snrDb"
            name="SNR (dB)"
            stroke="#C00000"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            activeDot={{ r: 3.5, fill: '#C00000', stroke: '#FFFFFF', strokeWidth: 1.5 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingBottom: 6 }}
            formatter={(value) => <span className="text-[#8E95A5] font-semibold">{value}</span>}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
