import { motion } from "framer-motion";

interface FloatingShapesProps {
  className?: string;
  variant?: "hero" | "section";
}

export const FloatingShapes = ({ className = "", variant = "hero" }: FloatingShapesProps) => {
  if (variant === "hero") {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        {/* Large gradient blob top right */}
        <motion.div
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full"
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
          className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full"
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
          className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full"
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

        {/* Small floating circles */}
        <motion.div
          className="absolute top-20 left-1/4 w-3 h-3 rounded-full bg-pastel-blue"
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
          className="absolute top-40 right-1/3 w-2 h-2 rounded-full bg-pastel-pink"
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
          className="absolute bottom-40 left-1/3 w-4 h-4 rounded-full bg-pastel-mint"
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
          className="absolute bottom-20 right-20 w-2.5 h-2.5 rounded-full bg-pastel-lavender"
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
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute top-10 right-10 w-[200px] h-[200px] rounded-full"
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
        className="absolute bottom-10 left-10 w-[150px] h-[150px] rounded-full"
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
};
