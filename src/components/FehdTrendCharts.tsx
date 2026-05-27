import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { FehdChartPoint } from '../lib/fehd-history';

interface FehdTrendChartsProps {
  data: FehdChartPoint[];
}

function PriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E4DE] rounded-lg shadow-md px-4 py-3 text-base">
      <p className="font-semibold text-[#1C1C1C] mb-2">{label}</p>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }} className="font-medium">
          {item.name}：${item.value.toLocaleString()} / 擔
        </p>
      ))}
    </div>
  );
}

function SupplyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E4DE] rounded-lg shadow-md px-4 py-3 text-base">
      <p className="font-semibold text-[#1C1C1C] mb-1">{label}</p>
      <p className="text-[#00875A] font-medium">供應量：{payload[0].value.toLocaleString()} 頭</p>
    </div>
  );
}

export default function FehdTrendCharts({ data }: FehdTrendChartsProps) {
  if (!data.length) {
    return (
      <div className="nfh-card p-8 text-center text-[#555555] text-lg">
        暫無近月歷史數據，請稍後再試或按「更新肉價」
      </div>
    );
  }

  const tickStyle = { fontSize: 14, fill: '#555555' };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
      <div className="nfh-card p-5 sm:p-6">
        <h3 className="text-xl font-bold text-[#1C1C1C] mb-1">近一個月拍賣價</h3>
        <p className="text-base text-[#555555] mb-4">食環署官方 · 港元/擔</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
            <XAxis dataKey="label" tick={tickStyle} interval="preserveStartEnd" />
            <YAxis tick={tickStyle} width={48} domain={['auto', 'auto']} />
            <Tooltip content={<PriceTooltip />} />
            <Legend wrapperStyle={{ fontSize: 16, paddingTop: 12 }} />
            <Line
              type="monotone"
              dataKey="average"
              name="平均價"
              stroke="#D98236"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="highest"
              name="最高價"
              stroke="#E8A317"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="lowest"
              name="最低價"
              stroke="#00875A"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="nfh-card p-5 sm:p-6">
        <h3 className="text-xl font-bold text-[#1C1C1C] mb-1">近一個月活豬供應量</h3>
        <p className="text-base text-[#555555] mb-4">食環署官方 · 頭</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" vertical={false} />
            <XAxis dataKey="label" tick={tickStyle} interval="preserveStartEnd" />
            <YAxis tick={tickStyle} width={52} />
            <Tooltip content={<SupplyTooltip />} />
            <Bar dataKey="supply" name="總供應" fill="#D98236" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
