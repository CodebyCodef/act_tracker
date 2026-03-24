interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
}

export default function StatCard({ title, value, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      {trend && <p className="text-green-400 text-sm mt-1">{trend}</p>}
    </div>
  );
}
