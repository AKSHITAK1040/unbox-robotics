import React, { useMemo } from 'react';

/**
 * SpeedometerGauge - Precision Industrial Robotics Speedometer Component
 * Visual hierarchy:
 * 1. Metallic brushed chrome outer bezel
 * 2. 0-120 km/h instrument sweep with major, medium, and minor tick marks
 * 3. Recessed inner disc with cyan halo ring
 * 4. Illuminated needle with smooth dynamic transition
 * 5. High-contrast digital speed readout with LIVE badge and unit label
 */
const SpeedometerGauge = ({ speed = 0, maxSpeed = 120 }) => {
  // Clamp speed between 0 and maxSpeed
  const clampedSpeed = Math.min(Math.max(Number(speed) || 0, 0), maxSpeed);

  // 250 degree sweep from 145 deg (bottom-left) to 395 deg (bottom-right)
  // At speed 60 (halfway), angle = 145 + 125 = 270 deg (straight up 12 o'clock)
  const totalAngle = 250;
  const startAngle = 145;
  const needleRotation = ((clampedSpeed / maxSpeed) * totalAngle) - (totalAngle / 2); // -125deg to +125deg

  // Generate tick marks and numbers (0, 20, 40, 60, 80, 100, 120)
  const ticks = useMemo(() => {
    const result = [];
    const step = 2; // Tick every 2 km/h
    for (let s = 0; s <= maxSpeed; s += step) {
      const angleDeg = startAngle + (s / maxSpeed) * totalAngle;
      const angleRad = (angleDeg * Math.PI) / 180;
      
      const isMajor = s % 20 === 0;
      const isMedium = s % 10 === 0 && !isMajor;
      
      const outerRadius = 196;
      let innerRadius = outerRadius - 8;
      if (isMajor) innerRadius = outerRadius - 18;
      else if (isMedium) innerRadius = outerRadius - 12;

      const x1 = 250 + outerRadius * Math.cos(angleRad);
      const y1 = 250 + outerRadius * Math.sin(angleRad);
      const x2 = 250 + innerRadius * Math.cos(angleRad);
      const y2 = 250 + innerRadius * Math.sin(angleRad);

      // Label position for major ticks (0, 20, 40, 60, 80, 100, 120)
      let label = null;
      if (isMajor) {
        const textRadius = 154;
        const tx = 250 + textRadius * Math.cos(angleRad);
        const ty = 250 + textRadius * Math.sin(angleRad);
        label = { text: s.toString(), x: tx, y: ty };
      }

      result.push({
        s,
        x1,
        y1,
        x2,
        y2,
        isMajor,
        isMedium,
        label,
      });
    }
    return result;
  }, [maxSpeed]);

  return (
    <div className="relative w-full max-w-[440px] md:max-w-[480px] aspect-square flex items-center justify-center select-none mx-auto">
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full overflow-visible drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
      >
        <defs>
          {/* Outer Metallic Bezel Gradient */}
          <linearGradient id="metallicBezel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="25%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="75%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Dial Background Radial Gradient */}
          <radialGradient id="dialFace" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#141822" />
            <stop offset="70%" stopColor="#0f1219" />
            <stop offset="100%" stopColor="#080a0e" />
          </radialGradient>

          {/* Inner Disc Halo Glow */}
          <radialGradient id="innerDiscGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0, 229, 255, 0.08)" />
            <stop offset="85%" stopColor="rgba(10, 14, 23, 0.75)" />
            <stop offset="100%" stopColor="rgba(0, 229, 255, 0.35)" />
          </radialGradient>

          {/* Cyan Needle Neon Glow */}
          <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Halo Ring Glow */}
          <filter id="haloGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glass Upper Arc Reflection */}
          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.12)" />
            <stop offset="60%" stopColor="rgba(255, 255, 255, 0.02)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.0)" />
          </linearGradient>
        </defs>

        {/* 1. Outer Dark Drop Shadow Base */}
        <circle cx="250" cy="250" r="236" fill="#05070a" />

        {/* 2. Metallic Beveled Ring System */}
        <circle cx="250" cy="250" r="232" fill="url(#metallicBezel)" stroke="#334155" strokeWidth="1" />
        <circle cx="250" cy="250" r="224" fill="#0d1117" stroke="#1e293b" strokeWidth="2" />
        <circle cx="250" cy="250" r="218" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,3" opacity="0.4" />

        {/* 3. Main Dial Face */}
        <circle cx="250" cy="250" r="214" fill="url(#dialFace)" />

        {/* 4. Outer Accent Track Arc (250 degrees) */}
        <path
          d="M 103.6 354.2 A 196 196 0 1 1 396.4 354.2"
          fill="none"
          stroke="#1e293b"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* 5. Ticks and Numbers */}
        {ticks.map((t, idx) => {
          let strokeColor = '#475569';
          let strokeW = 1.2;
          let opacity = 0.5;

          if (t.isMajor) {
            strokeColor = '#f8fafc';
            strokeW = 2.5;
            opacity = 0.95;
          } else if (t.isMedium) {
            strokeColor = '#94a3b8';
            strokeW = 1.8;
            opacity = 0.75;
          }

          return (
            <g key={idx}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeLinecap="round"
                opacity={opacity}
              />
              {t.label && (
                <text
                  x={t.label.x}
                  y={t.label.y + 6}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="18"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  fill="#f1f5f9"
                  className="tabular-nums"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.85)' }}
                >
                  {t.label.text}
                </text>
              )}
            </g>
          );
        })}

        {/* 6. Inner Recessed Circle with Cyan Halo */}
        <circle cx="250" cy="250" r="122" fill="#0a0d13" />
        <circle
          cx="250"
          cy="250"
          r="122"
          fill="url(#innerDiscGlow)"
          stroke="#00e5ff"
          strokeWidth="1.8"
          filter="url(#haloGlow)"
          opacity="0.8"
        />

        {/* 7. Subtle Upper Arc Glass Reflection */}
        <path
          d="M 132 250 A 118 118 0 0 1 368 250 Z"
          fill="url(#glassReflection)"
          pointerEvents="none"
        />

        {/* 8. Glowing Needle (Rotates from center 250, 250) */}
        <g
          className="origin-[250px_250px] transition-transform duration-700 ease-out"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        >
          {/* Subtle Needle Motion Shadow */}
          <polygon
            points="247,124 253,124 250,56"
            fill="rgba(0,0,0,0.5)"
            transform="translate(4, 5)"
          />

          {/* Needle Cyan Neon Glow */}
          <polygon
            points="246,122 254,122 250.5,52 249.5,52"
            fill="#00e5ff"
            opacity="0.8"
            filter="url(#needleGlow)"
          />

          {/* Needle Core Blade */}
          <polygon
            points="247.5,122 252.5,122 250.5,54 249.5,54"
            fill="#ffffff"
          />
        </g>

        {/* 9. Live Digital Speedometer Display */}
        {/* LIVE Indicator Pill */}
        <g transform="translate(222, 168)">
          <rect
            x="0"
            y="0"
            width="56"
            height="18"
            rx="9"
            fill="#141a24"
            stroke="#1e293b"
            strokeWidth="1"
          />
          <circle cx="12" cy="9" r="3.5" fill="#22c55e" className="animate-pulse" />
          <text
            x="32"
            y="12.5"
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            letterSpacing="0.08em"
            fill="#e2e8f0"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            LIVE
          </text>
        </g>

        {/* Big Bold Speed Number */}
        <text
          x="250"
          y="236"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="66"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fill="#ffffff"
          className="tabular-nums"
          style={{ letterSpacing: '-0.03em', textShadow: '0 4px 16px rgba(0,0,0,0.8)' }}
        >
          {clampedSpeed.toFixed(1)}
        </text>

        {/* Unit: km/h */}
        <text
          x="250"
          y="276"
          textAnchor="middle"
          fontSize="15"
          fontWeight="600"
          letterSpacing="0.1em"
          fill="#94a3b8"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          km/h
        </text>
      </svg>
    </div>
  );
};

export default SpeedometerGauge;
