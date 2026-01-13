import { motion } from "framer-motion";

interface IsometricModulesProps {
  className?: string;
}

export const IsometricModules = ({ className = "" }: IsometricModulesProps) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Main composition of isometric modules */}
        
        {/* Blue cube - Projects */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <g transform="translate(320, 180)">
            {/* Top face */}
            <path
              d="M0 40 L80 0 L160 40 L80 80 Z"
              fill="hsl(210 80% 90%)"
              stroke="hsl(210 60% 70%)"
              strokeWidth="1"
            />
            {/* Left face */}
            <path
              d="M0 40 L80 80 L80 160 L0 120 Z"
              fill="hsl(210 70% 85%)"
              stroke="hsl(210 60% 70%)"
              strokeWidth="1"
            />
            {/* Right face */}
            <path
              d="M160 40 L80 80 L80 160 L160 120 Z"
              fill="hsl(210 60% 80%)"
              stroke="hsl(210 60% 70%)"
              strokeWidth="1"
            />
            {/* Folder icon on top */}
            <path
              d="M50 30 L50 20 L65 20 L70 25 L110 25 L110 55 L50 55 Z"
              fill="hsl(210 70% 60%)"
              opacity="0.8"
            />
          </g>
        </motion.g>

        {/* Pink cube - CRM */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <g transform="translate(480, 240)">
            {/* Top face */}
            <path
              d="M0 30 L60 0 L120 30 L60 60 Z"
              fill="hsl(340 70% 92%)"
              stroke="hsl(340 50% 75%)"
              strokeWidth="1"
            />
            {/* Left face */}
            <path
              d="M0 30 L60 60 L60 120 L0 90 Z"
              fill="hsl(340 60% 88%)"
              stroke="hsl(340 50% 75%)"
              strokeWidth="1"
            />
            {/* Right face */}
            <path
              d="M120 30 L60 60 L60 120 L120 90 Z"
              fill="hsl(340 50% 85%)"
              stroke="hsl(340 50% 75%)"
              strokeWidth="1"
            />
            {/* Users icon */}
            <circle cx="60" cy="25" r="10" fill="hsl(340 60% 65%)" opacity="0.8" />
            <circle cx="45" cy="28" r="8" fill="hsl(340 60% 70%)" opacity="0.6" />
            <circle cx="75" cy="28" r="8" fill="hsl(340 60% 70%)" opacity="0.6" />
          </g>
        </motion.g>

        {/* Green cube - Commercial */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <g transform="translate(200, 280)">
            {/* Top face */}
            <path
              d="M0 35 L70 0 L140 35 L70 70 Z"
              fill="hsl(160 50% 90%)"
              stroke="hsl(160 40% 70%)"
              strokeWidth="1"
            />
            {/* Left face */}
            <path
              d="M0 35 L70 70 L70 140 L0 105 Z"
              fill="hsl(160 45% 85%)"
              stroke="hsl(160 40% 70%)"
              strokeWidth="1"
            />
            {/* Right face */}
            <path
              d="M140 35 L70 70 L70 140 L140 105 Z"
              fill="hsl(160 40% 82%)"
              stroke="hsl(160 40% 70%)"
              strokeWidth="1"
            />
            {/* Document icon */}
            <rect x="45" y="20" width="50" height="35" rx="3" fill="hsl(160 50% 60%)" opacity="0.8" />
            <line x1="55" y1="30" x2="85" y2="30" stroke="white" strokeWidth="2" opacity="0.7" />
            <line x1="55" y1="38" x2="80" y2="38" stroke="white" strokeWidth="2" opacity="0.7" />
            <line x1="55" y1="46" x2="75" y2="46" stroke="white" strokeWidth="2" opacity="0.7" />
          </g>
        </motion.g>

        {/* Purple cube - Planning */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <g transform="translate(360, 340)">
            {/* Top face */}
            <path
              d="M0 25 L50 0 L100 25 L50 50 Z"
              fill="hsl(270 60% 92%)"
              stroke="hsl(270 45% 75%)"
              strokeWidth="1"
            />
            {/* Left face */}
            <path
              d="M0 25 L50 50 L50 100 L0 75 Z"
              fill="hsl(270 55% 88%)"
              stroke="hsl(270 45% 75%)"
              strokeWidth="1"
            />
            {/* Right face */}
            <path
              d="M100 25 L50 50 L50 100 L100 75 Z"
              fill="hsl(270 50% 85%)"
              stroke="hsl(270 45% 75%)"
              strokeWidth="1"
            />
            {/* Calendar grid */}
            <rect x="25" y="12" width="50" height="30" rx="2" fill="hsl(270 50% 65%)" opacity="0.8" />
            <line x1="25" y1="22" x2="75" y2="22" stroke="white" strokeWidth="1" opacity="0.5" />
            <line x1="42" y1="12" x2="42" y2="42" stroke="white" strokeWidth="1" opacity="0.3" />
            <line x1="58" y1="12" x2="58" y2="42" stroke="white" strokeWidth="1" opacity="0.3" />
          </g>
        </motion.g>

        {/* Orange cube - Tenders */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <g transform="translate(500, 350)">
            {/* Top face */}
            <path
              d="M0 30 L60 0 L120 30 L60 60 Z"
              fill="hsl(30 80% 92%)"
              stroke="hsl(30 60% 75%)"
              strokeWidth="1"
            />
            {/* Left face */}
            <path
              d="M0 30 L60 60 L60 120 L0 90 Z"
              fill="hsl(30 70% 88%)"
              stroke="hsl(30 60% 75%)"
              strokeWidth="1"
            />
            {/* Right face */}
            <path
              d="M120 30 L60 60 L60 120 L120 90 Z"
              fill="hsl(30 65% 85%)"
              stroke="hsl(30 60% 75%)"
              strokeWidth="1"
            />
            {/* Trophy icon */}
            <path
              d="M45 15 L45 30 Q60 45 75 30 L75 15 Z"
              fill="hsl(30 70% 60%)"
              opacity="0.9"
            />
            <rect x="55" y="30" width="10" height="12" fill="hsl(30 70% 55%)" opacity="0.8" />
            <rect x="50" y="42" width="20" height="4" rx="1" fill="hsl(30 70% 55%)" opacity="0.8" />
          </g>
        </motion.g>

        {/* Floating decorative elements */}
        <motion.circle
          cx="150"
          cy="150"
          r="8"
          fill="hsl(210 70% 80%)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4], y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.circle
          cx="650"
          cy="200"
          r="6"
          fill="hsl(340 60% 80%)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 0.9, 0.5], y: [-3, 3, -3] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
        />
        <motion.circle
          cx="700"
          cy="400"
          r="10"
          fill="hsl(160 50% 80%)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3], y: [-8, 8, -8] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
        <motion.circle
          cx="120"
          cy="380"
          r="5"
          fill="hsl(270 55% 80%)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4], y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
        />

        {/* Connection lines */}
        <motion.path
          d="M400 260 Q420 280 480 270"
          stroke="hsl(0 0% 80%)"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />
        <motion.path
          d="M340 340 Q380 360 360 380"
          stroke="hsl(0 0% 80%)"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
        />
        <motion.path
          d="M460 380 Q480 390 500 380"
          stroke="hsl(0 0% 80%)"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.2 }}
        />
      </svg>
    </div>
  );
};
