import { useMemo } from "react";
import Lottie from "lottie-react";

// Simple animated icons for each absence type - using inline JSON for small animations
const absenceAnimations: Record<string, object> = {
  conge_paye: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 48,
    h: 48,
    layers: [
      {
        ty: 4,
        nm: "sun",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 1, k: [{ t: 0, s: [0], h: 0 }, { t: 60, s: [360], h: 0 }] },
          p: { a: 0, k: [24, 24, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: "el",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [20, 20] }
          },
          {
            ty: "fl",
            c: { a: 0, k: [1, 0.8, 0.2, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  },
  rtt: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 48,
    h: 48,
    layers: [
      {
        ty: 4,
        nm: "clock",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [24, 24, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 30, s: [110, 110, 100] }, { t: 60, s: [100, 100, 100] }] }
        },
        shapes: [
          {
            ty: "el",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [24, 24] }
          },
          {
            ty: "st",
            c: { a: 0, k: [0.4, 0.5, 1, 1] },
            w: { a: 0, k: 2 }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  },
  maladie: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 48,
    h: 48,
    layers: [
      {
        ty: 4,
        nm: "cross",
        sr: 1,
        ks: {
          o: { a: 1, k: [{ t: 0, s: [100] }, { t: 30, s: [60] }, { t: 60, s: [100] }] },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [24, 24, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [8, 24] },
            r: { a: 0, k: 2 }
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.9, 0.3, 0.3, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      },
      {
        ty: 4,
        nm: "cross2",
        sr: 1,
        ks: {
          o: { a: 1, k: [{ t: 0, s: [100] }, { t: 30, s: [60] }, { t: 60, s: [100] }] },
          r: { a: 0, k: 90 },
          p: { a: 0, k: [24, 24, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [8, 24] },
            r: { a: 0, k: 2 }
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.9, 0.3, 0.3, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  },
  sans_solde: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 48,
    h: 48,
    layers: [
      {
        ty: 4,
        nm: "pause",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 1, k: [{ t: 0, s: [24, 24, 0] }, { t: 15, s: [24, 22, 0] }, { t: 30, s: [24, 24, 0] }, { t: 45, s: [24, 26, 0] }, { t: 60, s: [24, 24, 0] }] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: "rc",
            p: { a: 0, k: [-6, 0] },
            s: { a: 0, k: [6, 20] },
            r: { a: 0, k: 2 }
          },
          {
            ty: "rc",
            p: { a: 0, k: [6, 0] },
            s: { a: 0, k: [6, 20] },
            r: { a: 0, k: 2 }
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.6, 0.6, 0.6, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  },
  formation: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 48,
    h: 48,
    layers: [
      {
        ty: 4,
        nm: "book",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 1, k: [{ t: 0, s: [-5] }, { t: 30, s: [5] }, { t: 60, s: [-5] }] },
          p: { a: 0, k: [24, 24, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [20, 24] },
            r: { a: 0, k: 2 }
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.3, 0.7, 0.5, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  },
  teletravail: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 48,
    h: 48,
    layers: [
      {
        ty: 4,
        nm: "house",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [24, 24, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 30, s: [105, 105, 100] }, { t: 60, s: [100, 100, 100] }] }
        },
        shapes: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 4] },
            s: { a: 0, k: [20, 16] },
            r: { a: 0, k: 2 }
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.4, 0.6, 0.9, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  },
  ecole: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 48,
    h: 48,
    layers: [
      {
        ty: 4,
        nm: "graduation",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 1, k: [{ t: 0, s: [-3] }, { t: 30, s: [3] }, { t: 60, s: [-3] }] },
          p: { a: 0, k: [24, 22, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [28, 6] },
            r: { a: 0, k: 1 }
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.2, 0.4, 0.8, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      },
      {
        ty: 4,
        nm: "cap",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [24, 28, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [18, 10] },
            r: { a: 0, k: 2 }
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.3, 0.5, 0.9, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  },
  autre: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 48,
    h: 48,
    layers: [
      {
        ty: 4,
        nm: "dot",
        sr: 1,
        ks: {
          o: { a: 1, k: [{ t: 0, s: [100] }, { t: 30, s: [50] }, { t: 60, s: [100] }] },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [24, 24, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: "el",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [16, 16] }
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.6, 0.6, 0.6, 1] }
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  }
};

interface AbsenceLottieProps {
  type: string;
  size?: number;
  className?: string;
}

export function AbsenceLottie({ type, size = 24, className }: AbsenceLottieProps) {
  const animationData = useMemo(() => {
    return absenceAnimations[type] || absenceAnimations.autre;
  }, [type]);

  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
