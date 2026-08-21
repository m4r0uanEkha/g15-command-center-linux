import { Effect } from '../constants/Types';
import downArrow from '../assets/down.svg';

interface SelectorProps {
    title: string;
    effect: Effect;
    handleClick: () => void;
};

const Selector = ({ title, effect, handleClick }: SelectorProps) => {
    return (
        <div className='flex column selector'>
            <p className='title'>{title}</p>
            <div className='flex row' onClick={handleClick}>

                <img src={effect.icon} alt='effect-icon' style={{ width: 20, height: 20 }} />

                <span className='current-effect'>{effect.title}</span>

                <img src={downArrow} alt='down-arrow' style={{ width: 12, height: 12 }} />

            </div>
        </div>
    )
};

export default Selector;