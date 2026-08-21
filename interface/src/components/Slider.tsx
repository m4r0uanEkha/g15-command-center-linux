interface SliderProps {
    title: string;
    min: number;
    max: number;
    value: number;
    handleChange: (v: string) => void;
    ticks?: string[];
    isVisible: boolean;
    accentColor: string;
};

const Slider = ({ title, min, max, value, handleChange, ticks, isVisible, accentColor }: SliderProps) => {

    const ticksElements = ticks && ticks.map((t, i) => <p key={`slider_step_${i}`}>{t}</p>);

    return (
        <div className={isVisible ? 'flex selector' : 'invisible'}>
            {
                isVisible && (
                    <>
                        <p className='title'>{title}</p>
                        <input
                            className='slider'
                            type='range'
                            min={min}
                            max={max}
                            value={value}
                            onChange={(e) => handleChange(e.target.value)}
                            style={{ background: `linear-gradient(to right, ${accentColor} ${(value / max) * 100}%, #ccc ${(value / max) * 100}%)` }} />
                        {
                            ticks && (
                                <div className='ticks'>{ticksElements}</div>
                            )
                        }
                    </>
                )
            }
        </div>
    );
};

export default Slider;