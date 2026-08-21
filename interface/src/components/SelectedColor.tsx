import { RGBA } from '../constants/Types';
import noneIcon from '../assets/none.svg';

interface ColorProps {
    index: number;
    rgba: RGBA;
    handleClick: () => void;
};

const SelectedColor = ({ index, rgba, handleClick }: ColorProps) => {

    const styles = {
        backgroundColor: rgba.r === 0 && rgba.g === 0 && rgba.b === 0 ? '#2d2d2d' : `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`
    };

    return (
        <div className='flex selected-color'>
            <p>COLOUR {index}</p>
            <div className='flex' style={styles} onClick={handleClick}>
                {
                    rgba.r === 0 && rgba.g === 0 && rgba.b === 0 && (
                        <img src={noneIcon} alt={'no-color'} style={{ width: 50, height: 50, opacity: 0.3 }} />
                    )
                }
            </div>
        </div>
    );
};

export default SelectedColor;