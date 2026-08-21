import { stockColors } from '../constants/Colors';
import { RGBA } from '../constants/Types';
import noneIcon from '../assets/none.svg';

interface ColorsProps {
    title: string;
    handleClick: (rgba: RGBA) => void;
};

const StockColors = ({ title, handleClick }: ColorsProps) => {

    const colorsElements = stockColors.map((c, i) => (
        <div key={`col_${i}`} className='flex color' style={{ backgroundColor: `rgb(${c.r}, ${c.g}, ${c.b})` }} onClick={() => handleClick(c)}>
            {i === stockColors.length - 1 && <img src={noneIcon} alt='none-icon' style={{ width: 18, height: 18 }} />}
        </div>
    ));

    return (
        <div className='flex column selector'>
            <p className='title'>{title}</p>
            <div className='colors'>
                {colorsElements}
            </div>
        </div>
    );
};

export default StockColors;