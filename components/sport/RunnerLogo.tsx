import styles from "./RunnerLogo.module.css";

// A runner jogging in place on a rising chart line. The line doubles as a treadmill: light-cyan
// pulses flow back along it at the speed the planted foot moves, so the runner seems to hold
// their ground on a moving rail. Everything animates in CSS; with reduced motion the logo rests
// in a mid-stride pose.

// Chart vertices (viewBox units). The last segment is the rail the runner stands on.
const POINTS = "20,280 80,240 122,254 182,196 224,210 372,150";
// Runner contact point on the last segment and that segment's slope.
const CONTACT = { x: 292, y: 182.4 };
const SLOPE_DEG = (Math.atan2(150 - 210, 372 - 224) * 180) / Math.PI;

// Local runner frame: the rail is y = 0; joints in viewBox units.
const HIP = -79;
const KNEE = -41;
const FOOT = -5;
const SHOULDER = -127;
const ELBOW = -100;
const HAND = -75;
const LEAN_DEG = 14;

const origin = (y: number) => ({ transformOrigin: `0px ${y}px` });

function Leg({ back }: { back?: boolean }) {
  return (
    <g className={`${styles.thigh} ${back ? styles.late : ""}`} style={origin(HIP)}>
      <line x1="0" y1={HIP} x2="0" y2={KNEE} />
      <g className={`${styles.shin} ${back ? styles.late : ""}`} style={origin(KNEE)}>
        <line x1="0" y1={KNEE} x2="0" y2={FOOT} />
        <line x1="0" y1={FOOT} x2="11" y2={FOOT} className={styles.foot} />
      </g>
    </g>
  );
}

function Arm({ back }: { back?: boolean }) {
  return (
    <g className={`${styles.upperArm} ${back ? styles.late : ""}`} style={origin(SHOULDER)}>
      <line x1="0" y1={SHOULDER} x2="0" y2={ELBOW} />
      <g className={`${styles.forearm} ${back ? styles.late : ""}`} style={origin(ELBOW)}>
        <line x1="0" y1={ELBOW} x2="0" y2={HAND} />
      </g>
    </g>
  );
}

export function RunnerLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={`${styles.logo} ${className}`} role="img" aria-label="רץ על גרף עולה">
      <defs>
        <linearGradient id="rail" x1="20" y1="280" x2="372" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0284c7" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* Chart / rail */}
      <polyline points={POINTS} className={styles.railGlow} />
      <polyline points={POINTS} className={styles.rail} stroke="url(#rail)" />
      <polyline points={POINTS} className={styles.railFlowSoft} pathLength={100} />
      <polyline points={POINTS} className={styles.railFlowCore} pathLength={100} />
      <g transform={`translate(372 150) rotate(${SLOPE_DEG})`}>
        <polyline points="-17,-12 0,0 -17,12" className={styles.arrow} />
      </g>

      {/* Runner */}
      <g transform={`translate(${CONTACT.x} ${CONTACT.y}) rotate(${SLOPE_DEG})`}>
        <g className={styles.bounce}>
          <g className={styles.limbsBack}>
            <Leg back />
          </g>
          {/* Torso stands upright with a slight forward lean, whatever the slope. */}
          <g style={{ ...origin(HIP), rotate: `${-SLOPE_DEG + LEAN_DEG}deg` }} className={styles.body}>
            <g className={styles.limbsBack}>
              <Arm back />
            </g>
            <line x1="0" y1={HIP} x2="0" y2={SHOULDER - 3} className={styles.torso} />
            <circle cx="2" cy={SHOULDER - 22} r="13" className={styles.head} />
            <Arm />
          </g>
          <Leg />
        </g>
      </g>
    </svg>
  );
}
