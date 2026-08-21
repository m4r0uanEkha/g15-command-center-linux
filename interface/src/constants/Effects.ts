import { Effect } from './Types';

import iconMorph from '../assets/morph.svg';
import iconPulse from '../assets/pulse.svg';
import iconColor from '../assets/color.svg';
import iconBreat from '../assets/breat.svg';
import iconSpect from '../assets/spect.svg';
import iconRainb from '../assets/rainb.svg';

export const effects: Effect[] = [
    {
        title: 'Morph',
        icon: iconMorph,
    },
    {
        title: 'Pulse',
        icon: iconPulse,
    },
    {
        title: 'Color',
        icon: iconColor
    },
    {
        title: 'Breath',
        icon: iconBreat
    },
    {
        title: 'Spectrum',
        icon: iconSpect
    },
    // {
    //     key: 6,
    //     title: 'Spectre solide',
    //     icon: () => import('../assets/icon_spectre_solide.png'),
    //     icon_hovered: () => import('../assets/icon_spectre_solide_hovered.png'),
    // },
    {
        title: 'Rainbow',
        icon: iconRainb
    },
];