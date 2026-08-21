import icon from '../assets/trian.svg';
import { RGBA } from '../constants/Types';

interface SpinnerProps {
    channel: keyof RGBA;
    value: number;
    handleUpButtonClick: () => void;
    handleDownButtonClick: () => void;
    handleValueChange: (i: keyof RGBA, v: string) => void;
};

const ColorSpinner = ({ channel, value, handleUpButtonClick, handleDownButtonClick, handleValueChange }: SpinnerProps) => {

    return (
        <div className='flex color-spinner'>

            <p className='flex'>{channel.toUpperCase()}</p> {/* R/G/B */}

            <input className='flex input' type='number' min={0} max={255} value={value} onChange={(e) => handleValueChange(channel, e.target.value)} />

            <div className='flex column buttons'>
                <div className='flex button up-arrow' onClick={handleUpButtonClick}>
                    <img src={icon} alt='up-button' width={11} height={11} />
                </div>
                <div className='flex button dw-arrow' onClick={handleDownButtonClick}>
                    <img src={icon} alt='up-button' width={11} height={11} style={{ transform: 'rotate(180deg)' }} />
                </div>
            </div>

        </div>
    );
};

export default ColorSpinner;