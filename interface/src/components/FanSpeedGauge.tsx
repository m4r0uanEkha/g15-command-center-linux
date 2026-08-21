interface GaugeProps {
    speed: number;
    hardware: 'CPU' | 'GPU';
    accentColor: string;
}

const FanSpeedGauge = ({ speed, hardware, accentColor }: GaugeProps) => {
    const size = 150;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const totalArcLength = circumference * ((360 - 80) / 360);

    const isRunning = speed > 0;
    const animationDuration = isRunning ? '7s' : '0s';

    const totalBlades = 35;
    const lines = [];
    for (let i = 0; i < totalBlades; i++) {
        const angleDegree = (i * 360) / totalBlades;
        const angleRadInner = (angleDegree * Math.PI) / 180;

        const angleRadOuter = ((angleDegree - 10) * Math.PI) / 180;

        const x1 = center + (radius - strokeWidth) * Math.cos(angleRadInner);
        const y1 = center + (radius - strokeWidth) * Math.sin(angleRadInner);

        const x2 = center + (radius + strokeWidth) * Math.cos(angleRadOuter);
        const y2 = center + (radius + strokeWidth) * Math.sin(angleRadOuter);

        lines.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke='black' strokeWidth='2.5' />);
    }

    return (
        <div className='gauge-container flex column'>

            <div className='flex column' style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size}>
                    <defs>

                        <radialGradient id='bladeGlow' cx='50%' cy='50%' r='60%'>
                            <stop offset='0%' stopColor={accentColor} />
                            <stop offset='70%' stopColor={accentColor} />
                            <stop offset="90%" stopColor="#7b7d80cc" />
                            <stop offset="100%" stopColor="#B0B7BD" />
                        </radialGradient>

                        <mask id='bladeSlicesMask'>
                            <circle cx={center} cy={center} r={radius + strokeWidth} fill='white' />
                            <g className={isRunning ? 'spinning-blades-mask' : ''} style={{ animationDuration }}>
                                {lines}
                            </g>
                        </mask>

                        <mask id='gaugeArcWindow'>
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill='none'
                                stroke='white'
                                strokeWidth={strokeWidth + 2}
                                strokeDasharray={`${totalArcLength} ${circumference}`}
                                strokeLinecap='round'
                                style={{ transform: 'rotate(130deg)', transformOrigin: 'center' }} />
                        </mask>
                    </defs>

                    <circle
                        cx={center}
                        cy={center}
                        r={radius - 13}
                        fill='none'
                        stroke='#717171'
                        strokeWidth='2' />

                    <g mask='url(#gaugeArcWindow)'>

                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill='none'
                            stroke='#2a2a2a'
                            strokeWidth={strokeWidth}
                            mask='url(#bladeSlicesMask)' />

                        {
                            isRunning && (
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill='none'
                                    stroke={'url(#bladeGlow)'}
                                    strokeWidth={strokeWidth}
                                    mask='url(#bladeSlicesMask)' />
                            )
                        }

                    </g>
                </svg>

                <div className='gauge-value flex column'>
                    <span>{speed}</span>
                    <span>%</span>
                </div>
            </div>

            <div className='gauge-bottom-container flex column'>
                <span style={{ color: accentColor }}>{hardware}</span>
                <span>FAN SPEED</span>
            </div>

        </div>
    );
}

export default FanSpeedGauge;