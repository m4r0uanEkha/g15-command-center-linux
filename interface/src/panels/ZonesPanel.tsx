import '../styles/Zones.css';

import { zonesLabels } from '../constants/Zones';
import { RGBA, RGBEffect } from '../constants/Types';
import { rgbaToHex } from '@uiw/react-color';
import { centerLeftLayout, centerRightLayout, keysCenterLeft, keysCenterRight, keysLeft, keysRight, leftLayout, rightLayout } from '../constants/Keyboard';
import { useState } from 'react';

interface PanelProps {
    count: number;
    selectedZones: number[];
    setSelectedZones: React.Dispatch<React.SetStateAction<number[]>>;
    RGBConfig: Record<number, RGBEffect>;
}

function ZonesPanel({ count, selectedZones, setSelectedZones, RGBConfig }: PanelProps) {

    const zones = Array.from({ length: count }, (_, i) => zonesLabels[i]);

    const [hoveredZone, setHoveredZone] = useState<number>(-1);

    const layoutFillColor = (i: number) => {
        if (hoveredZone === i)
            return '#FFF';
        return RGBConfig[i] && rgbaToHex(RGBConfig[i].rgba1 as RGBA);
    };

    const clickOnZone = (i: number) => {
        if (i < 0) {
            if (selectedZones.length === zones.length) {
                setSelectedZones([]);
            } else {
                setSelectedZones(Array.from({ length: zones.length }, (_, i) => i));
            }
        } else {
            const result = selectedZones.includes(i);
            if (!result) {
                setSelectedZones(prevZones => [...prevZones, i]);
            } else {
                setSelectedZones(prevZones => prevZones.filter((p) => p !== i));
            }
        }
    };

    const zone = (index: number, text: string) => (
        <div key={`zone_${index}`} className='flex zone-selector' onClick={() => clickOnZone(index)}>
            <div style={{ backgroundColor: (selectedZones.includes(index) || selectedZones.length === count) ? '#FFF' : '' }}></div>
            <span>{text}</span>
            {
                index >= 0 && (
                    <div style={{ backgroundColor: selectedZones.includes(index) ? rgbaToHex(RGBConfig[index].rgba1 as RGBA) : 'black' }} />
                )
            }

            {
                index < 0 && (
                    <div style={{ backgroundColor: '', border: 'none' }} />
                )
            }
        </div>
    );

    return (
        <div className='flex column panel zones-container'>

            <div className='keyboard'>
                <svg width={862} height={300}>
                    <g transform='scale(0.57)'>
                        <path d={leftLayout} fill={layoutFillColor(0)} onMouseEnter={() => setHoveredZone(0)} onMouseLeave={() => setHoveredZone(-1)} />
                        <path d={centerLeftLayout} fill={layoutFillColor(1)} onMouseEnter={() => setHoveredZone(1)} onMouseLeave={() => setHoveredZone(-1)} />
                        <path d={centerRightLayout} fill={layoutFillColor(2)} onMouseEnter={() => setHoveredZone(2)} onMouseLeave={() => setHoveredZone(-1)} />
                        <path d={rightLayout} fill={layoutFillColor(3)} onMouseEnter={() => setHoveredZone(3)} onMouseLeave={() => setHoveredZone(-1)} />
                    </g>

                    <g transform='scale(0.287333333)'>
                        <path d={keysLeft} fill={layoutFillColor(0)} onMouseEnter={() => setHoveredZone(0)} onMouseLeave={() => setHoveredZone(-1)} />
                        <path d={keysCenterLeft} fill={layoutFillColor(1)} onMouseEnter={() => setHoveredZone(1)} onMouseLeave={() => setHoveredZone(-1)} />
                        <path d={keysCenterRight} fill={layoutFillColor(2)} onMouseEnter={() => setHoveredZone(2)} onMouseLeave={() => setHoveredZone(-1)} />
                        <path d={keysRight} fill={layoutFillColor(3)} onMouseEnter={() => setHoveredZone(3)} onMouseLeave={() => setHoveredZone(-1)} />
                    </g>
                </svg>
            </div>

            <div>Select a zone</div>

            <div className='flex' style={{ gap: 11 }}>
                {zone(-1, 'All')}
                {zones.map((z, i) => zone(i, z))}
            </div>

        </div>
    );
}

export default ZonesPanel;