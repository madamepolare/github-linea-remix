import { forwardRef } from "react";
import { motion } from "framer-motion";

interface FloatingShapesProps {
  className?: string;
  variant?: "hero" | "section";
}

export const FloatingShapes = forwardRef<HTMLDivElement, FloatingShapesProps>(
  ({ className = "", variant = "hero" }, ref) => {
    if (variant === "hero") {
      return (
        <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
          {/* Large gradient blob top right */}
          <motion.div
            className="absolute -top-20 -right-20 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(210 80% 95%) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Pink blob left */}
          <motion.div
            className="absolute top-1/3 -left-32 w-[250px] sm:w-[300px] lg:w-[400px] h-[250px] sm:h-[300px] lg:h-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(340 70% 95%) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />

          {/* Mint blob bottom */}
          <motion.div
            className="absolute bottom-0 right-1/4 w-[200px] sm:w-[280px] lg:w-[350px] h-[200px] sm:h-[280px] lg:h-[350px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(160 50% 95%) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />

          {/* Small floating circles - hidden on mobile for performance */}
          <motion.div
            className="hidden sm:block absolute top-20 left-1/4 w-3 h-3 rounded-full bg-pastel-blue"
            animate={{
              y: [-10, 10, -10],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="hidden sm:block absolute top-40 right-1/3 w-2 h-2 rounded-full bg-pastel-pink"
            animate={{
              y: [-8, 8, -8],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          <motion.div
            className="hidden sm:block absolute bottom-40 left-1/3 w-4 h-4 rounded-full bg-pastel-mint"
            animate={{
              y: [-12, 12, -12],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="hidden sm:block absolute bottom-20 right-20 w-2.5 h-2.5 rounded-full bg-pastel-lavender"
            animate={{
              y: [-6, 6, -6],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5,
            }}
          />
        </div>
      );
    }

    return (
      <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <motion.div
          className="absolute top-10 right-10 w-[150px] sm:w-[200px] h-[150px] sm:h-[200px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(210 80% 95%) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-[100px] sm:w-[150px] h-[100px] sm:h-[150px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(340 70% 95%) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>
    );
  }
);

FloatingShapes.displayName = "FloatingShapes";
