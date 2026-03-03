import { Badge } from "../components/ui/badge";

interface RiskBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH";
  className?: string;
}

export default function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  const colors = {
    LOW: "bg-green-100 text-green-700 border-green-200",
    MEDIUM: "bg-orange-100 text-orange-700 border-orange-200",
    HIGH: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <Badge className={`${colors[level]} ${className} border`}>
      {level} RISK
    </Badge>
  );
}
