import { useState } from 'react';
import TempGauge from '../components/TempGauge';
import FanSpeedGauge from '../components/FanSpeedGauge';
import { profilesLabels } from '../constants/Profiles';

import '../styles/Power.css';
import { FansMetrics } from '../constants/Types';

interface PanelProps {
    metrics: FansMetrics;
    profile: string;
    setProfile: (p: string) => void;
    choices: string[];
    accentColor: string;
}

function PowerPanel({ metrics, profile, setProfile, choices, accentColor }: PanelProps) {

    const [canSelect, setCanSelect] = useState<boolean>(true);

    const selectProfile = (selected: string) => {
        if (canSelect && selected !== profile) {
            setCanSelect(false);

            setProfile(selected);

            setTimeout(() => {
                setCanSelect(true);
            }, 3000);
        }
    };

    return (
        <div className='flex column panel power-container'>

            {/* platform-profile choices */}
            <div className='profile-choices'>
                {choices.map((pc, i) => (
                    <div key={`profile_${i}`} className='flex column' style={{ gap: 5 }} onClick={() => selectProfile(pc)}>
                        <span className='profile-choice' style={{ color: `${pc === profile ? accentColor : '#FFF'}`, cursor: canSelect && pc !== profile ? 'pointer' : 'not-allowed' }}>{profilesLabels[pc]}</span>
                        <div style={{ width: '100%', height: 2, backgroundColor: accentColor, display: `${profile === pc ? 'inline' : 'none'}`, borderRadius: 5 }}></div>
                    </div>
                ))}
            </div>

            {/* CPU & GPU Sensors */}
            <div className='flex'>
                <TempGauge temp={metrics.cpuTemperature} max={100} hardware={'CPU'} accentColor={accentColor} />
                <FanSpeedGauge speed={metrics.cpuSpeed} hardware={'CPU'} accentColor={accentColor} />
                <TempGauge temp={metrics.gpuTemperature} max={100} hardware={'GPU'} accentColor={accentColor} />
                <FanSpeedGauge speed={metrics.gpuSpeed} hardware={'GPU'} accentColor={accentColor} />
            </div>
        </div>
    )
}

export default PowerPanel;