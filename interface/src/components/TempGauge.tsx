interface GaugeProps {
  temp: number;
  max: number;
  hardware: 'CPU' | 'GPU';
  accentColor: string;
};

const TempGauge = ({ temp, max, hardware, accentColor }: GaugeProps) => {
  const size = 150;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcLengthFactor = 280 / 360;
  const totalArcLength = circumference * arcLengthFactor;

  const percentage = Math.min(Math.max(temp / max, 0), 1);
  const activeLength = totalArcLength * percentage;

  return (
    <div className='gauge-container flex column'>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(130deg)', transformOrigin: 'center' }}>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - 16}
            fill='none'
            stroke='#717171'
            strokeWidth='2' />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            stroke='#717171'
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalArcLength} ${circumference}`}
            strokeLinecap='round' />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${activeLength} ${circumference}`}
            strokeLinecap='round'
            style={{ transition: 'stroke-dasharray 0.3s ease' }} />
        </svg>

        <div className='gauge-value flex column'>
          <span>{temp}</span>
          <span style={{ fontSize: '40px', fontWeight: '300', position: 'absolute', right: -15, top: 1 }}>°</span>
          <span>°C</span>
        </div>
      </div>

      <div className='gauge-bottom-container flex column'>
        <span style={{ color: accentColor }}>{hardware}</span>
        <span>TEMP.</span>
      </div>

    </div>
  );
};

export default TempGauge;