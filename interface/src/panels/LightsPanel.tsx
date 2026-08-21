import { useState } from 'react';
import Selector from '../components/Selector';
import ColorSpinner from '../components/ColorSpinner';
import SelectedColor from '../components/SelectedColor';
import Slider from '../components/Slider';
import { RGBA, RGBEffect } from '../constants/Types';
import StockColors from '../components/StockColors';
import { Wheel, rgbaToHsva, hsvaToRgba, rgbaToHex, HsvaColor } from '@uiw/react-color';
import EffectsList from '../components/EffectsList';
import { effects } from '../constants/Effects';

import '../styles/Lights.css';

import cancelIcon from '../assets/close.svg';
import checkIcon from '../assets/check.svg';
import HalfCircularSlider from '../components/HalfCircularSlider';

interface PanelProps {
  selectedZones: number[];
  RGBConfig: Record<number, RGBEffect>;
  setRGBConfig: React.Dispatch<React.SetStateAction<Record<number, RGBEffect>>>;
  sendRGBConfig: () => void;
  resetRGBConfig: () => void;
}

const accentColor = (color: RGBA) => color.r < 30 && color.g < 30 && color.b < 30 ? { r: 31, g: 145, b: 216, a: 1 } : color;

function LightsPanel({ selectedZones, RGBConfig, setRGBConfig, sendRGBConfig, resetRGBConfig }: PanelProps) {

  const [currentColorIndex, setCurrentColorIndex] = useState<1 | 2>(1);

  const [lightValues, setLightValues] = useState({ v1: 100, v2: 100 });

  const [showEffectList, setShowEffectList] = useState(false);

  const [isSaveBtnHovered, setIsSaveBtnHovered] = useState(false);

  const updateRGBConfig = (propertyName: keyof RGBEffect, newValue: any) => {
    setRGBConfig(prevConfig => ({
      ...prevConfig,
      ...selectedZones.sort((a, b) => a - b).reduce((acc, index) => (
        {
          ...acc,
          [index]: {
            ...prevConfig[index],
            [propertyName]: typeof newValue === 'function' ? newValue(prevConfig[index][propertyName]) : newValue
          }
        }), {})
    }));
  };

  const updateChannelValue = (i: keyof RGBA, v: string) => {
    if (v === '')
      updateRGBConfig(`rgba${currentColorIndex}`, (prevRGBA: RGBA) => ({ ...prevRGBA, [i]: 0 }));
    else {
      if (parseInt(v) >= 0 && parseInt(v) <= 255)
        updateRGBConfig(`rgba${currentColorIndex}`, (prevRGBA: RGBA) => ({ ...prevRGBA, [i]: parseInt(v) }));
    }
  };

  const increaseChannelValue = (i: keyof RGBA) => {
    updateRGBConfig(`rgba${currentColorIndex}`, (prevRGBA: RGBA) => prevRGBA[i] < 255 ? { ...prevRGBA, [i]: prevRGBA[i] + 1 } : prevRGBA);
  };

  const decreaseChannelValue = (i: keyof RGBA) => {
    updateRGBConfig(`rgba${currentColorIndex}`, (prevRGBA: RGBA) => prevRGBA[i] > 0 ? { ...prevRGBA, [i]: prevRGBA[i] - 1 } : prevRGBA);
  };

  const pickStockColor = (rgba: RGBA) => {
    setLightValues(prevValues => ({ ...prevValues, [`v${currentColorIndex}`]: rgbaToHsva({ r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a }).v }));
    updateRGBConfig(`rgba${currentColorIndex}`, { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a });
  };

  const pickWheelColor = (hsva: HsvaColor) => {
    updateRGBConfig(`rgba${currentColorIndex}`, (prevRGBA: RGBA) => ({ ...prevRGBA, ...hsvaToRgba({ ...hsva, v: lightValues[`v${currentColorIndex}`] }) }));
  };

  const toggleEffectsMenu = () => {
    setShowEffectList(prevState => !prevState);
  };

  const selectEffect = (effect: number) => {
    setRGBConfig(prevConfig => ({
      ...prevConfig,
      ...selectedZones.sort((a, b) => a - b).reduce((acc, index) => (
        {
          ...acc,
          [index]: {
            ...prevConfig[index],
            effect: effect,
            rgba1: prevConfig[0].rgba1
          }
        }), {})
    }));

    if (effect > 0 && effect < 4) setCurrentColorIndex(1);

    toggleEffectsMenu();
  };

  const updateColorLightValue = (v: any) => {
    setLightValues(prevValues => ({ ...prevValues, [`v${currentColorIndex}`]: v }));
    updateRGBConfig(`rgba${currentColorIndex}`, (prevRGBA: RGBA) => ({ ...hsvaToRgba({ ...rgbaToHsva(prevRGBA), v }) }));
  };

  return (
    <div className='light-panel'>
      <div className='light-container'>

        <div className='flex column effects-container'>

          {
            selectedZones.length > 0 && (
              <Selector title={'LIGHTING EFFECT'} effect={effects[RGBConfig[selectedZones.at(-1) ?? 0].effect]} handleClick={toggleEffectsMenu} />
            )
          }
          {
            showEffectList && (
              <EffectsList all={selectedZones.length === Object.keys(RGBConfig).length} effects={effects} handleClick={(e) => selectEffect(e)} />
            )
          }
        </div>

        {
          selectedZones.length > 0 && (
            <>
              {
                RGBConfig[selectedZones.at(-1) ?? 0].effect < 4 &&
                <section className='flex color-selection-section'>

                  {/* Wheel + Slider */}
                  <div className='flex column color-gui'>

                    <HalfCircularSlider value={currentColorIndex === 1 ? lightValues.v1 : lightValues.v2} onChange={(e) => updateColorLightValue(e)} />

                    <div className='color-wheel'>
                      {currentColorIndex === 1 && <Wheel width={130} height={130} color={{ ...rgbaToHsva(RGBConfig[selectedZones.at(-1) ?? 0].rgba1), v: lightValues.v1 }} onChange={(color) => pickWheelColor(color.hsva)} />}
                      {currentColorIndex === 2 && <Wheel width={130} height={130} color={{ ...rgbaToHsva(RGBConfig[selectedZones.at(-1) ?? 0].rgba2), v: lightValues.v2 }} onChange={(color) => pickWheelColor(color.hsva)} />}
                    </div>

                  </div>

                  <div className='flex color-spiners'>

                    <div className='tilted-borders'>
                      <div className='tilted-border tilted-border-top'></div>
                      <div className='tilted-border tilted-border-bottom'></div>
                    </div>

                    <div className='color-borders-middle'></div>

                    <section className='color-spiners-items'>
                      <div className='color-border-top'></div>
                      <ColorSpinner channel={'r'} value={currentColorIndex === 1 ? RGBConfig[selectedZones.at(-1) ?? 0].rgba1.r : RGBConfig[selectedZones.at(-1) ?? 0].rgba2.r} handleUpButtonClick={() => increaseChannelValue('r')} handleDownButtonClick={() => decreaseChannelValue('r')} handleValueChange={updateChannelValue} />
                      <ColorSpinner channel={'g'} value={currentColorIndex === 1 ? RGBConfig[selectedZones.at(-1) ?? 0].rgba1.g : RGBConfig[selectedZones.at(-1) ?? 0].rgba2.g} handleUpButtonClick={() => increaseChannelValue('g')} handleDownButtonClick={() => decreaseChannelValue('g')} handleValueChange={updateChannelValue} />
                      <ColorSpinner channel={'b'} value={currentColorIndex === 1 ? RGBConfig[selectedZones.at(-1) ?? 0].rgba1.b : RGBConfig[selectedZones.at(-1) ?? 0].rgba2.b} handleUpButtonClick={() => increaseChannelValue('b')} handleDownButtonClick={() => decreaseChannelValue('b')} handleValueChange={updateChannelValue} />
                      <div className='color-border-bottom'></div>
                    </section>

                  </div>

                  <div className='selected-colors'>
                    <SelectedColor index={1} rgba={RGBConfig[selectedZones.at(-1) ?? 0].rgba1} handleClick={() => setCurrentColorIndex(1)} />
                    {
                      (RGBConfig[selectedZones.at(-1) ?? 0].effect < 1 || RGBConfig[selectedZones.at(-1) ?? 0].effect > 3) && (
                        <SelectedColor index={2} rgba={RGBConfig[selectedZones.at(-1) ?? 0].rgba2} handleClick={() => setCurrentColorIndex(2)} />
                      )
                    }
                  </div>

                </section>
              }

              {
                RGBConfig[selectedZones.at(-1) ?? 0].effect < 4 && (
                  <StockColors title={'PRESET COLORS'} handleClick={pickStockColor} />
                )
              }

              <Slider title={'BRIGHTNESS'} min={0} max={100} value={RGBConfig[selectedZones.at(-1) ?? 0].brightness} handleChange={(b) => updateRGBConfig('brightness', parseInt(b))} isVisible={true} accentColor={rgbaToHex(accentColor(RGBConfig[selectedZones.at(-1) ?? 0].rgba1))} />
              <div className='flex-row'>

                <Slider title={'TEMPO'} min={0} max={1} value={RGBConfig[selectedZones.at(-1) ?? 0].tempo} handleChange={(t) => updateRGBConfig('tempo', parseInt(t))} ticks={['SLOW', 'FAST']} isVisible={RGBConfig[selectedZones.at(-1) ?? 0].effect < 2} accentColor={rgbaToHex(accentColor(RGBConfig[selectedZones.at(-1) ?? 0].rgba1))} />
                <Slider title={'DURATION'} min={0} max={2} value={RGBConfig[selectedZones.at(-1) ?? 0].duration} handleChange={(d) => updateRGBConfig('duration', parseInt(d))} ticks={['LOW', 'MEDIUM', 'HIGH']} isVisible={RGBConfig[selectedZones.at(-1) ?? 0].effect !== 1 && RGBConfig[selectedZones.at(-1) ?? 0].effect !== 2} accentColor={rgbaToHex(accentColor(RGBConfig[selectedZones.at(-1) ?? 0].rgba1))} />

              </div>

              <div className='action-buttons'>

                <div className='flex button secondary' onClick={resetRGBConfig}>
                  <img src={cancelIcon} alt={'cancel'} style={{ width: 15, height: 15 }} />
                  <span>CANCEL</span>
                </div>

                <div className='flex button primary' onMouseEnter={() => setIsSaveBtnHovered(true)} onMouseLeave={() => setIsSaveBtnHovered(false)} onClick={sendRGBConfig} style={{ backgroundColor: !isSaveBtnHovered ? rgbaToHex(accentColor(RGBConfig[selectedZones.at(-1) ?? 0].rgba1)) : '#ffffff7f' }}>
                  <img src={checkIcon} alt={'save'} style={{ width: 15, height: 15 }} />
                  <span>SAVE</span>
                </div>

              </div>
            </>
          )
        }
      </div>
    </div>
  );
}

export default LightsPanel;