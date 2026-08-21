import { Effect } from '../constants/Types';

interface ListProps {
    all: boolean;
    effects: Effect[];
    handleClick: (n: number) => void;
};

const EffectsList = ({ all, effects, handleClick }: ListProps) => {

    const effectsElements = effects.map((e, i) => (
        <div
            key={`effect_${i}`}
            className='effect'
            onClick={() => handleClick(i)}
            style={i === effects.length - 1 ? { borderBottom: 'solid 1px #BDBDBD' } : {}}>
            <img src={e.icon} alt='effect-icon' />
            <div className='label'>
                {e.title}
            </div>
        </div>
    ));

    return (
        <div className='flex column effects-list'>
            {effectsElements.slice(0, all ? effects.length : -1)}
        </div>
    );
};

export default EffectsList;