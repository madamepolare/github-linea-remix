import { motion } from "framer-motion";

interface IsometricIllustrationProps {
  type: "workspace" | "modules" | "team" | "success";
  className?: string;
}

export function IsometricIllustration({ type, className = "" }: IsometricIllustrationProps) {
  const illustrations = {
    workspace: (
      <svg viewBox="0 0 200 200" className={className}>
        {/* Building/Workspace isometric */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Base platform */}
          <motion.path
            d="M100 160 L160 130 L100 100 L40 130 Z"
            fill="#E8E4DF"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Main building */}
          <motion.path
            d="M70 130 L70 70 L100 55 L130 70 L130 130 L100 145 Z"
            fill="#1a1a1a"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
          <motion.path
            d="M100 55 L100 115 L130 130 L130 70 Z"
            fill="#2a2a2a"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
          {/* Windows */}
          <motion.rect x="78" y="80" width="12" height="15" fill="#7dd3fc" rx="1"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.rect x="78" y="100" width="12" height="15" fill="#fcd34d" rx="1"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.rect x="108" y="85" width="12" height="15" fill="#a5f3fc" rx="1"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          {/* Floating elements */}
          <motion.circle cx="50" cy="60" r="6" fill="#7dd3fc"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.rect x="145" y="50" width="10" height="10" fill="#fcd34d" rx="2"
            animate={{ y: [0, -6, 0], rotate: [0, 45, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
          />
        </motion.g>
      </svg>
    ),
    modules: (
      <svg viewBox="0 0 200 200" className={className}>
        <motion.g
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Floating cards/modules */}
          <motion.g
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="30" y="80" width="50" height="60" rx="8" fill="#1a1a1a" />
            <rect x="38" y="90" width="20" height="3" rx="1" fill="#7dd3fc" />
            <rect x="38" y="98" width="34" height="2" rx="1" fill="#666" />
            <rect x="38" y="104" width="28" height="2" rx="1" fill="#666" />
            <circle cx="55" cy="125" r="8" fill="#22c55e" opacity="0.3" />
            <path d="M52 125 L54 127 L59 122" stroke="#22c55e" strokeWidth="2" fill="none" />
          </motion.g>
          
          <motion.g
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <rect x="90" y="60" width="50" height="60" rx="8" fill="#1a1a1a" />
            <rect x="98" y="70" width="20" height="3" rx="1" fill="#fcd34d" />
            <rect x="98" y="78" width="34" height="2" rx="1" fill="#666" />
            <rect x="98" y="84" width="28" height="2" rx="1" fill="#666" />
            <circle cx="115" cy="105" r="8" fill="#22c55e" opacity="0.3" />
            <path d="M112 105 L114 107 L119 102" stroke="#22c55e" strokeWidth="2" fill="none" />
          </motion.g>
          
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            <rect x="60" y="130" width="50" height="60" rx="8" fill="#1a1a1a" />
            <rect x="68" y="140" width="20" height="3" rx="1" fill="#f472b6" />
            <rect x="68" y="148" width="34" height="2" rx="1" fill="#666" />
            <rect x="68" y="154" width="28" height="2" rx="1" fill="#666" />
          </motion.g>
          
          {/* Decorative dots */}
          <motion.circle cx="160" cy="90" r="4" fill="#7dd3fc"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle cx="25" cy="150" r="3" fill="#fcd34d"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
        </motion.g>
      </svg>
    ),
    team: (
      <svg viewBox="0 0 200 200" className={className}>
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Central person */}
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="100" cy="85" r="20" fill="#1a1a1a" />
            <circle cx="100" cy="75" r="12" fill="#E8E4DF" />
            <ellipse cx="100" cy="120" rx="25" ry="15" fill="#1a1a1a" />
          </motion.g>
          
          {/* Left person */}
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <circle cx="50" cy="100" r="15" fill="#2a2a2a" />
            <circle cx="50" cy="92" r="9" fill="#E8E4DF" />
            <ellipse cx="50" cy="125" rx="18" ry="12" fill="#2a2a2a" />
          </motion.g>
          
          {/* Right person */}
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            <circle cx="150" cy="100" r="15" fill="#2a2a2a" />
            <circle cx="150" cy="92" r="9" fill="#E8E4DF" />
            <ellipse cx="150" cy="125" rx="18" ry="12" fill="#2a2a2a" />
          </motion.g>
          
          {/* Connection lines */}
          <motion.line x1="70" y1="105" x2="85" y2="95" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="4"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.line x1="130" y1="105" x2="115" y2="95" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="4"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          
          {/* Floating icons */}
          <motion.circle cx="100" cy="50" r="8" fill="#fcd34d"
            animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.rect x="170" cy="70" width="8" height="8" rx="2" fill="#f472b6"
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </motion.g>
      </svg>
    ),
    success: (
      <svg viewBox="0 0 200 200" className={className}>
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          {/* Rocket */}
          <motion.g
            animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M100 40 L115 80 L100 120 L85 80 Z" fill="#1a1a1a" />
            <ellipse cx="100" cy="75" rx="12" ry="20" fill="#2a2a2a" />
            <circle cx="100" cy="70" r="6" fill="#7dd3fc" />
            <path d="M85 95 L75 110 L85 100 Z" fill="#f472b6" />
            <path d="M115 95 L125 110 L115 100 Z" fill="#f472b6" />
            {/* Flame */}
            <motion.path
              d="M95 120 L100 145 L105 120 Z"
              fill="#fcd34d"
              animate={{ scaleY: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            <motion.path
              d="M97 120 L100 135 L103 120 Z"
              fill="#f97316"
              animate={{ scaleY: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
          </motion.g>
          
          {/* Stars */}
          <motion.circle cx="60" cy="60" r="3" fill="#fcd34d"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle cx="140" cy="50" r="2" fill="#7dd3fc"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle cx="155" cy="100" r="3" fill="#f472b6"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          />
          <motion.circle cx="45" cy="110" r="2" fill="#22c55e"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
          />
          
          {/* Confetti particles */}
          <motion.rect x="50" y="160" width="6" height="6" rx="1" fill="#7dd3fc"
            animate={{ y: [0, -40], opacity: [1, 0], rotate: [0, 180] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.rect x="145" y="160" width="6" height="6" rx="1" fill="#fcd34d"
            animate={{ y: [0, -50], opacity: [1, 0], rotate: [0, -180] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}
          />
        </motion.g>
      </svg>
    ),
  };

  return illustrations[type] || null;
}
