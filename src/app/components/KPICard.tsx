import { Card } from "../components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function KPICard({ title, value, icon: Icon, trend, trendUp }: KPICardProps) {
  return (
    <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-gray-900">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#3B82F6]" />
        </div>
      </div>
    </Card>
  );
}
