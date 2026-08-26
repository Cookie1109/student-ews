import type { WarningLevel } from "../data/mockData";

const config = {
  red: { label: "Đỏ - Khẩn cấp", bg: "bg-red-100", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  yellow: { label: "Vàng - Chú ý", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  green: { label: "Xanh - Bình thường", bg: "bg-green-100", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
};

export default function WarningBadge({ level, short = false }: { level: WarningLevel; short?: boolean }) {
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
      {short ? level.charAt(0).toUpperCase() + level.slice(1) : c.label}
    </span>
  );
}

export function WarningDot({ level }: { level: WarningLevel }) {
  const colors = { red: "bg-red-500", yellow: "bg-yellow-400", green: "bg-green-500" };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[level]}`}></span>;
}
