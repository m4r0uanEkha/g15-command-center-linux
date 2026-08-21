import { useEffect, useRef, useState } from "react";

interface HalfCircularSliderProps {
    value: number;
    onChange: (value: number) => void;
    size?: number;
}

export default function HalfCircularSlider({ value, onChange, size = 160 }: HalfCircularSliderProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const strokeWidth = 2;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const arcLength = circumference / 2;

    const percentage = Math.max(0, Math.min(100, value)) / 100;
    const currentAngle = 90 - percentage * 180;
    const strokeDashoffset = circumference - percentage * arcLength;

    const updateValueFromCoords = (clientX: number, clientY: number) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = clientX - rect.left - center;
        const y = clientY - rect.top - center;

        let angleRad = Math.atan2(y, x);
        let angleDeg = angleRad * (180 / Math.PI);
        let nextPercentage = 0;

        if (x >= 0) {
            nextPercentage = (90 - angleDeg) / 180;
        } else {
            nextPercentage = y > 0 ? 0 : 1;
        }

        nextPercentage = Math.max(0, Math.min(1, nextPercentage));
        onChange(Math.round(nextPercentage * 100));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateValueFromCoords(e.clientX, e.clientY);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            updateValueFromCoords(e.clientX, e.clientY);
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    const handleX = center + radius * Math.cos((currentAngle * Math.PI) / 180);
    const handleY = center + radius * Math.sin((currentAngle * Math.PI) / 180);

    return (
        <div className="inset-0 flex select-none" style={{ position: 'absolute', pointerEvents: 'none', userSelect: 'none' }}>
            <svg
                ref={svgRef}
                width={size}
                height={size}
                onMouseDown={handleMouseDown}
                style={{ pointerEvents: 'none', overflow: 'visible', cursor: 'pointer' }}>

                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="#FFF"
                    strokeWidth={strokeWidth - 1}
                    strokeDasharray="5, 5"
                    strokeDashoffset={arcLength}
                    transform={`rotate(-90 ${center} ${center})`}
                    className="pointer-events-none" />

                <g transform={`translate(${center}, ${center}) scale(-1, 1) translate(${-center}, ${-center})`}>
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="#272727"
                        stroke="#3b3838"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={arcLength}
                        transform={`rotate(90 ${center} ${center})`}
                        strokeLinecap="round" style={{ pointerEvents: 'auto' }} />
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="#FFF"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform={`rotate(90 ${center} ${center})`}
                        strokeLinecap="round"
                        style={{ pointerEvents: 'auto' }} />
                </g>

                <circle
                    cx={handleX}
                    cy={handleY}
                    r={6}
                    fill="#cdd6f4"
                    className="shadow-md active:scale-150 transition-transform duration-75" style={{ pointerEvents: 'auto' }}
                />
            </svg>
        </div>
    );
}