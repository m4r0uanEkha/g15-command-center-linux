import time
import logging
import os
import hid

log = logging.getLogger("rgb_hid")

ALIENWARE_VID = 0x187C
AW_ELC_PID = 0x0551

REPORT_SIZE = 33    
HID_REPORT_SIZE = REPORT_SIZE + 1

CMD_REPORT       = 0x20
CMD_USER_ANIM    = 0x21
CMD_POWER_ANIM   = 0x22
CMD_SELECT_ZONES = 0x23
CMD_ADD_ACTION   = 0x24
CMD_DIM          = 0x26
CMD_SET_COLOR    = 0x27
CMD_RESET        = 0x28
CMD_ERASE_FLASH  = 0xFF

REPORT_FIRMWARE  = 0x00
REPORT_STATUS    = 0x01
REPORT_CONFIG    = 0x02
REPORT_ANIMATION = 0x03

ANIM_NEW         = 0x0001
ANIM_FINISH_SAVE = 0x0002
ANIM_FINISH_PLAY = 0x0003
ANIM_REMOVE      = 0x0004
ANIM_PLAY        = 0x0005
ANIM_DEFAULT     = 0x0006
ANIM_STARTUP     = 0x0007

ANIM_SLOT_KEYBOARD = 0xFFFF

MODE_COLOR     = 0x00
MODE_PULSE     = 0x01
MODE_MORPH     = 0x02
MODE_SPECTRUM  = 0x03
MODE_RAINBOW   = 0x04
MODE_BREATHING = 0x05

TEMPO_MIN = 0x0064          #100
TEMPO_MAX = 0x00FA          #250
TEMPO_SPECTRUM = 0x000F     #015

DURATION_LONG = 0x09C4      #2500
DURATION_MED = 0x05DC       #1500
DURATION_SHORT = 0x01F3     #0499
DURATION_SPECTRUM = 0x01AC  #0428

RAINBOW_COLORS = [
    [(0xFF, 0x00, 0x00), (0xFF, 0xA5, 0x00), (0xFF, 0xFF, 0x00), (0x00, 0x80, 0x00),
     (0x00, 0xBF, 0xFF), (0x00, 0x00, 0xFF), (0x80, 0x00, 0x80)],
    [(0x80, 0x00, 0x80), (0xFF, 0x00, 0x00), (0xFF, 0xA5, 0x00), (0xFF, 0xFF, 0x00),
     (0x00, 0x80, 0x00), (0x00, 0xBF, 0xFF), (0x00, 0x00, 0xFF)],
    [(0x00, 0x00, 0xFF), (0x80, 0x00, 0x80), (0xFF, 0x00, 0x00), (0xFF, 0xA5, 0x00),
     (0xFF, 0xFF, 0x00), (0x00, 0x80, 0x00), (0x00, 0xBF, 0xFF)],
    [(0x00, 0xBF, 0xFF), (0x00, 0x00, 0xFF), (0x80, 0x00, 0x80), (0xFF, 0x00, 0x00),
     (0xFF, 0xA5, 0x00), (0xFF, 0xFF, 0x00), (0x00, 0x80, 0x00)],
]

PERIOD_DEFAULT = 2000

EFFECT_MODE_MAP = {"Color": MODE_COLOR, "Pulse": MODE_PULSE, "Morph": MODE_MORPH, "Breath": MODE_BREATHING, "Spectrum": MODE_SPECTRUM, "Rainbow": MODE_RAINBOW}

class RGBController:
    def __init__(self, vendor_id=ALIENWARE_VID, product_id=AW_ELC_PID):
        self.dev = hid.Device(vid=vendor_id, pid=product_id)
        self.platform_id = None
        self.firmware_version = None
        self.zone_count = None
        self._last_color = (255, 255, 255)

    def close(self):
        self.dev.close()

    def _send(self, buf: bytearray):
        assert len(buf) == HID_REPORT_SIZE
        self.dev.send_feature_report(bytes(buf))

        command = buf[2]
        subcommand = buf[3] if len(buf) > 3 else 0
        if command == CMD_USER_ANIM and subcommand in (ANIM_FINISH_PLAY, ANIM_FINISH_SAVE):
            time.sleep(1.0)
        else:
            time.sleep(0.06)

    def _recv(self) -> bytes:
        data = self.dev.get_feature_report(0x00, HID_REPORT_SIZE)
        buf = bytes(data)
        if len(buf) < HID_REPORT_SIZE:
            buf = buf + bytes(HID_REPORT_SIZE - len(buf))
        return buf

    def _new_buf(self) -> bytearray:
        buf = bytearray(HID_REPORT_SIZE)
        buf[0] = 0x00
        buf[1] = 0x03
        return buf

    def report(self, subcommand: int) -> bytes:
        buf = self._new_buf()
        buf[2] = CMD_REPORT
        buf[3] = subcommand
        self._send(buf)
        return self._recv()

    def dim(self, zones: list, percent: float) -> bool:
        if not zones:
            return True
        buf = self._new_buf()
        num_zones = len(zones)
        buf[2] = CMD_DIM
        buf[3] = int(percent) & 0xFF
        buf[4] = (num_zones >> 8) & 0xFF
        buf[5] = num_zones & 0xFF
        for i, z in enumerate(zones):
            buf[6 + i] = z
        self._send(buf)
        resp = self._recv()

        # print(f"DEBUG: Sent {bytes(buf)[:8]} -> received {resp[:8]}")

        return (resp[1] == 0x83) and (resp[2] == CMD_DIM)

    def user_animation(self, subcommand: int, animation: int, duration: int) -> bool:
        buf = self._new_buf()
        buf[2] = CMD_USER_ANIM
        buf[3] = (subcommand >> 8) & 0xFF
        buf[4] = subcommand & 0xFF
        buf[5] = (animation >> 8) & 0xFF
        buf[6] = animation & 0xFF
        buf[7] = (duration >> 8) & 0xFF
        buf[8] = duration & 0xFF
        self._send(buf)
        resp = self._recv()
        if resp[1] == 0:
            return False
        if subcommand == ANIM_FINISH_SAVE:
            return not resp[7]
        if subcommand == ANIM_FINISH_PLAY:
            return not resp[5]
        if subcommand == ANIM_PLAY:
            return not resp[7]
        return True

    def select_zones(self, zones: list) -> bool:
        if not zones:
            return False
        buf = self._new_buf()
        num_zones = len(zones)
        buf[2] = CMD_SELECT_ZONES
        buf[3] = 1
        buf[4] = (num_zones >> 8) & 0xFF
        buf[5] = num_zones & 0xFF
        for i, z in enumerate(zones):
            buf[6 + i] = z
        self._send(buf)
        resp = self._recv()

        # print(f"DEBUG: Sent {bytes(buf)[:8]} -> received {resp[:8]}")

        return (resp[1] == 0x83) and (resp[2] == CMD_SELECT_ZONES)

    def mode_action(self, modes: list, durations: list, tempos: list, colors: list) -> bool:
        amount = len(modes)
        if amount > 3:
            return False
        buf = self._new_buf()
        buf[2] = CMD_ADD_ACTION
        for i in range(amount):
            off = 3 + 8 * i
            buf[off] = modes[i]
            buf[off + 1] = (durations[i] >> 8) & 0xFF
            buf[off + 2] = durations[i] & 0xFF
            buf[off + 3] = (tempos[i] >> 8) & 0xFF
            buf[off + 4] = tempos[i] & 0xFF
            r, g, b = colors[i]
            buf[off + 5] = r
            buf[off + 6] = g
            buf[off + 7] = b
        self._send(buf)
        resp = self._recv()

        # print(f"DEBUG: Sent {bytes(buf)[:8]} -> received {resp[:8]}")

        return (resp[1] == 0x83) and (resp[2] == CMD_ADD_ACTION)

    def multi_mode_action(self, modes: list, durations: list, tempos: list, colors: list) -> bool:
        result = True
        # left = len(modes)
        #
        # current_modes = modes
        # current_durations = durations
        # current_tempos = tempos
        # current_colors = colors
        #
        # while left > 0 and result:
        #     tmp_amount = min(left, 3)
        #
        #     b_mode = current_modes[:tmp_amount]
        #     b_duration = current_durations[:tmp_amount]
        #     b_tempo = current_tempos[:tmp_amount]
        #     b_color = current_colors[:tmp_amount]
        #
        #     success = self.mode_action(b_mode, b_duration, b_tempo, b_color)
        #     result = result and success
        #
        #     current_modes = current_modes[tmp_amount:]
        #     current_durations = current_durations[tmp_amount:]
        #     current_tempos = current_tempos[tmp_amount:]
        #     current_colors = current_colors[tmp_amount:]
        #
        #     left -= tmp_amount

        i = 0
        while i < len(modes) and result:
            chunk = slice(i, i + 3)
            result = result and self.mode_action(
                modes[chunk], durations[chunk], tempos[chunk], colors[chunk]
            )
            i += 3
        return result

    def reset(self) -> bool:
        buf = self._new_buf()
        buf[2] = CMD_RESET
        self._send(buf)
        resp = self._recv()
        return resp[1] == 0x83

    def connect(self):

        config = self.report(REPORT_CONFIG)
        self.platform_id = (config[4] << 8) | config[5]
        self.zone_count = config[6]

        fw = self.report(REPORT_FIRMWARE)
        self.firmware_version = f"{fw[4]}.{fw[5]}.{fw[6]}"

        self._init_all_zones()

        log.info(
            "Connected: platform_id=0x%04X zone_count=%d firmware=%s",
            self.platform_id, self.zone_count, self.firmware_version,
        )
        return self.platform_id, self.zone_count, self.firmware_version

    def _init_all_zones(self):

        self.zones_effects = {
            i: {"mode": MODE_COLOR, "color1": (0, 0, 0), "color2": (0, 0, 0), "tempo": TEMPO_MAX, "duration": DURATION_MED} for i in range(self.zone_count)
        }

        self.zones_brightnesses = {
            i: 100 for i in range(self.zone_count)
        }

    def set_zone_effect(self, zone_idx: int, effect_name: str, color1=(255, 255, 255), color2=(0, 0, 0), tempo=TEMPO_MAX, duration=DURATION_MED):
        if effect_name not in EFFECT_MODE_MAP:
            raise ValueError(f"Unknown effect '{effect_name}', have {list(EFFECT_MODE_MAP)}")
        
        if not hasattr(self, "zones_effects"):
            self._init_all_zones()

        self.zones_effects[zone_idx] = {
            "mode": EFFECT_MODE_MAP[effect_name],
            "color1": color1,
            "color2": color2,
            "tempo": tempo,
            "duration": duration
        }

        self._last_color = color1

    def set_zone_brightness(self, zone_idx: int, brightness: int):
        if not (0 <= brightness <= 100):
            raise ValueError("brightness must be 0-100")
        
        if not (0 <= zone_idx < self.zone_count):
            raise ValueError("zone_idx must be 0-zone_count")
        
        self.zones_brightnesses[zone_idx] = brightness

    def commit_brightnesses(self):
        if not hasattr(self, "zones_brightnesses"):
            self._init_all_zones()

        groups:dict = {}
        for zone_idx, brightness in self.zones_brightnesses.items():
            groups.setdefault(brightness, []).append(zone_idx)

        for percent, zones in groups.items():
            if not self.dim(zones, 100 - percent):
                raise RuntimeError(f"dim() failed on zones {zones}")

    def commit_effects(self):
        if not hasattr(self, "zones_effects"):
            self._init_all_zones()

        if not self.user_animation(ANIM_NEW, ANIM_SLOT_KEYBOARD, 0):
            raise RuntimeError("user_animation(NEW) failed")
        
        for zone_idx, state in self.zones_effects.items():
            if not self.select_zones([zone_idx]):
                raise RuntimeError(f"select_zones([{zone_idx}]) failed")

            mode = state["mode"]
            color1 = state["color1"]
            color2 = state["color2"]
            tempo = state["tempo"]
            duration = state["duration"]

            if mode == MODE_COLOR:
                ok = self.mode_action([MODE_COLOR], [duration], [tempo], [color1])
            elif mode == MODE_PULSE:
                ok = self.mode_action([MODE_PULSE], [duration], [tempo], [color1])
            elif mode == MODE_MORPH:
                ok = self.mode_action(
                    [MODE_MORPH, MODE_MORPH], [duration, duration], [tempo, tempo], [color1, color2]
                )
            elif mode == MODE_BREATHING:
                ok = self.multi_mode_action(
                    [MODE_MORPH, MODE_MORPH], [duration, duration], [tempo, tempo], [color1, (0, 0, 0)]
                )
            elif mode == MODE_SPECTRUM:
                ok = self.multi_mode_action(
                    [MODE_MORPH] * 7, [duration] * 7, [tempo] * 7, RAINBOW_COLORS[0]
                )
            elif mode == MODE_RAINBOW:
                ok = self.multi_mode_action(
                    [MODE_MORPH] * 7, [duration] * 7, [tempo] * 7,
                    RAINBOW_COLORS[zone_idx % len(RAINBOW_COLORS)],
                )
            else:
                ok = False

            if not ok:
                raise RuntimeError(f"mode_action failed for zone {zone_idx} (mode {mode})")

        if not self.user_animation(ANIM_FINISH_PLAY, ANIM_SLOT_KEYBOARD, 0):
            raise RuntimeError("user_animation(FINISH_PLAY) failed")

    def apply_effect(self, zones: list, effect_name: str, color1=(255, 255, 255), color2=(0, 0, 0), tempo=TEMPO_MAX, duration=DURATION_MED):
        for zone_idx in zones:
            self.set_zone_effect(zone_idx, effect_name, color1, color2, tempo, duration)

        self.commit_effects()

    def apply_zones_config(self, config: dict):
        for zone_idx, cfg in config.items():
            self.set_zone_effect(
                zone_idx=zone_idx, 
                effect_name=cfg.get("effect", "Color"), 
                color1=tuple(cfg.get("color1", (255, 255, 255))), 
                color2=tuple(cfg.get("color2", (0, 0, 0))), 
                tempo=cfg.get("tempo", TEMPO_MIN), 
                duration=cfg.get("duration", DURATION_MED)
            )

            self.set_zone_brightness(
                zone_idx=zone_idx, 
                brightness=cfg.get("brightness", 100)
            )

        self.commit_effects()
        self.commit_brightnesses()
        
    def set_brightness(self, percent: int, zones: list = None):
        if not (0 <= percent <= 100):
            raise ValueError("brightness must be 0-100")

        if zones is None:
            zones = list(range(self.zone_count)) if self.zone_count else [0, 1, 2, 3]

        if not self.dim(zones, 100 - percent):
            raise RuntimeError("dim() failed")

if __name__ == "__main__":

    controller = RGBController(vendor_id=ALIENWARE_VID, product_id=AW_ELC_PID)
    print(controller.connect())
    
    controller.close()
