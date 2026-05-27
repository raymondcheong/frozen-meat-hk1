import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatMainlandWeekLabel, type MainlandChartPoint } from '../lib/mainland-meat';

interface MainlandMeatChartsProps {
  data: MainlandChartPoint[];
}

function MeatTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-[#E8E4DE] rounded-lg shadow-md px-4 py-3 text-base">
      <p className="font-semibold text-[#1C1C1C] mb-1">{label}</p>
      <p style={{ color: item.color }} className="font-bold text-lg">
        {item.name}：¥{item.value.toFixed(2)}/公斤
      </p>
    </div>
  );
}

function formatTickLabel(label: string): string {
  return formatMainlandWeekLabel(label);
}

function MeatTrendChart({
  data,
  dataKey,
  name,
  title,
  stroke,
}: {
  data: MainlandChartPoint[];
  dataKey: 'pork' | 'beef';
  name: string;
  title: string;
  stroke: string;
}) {
  const tickStyle = { fontSize: 13, fill: '#555555' };
  const values = data.map((d) => d[dataKey]).filter((v) => v > 0);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  const padding = Math.max((max - min) * 0.15, 2);
  const yMin = Math.max(0, Math.floor(min - padding));
  const yMax = Math.ceil(max + padding);

  return (
    <div className="nfh-card p-4 sm:p-5 border border-[#E8E4DE]">
      <h4 className="text-lg font-bold text-[#1C1C1C] mb-1">{title}</h4>
      <p className="text-sm text-[#888888] mb-3">元/公斤 · 全國500縣集貿市場</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
          <XAxis
            dataKey="label"
            tick={tickStyle}
            interval="preserveStartEnd"
            tickFormatter={formatTickLabel}
          />
          <YAxis tick={tickStyle} width={44} domain={[yMin, yMax]} />
          <Tooltip content={<MeatTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={name}
            stroke={stroke}
            strokeWidth={3}
            dot={{ r: 4, fill: stroke }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function MainlandMeatCharts({ data }: MainlandMeatChartsProps) {
  if (!data.length) {
    return (
      <div className="nfh-card p-8 text-center text-[#555555] text-lg">
        暫無內地價格走勢，請稍後再試
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-[#1C1C1C] mb-1">近三個月內地豬牛價格走勢</h3>
        <p className="text-base text-[#555555]">農業農村部 · 每週更新 · 豬牛分開統計</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <MeatTrendChart
          data={data}
          dataKey="pork"
          name="豬肉"
          title="豬肉零售價"
          stroke="#D98236"
        />
        <MeatTrendChart
          data={data}
          dataKey="beef"
          name="牛肉"
          title="牛肉零售價"
          stroke="#B56A28"
        />
      </div>
    </div>
  );
}
