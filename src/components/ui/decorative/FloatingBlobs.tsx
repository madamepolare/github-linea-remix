import { cn } from "@/lib/utils";

interface FloatingBlobsProps {
  variant?: "default" | "hero" | "subtle" | "auth";
  className?: string;
}

export function FloatingBlobs({
  variant = "default",
  className,
}: FloatingBlobsProps) {
  if (variant === "auth") {
    return (
      <div
        className={cn(
          "absolute inset-0 pointer-events-none overflow-hidden",
          className
        )}
      >
        {/* Large cream blob top-right */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-pastel-peach/40 blur-3xl animate-float-slow" />
        {/* Medium blue blob left */}
        <div className="absolute top-1/3 -left-32 w-[350px] h-[350px] rounded-full bg-pastel-blue/30 blur-3xl animate-float" />
        {/* Small pink blob bottom */}
        <div className="absolute -bottom-20 right-1/4 w-[300px] h-[300px] rounded-full bg-pastel-pink/25 blur-3xl animate-float-slow" />
        {/* Accent lavender blob */}
        <div className="absolute top-2/3 right-1/3 w-[200px] h-[200px] rounded-full bg-pastel-lavender/30 blur-2xl animate-glow" />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "absolute inset-0 pointer-events-none overflow-hidden",
          className
        )}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pastel-blue/30 blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-pastel-pink/20 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-16 right-1/4 w-64 h-64 rounded-full bg-pastel-mint/25 blur-2xl animate-glow" />
      </div>
    );
  }

  if (variant === "subtle") {
    return (
      <div
        className={cn(
          "absolute inset-0 pointer-events-none overflow-hidden",
          className
        )}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pastel-blue/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-pastel-pink/10 blur-3xl" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden",
        className
      )}
    >
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-pastel-blue/20 blur-3xl animate-float" />
      <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-pastel-pink/15 blur-3xl animate-float-slow" />
    </div>
  );
}
