import { motion } from "framer-motion";
import { ReactNode } from "react";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

export function OnboardingLayout({ children, currentStep, totalSteps }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-muted/50" />
      
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl"
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Progress indicator */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-border/50">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i <= currentStep ? "bg-foreground" : "bg-muted"
              }`}
              initial={{ width: 8 }}
              animate={{ width: i === currentStep ? 24 : 8 }}
            />
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="fixed top-6 left-6 z-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-foreground" />
            <div className="w-3 h-0.5 bg-foreground/60" />
            <div className="w-1.5 h-0.5 bg-foreground/30" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">LINEA</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col pt-20">
        {children}
      </div>
    </div>
  );
}
