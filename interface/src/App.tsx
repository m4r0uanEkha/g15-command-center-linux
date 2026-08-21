import { useEffect, useState } from 'react';

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

import LightsPanel from './panels/LightsPanel';
import PowerPanel from './panels/PowerPanel';
import ZonesPanel from './panels/ZonesPanel';

import './App.css';
import { FansMetrics, RGBA, RGBEffect } from './constants/Types';
import { effects } from './constants/Effects';
import { durations, tempos } from './constants/Timing';
import { ACTION_CONFIG_GET, ACTION_PROFILE_SET, ACTION_RGB_SET } from './constants/Actions';
import { rgbaToHex } from '@uiw/react-color';

import { getCurrentWindow } from "@tauri-apps/api/window";

import minIcon from './assets/dash.svg';
import resizeIcon from './assets/resize.svg';
import closeIcon from './assets/close.svg';

const initRGBConfig = (count: number) => Object.fromEntries(Array.from({ length: count }, (_, i) => [i, {
  effect: 0,
  rgba1: { r: 0, g: 0, b: 0, a: 1 },
  rgba2: { r: 0, g: 0, b: 0, a: 1 },
  brightness: 100,
  tempo: 1,       // min: 100 - max: 250
  duration: 1  // short 499 - med 1500 - long 2500
}]));

// const accentColor = (color: string) => /*parseInt(color.slice(1, color.length)) === 0 ? '#1F91D8' :*/ color;
const accentColor = (color: RGBA) => color.r < 30 && color.g < 30 && color.b < 30 ? { r: 31, g: 145, b: 216, a: 1 } : color;

function App() {

  const [zonesCount, setZonesCount] = useState<number>(0);

  const [profileData, setProfileData] = useState({ current: 'performance', choices: [] });

  const [fansMetrics, setFansMetrics] = useState<FansMetrics>(
    {
      cpuSpeed: 0,
      cpuTemperature: 0,
      gpuSpeed: 0,
      gpuTemperature: 0
    }
  );

  const [RGBConfig, setRGBConfig] = useState<Record<number, RGBEffect>>({});
  const [defaultRGBConfig, setDefaultRGBConfig] = useState<Record<number, RGBEffect>>({});

  const [selectedZones, setSelectedZones] = useState<number[]>([]);

  const [statusMessage, setStatusMessage] = useState<string>('');

  const setProfile = async (profile: string) => {
    setProfileData(prevState => ({ ...prevState, current: profile }));

    const payload = { action: ACTION_PROFILE_SET, profile: profile };

    try {
      await invoke('send_to_python', { payload });
    } catch (error) {
      console.error('Couldn\'t set platform profile:', error);
    }
  };

  const resetRGBConfig = () => {
    setSelectedZones([]);
    setRGBConfig(defaultRGBConfig);
  };

  const sendRGBConfig = async () => {

    const config: Record<number, {}> = {};

    Object.keys(RGBConfig).forEach(key => {

      const item = RGBConfig[Number(key)];

      console.log(item.tempo);

      config[Number(key)] = {
        effect: effects[item.effect].title,
        color1: Object.values(item.rgba1).slice(0, 3),
        color2: Object.values(item.rgba2).slice(0, 3),
        brightness: item.brightness,
        tempo: tempos[item.tempo].value,
        duration: durations[item.duration].value
      }
    });

    const payload = {
      action: ACTION_RGB_SET,
      config
    };

    console.log({ payload });

    try {
      await invoke('send_to_python', { payload });
      setDefaultRGBConfig(RGBConfig);
    } catch (error) {
      console.error('Couldn\'t set lighting effect:', error);
    }
  };

  const handleMinimize = async () => {
    try {
      const win = getCurrentWindow();
      await win.minimize();
    } catch (error) {

    }
  };

  const handleMaximize = async () => {
    try {
      const win = getCurrentWindow();
      const isMaximized = await win.isMaximized();

      if (!isMaximized)
        await win.maximize();
      else
        await win.unmaximize();
    } catch (error) {

    }
  };

  const handleClose = async () => {
    try {
      const win = getCurrentWindow();
      await win.close();
    } catch (error) {
      window.close();
    }
  };

  useEffect(() => {
    let unlisten: UnlistenFn;

    (async () => {
      unlisten = await listen('python-output', (event: any) => {
        try {
          const payload = JSON.parse(event.payload);

          if (payload.type === 'config') {
            const payloadZones = payload.zones;
            const payloadProfile = payload.profile;
            const payloadProfileChoices = payload['profile-choices'];
            const payloadRGBEffects = payload['rgb-effects'];

            setZonesCount(payloadZones);
            setProfileData({ current: payloadProfile, choices: payloadProfileChoices });

            if (Object.keys(payloadRGBEffects).length > 0) {
              const config: Record<number, RGBEffect> = {};

              Object.keys(payloadRGBEffects).forEach((key: string) => {
                const item = payloadRGBEffects[key];
                config[parseInt(key)] = {
                  effect: effects.findIndex(e => e.title === item.effect) ?? 0,
                  rgba1: { r: item.color1[0], g: item.color1[1], b: item.color1[2], a: 1 },
                  rgba2: { r: item.color2[0], g: item.color2[1], b: item.color2[2], a: 1 },
                  brightness: item.brightness,
                  tempo: tempos.find(i => i.value === item.tempo)?.index ?? 0,
                  duration: durations.find(i => i.value === item.duration)?.index ?? 0,
                };
              });
              setRGBConfig(config);
              setDefaultRGBConfig(config);
            } else {
              setRGBConfig(() => initRGBConfig(payloadZones));
              setDefaultRGBConfig(() => initRGBConfig(payloadZones));
            }
          }

          if (payload.type === 'metrics') {
            setFansMetrics(
              {
                cpuSpeed: payload.speed.CPU,
                gpuSpeed: payload.speed.GPU,
                cpuTemperature: payload.temperature.CPU,
                gpuTemperature: payload.temperature.GPU,
              }
            );
          }

          if (payload.type === 'status') {
            setStatusMessage(payload.details);
          }

        } catch (error) {
          console.error('Couldn\'t retrieve metrics:', error);
        }
      });

      try {
        await invoke('send_to_python', { payload: { action: 'GET_CONFIG' } });
      } catch (error) {
        console.error(`Couldn\'t send ${ACTION_CONFIG_GET} action:`, error);
      }

    })();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    if (statusMessage.length > 0)
      setTimeout(() => setStatusMessage(''), 2000);
  }, [statusMessage])

  return (
    <main className='app-container'>

      <div className='header'>
        <img src={minIcon} alt='close' width={15} height={15} onClick={handleMinimize} />
        <img src={resizeIcon} alt='close' width={15} height={15} onClick={handleMaximize} />
        <img src={closeIcon} alt='close' width={15} height={15} onClick={handleClose} />
      </div>

      <ZonesPanel count={zonesCount} selectedZones={selectedZones} setSelectedZones={setSelectedZones} RGBConfig={RGBConfig} />
      {RGBConfig[selectedZones.at(-1) ?? 0] && <PowerPanel profile={profileData.current} setProfile={setProfile} choices={profileData.choices} metrics={fansMetrics} accentColor={rgbaToHex(accentColor(RGBConfig[selectedZones.at(-1) ?? 0].rgba1))} />}
      <LightsPanel selectedZones={selectedZones} RGBConfig={RGBConfig} setRGBConfig={setRGBConfig} sendRGBConfig={sendRGBConfig} resetRGBConfig={resetRGBConfig} />

      {
        statusMessage && (
          <div className='status-container flex'>
            <div className='status panel'>{statusMessage}</div>
          </div>
        )
      }

    </main>
  );
}

export default App;