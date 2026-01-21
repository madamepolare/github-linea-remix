import { 
  Sun, 
  Clock, 
  Cross, 
  PauseCircle, 
  BookOpen, 
  Home, 
  GraduationCap,
  CircleDot,
  LucideIcon
} from "lucide-react";

// Map absence types to Lucide icons
const absenceIcons: Record<string, LucideIcon> = {
  conge_paye: Sun,
  rtt: Clock,
  maladie: Cross,
  sans_solde: PauseCircle,
  formation: BookOpen,
  teletravail: Home,
  ecole: GraduationCap,
  autre: CircleDot,
};

// Map absence types to colors
const absenceColors: Record<string, string> = {
  conge_paye: "text-amber-500",
  rtt: "text-blue-500",
  maladie: "text-red-500",
  sans_solde: "text-gray-500",
  formation: "text-green-500",
  teletravail: "text-indigo-500",
  ecole: "text-violet-500",
  autre: "text-gray-400",
};

interface AbsenceIconProps {
  type: string;
  size?: number;
  className?: string;
}

export function AbsenceIcon({ type, size = 20, className }: AbsenceIconProps) {
  const Icon = absenceIcons[type] || absenceIcons.autre;
  const colorClass = absenceColors[type] || absenceColors.autre;

  return (
    <Icon 
      size={size} 
      className={`${colorClass} ${className || ""}`}
      strokeWidth={1.5}
    />
  );
}
