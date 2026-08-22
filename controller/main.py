import os
from pathlib import Path
import sys
import json
import time
import threading
from platform_profile import PlatformProfile
from rgb_controller import RGBController
from hwmon import Hwmon

ACTION_RGB_SET      =   "SET_RGB"
ACTION_CONFIG_GET   =   "GET_CONFIG"
ACTION_PROFILE_SET  =   "SET_PROFILE"

FX_CONFIG_FILE      =   "g15cc_config.json"
    
def save_config(config: dict, file: str = FX_CONFIG_FILE):
    try:
        with open(os.path.join(Path.home(), file), "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4)
    except Exception as e:
        print(json.dumps({"type": "status", "success": False, "details": f"{e}"}), flush=True)

def load_config(file: str = FX_CONFIG_FILE):
    if not os.path.exists(os.path.join(Path.home(), file)):
        return {}

    try:
        with open(os.path.join(Path.home(), file), "r", encoding="utf-8") as f:
            data = json.load(f)
            return {int(key): value for key, value in data.items()}

    except Exception as e:
        return {}

def hwmon_loop():
    while True:
        h = Hwmon()

        print(json.dumps({"type": "metrics", "speed": h.get_fan_percents(["CPU", "GPU"]), "temperature": h.get_temps()}), flush=True)

        time.sleep(1.0)

def main():

    hwmon_thread = threading.Thread(target=hwmon_loop, daemon=True)
    hwmon_thread.start()

    try:
        platform_profile = PlatformProfile()
        profile = platform_profile.get_current_profile()
        profile_choices = platform_profile.get_profiles()
    except Exception as e:
        print(json.dumps({"type": "status", "success": False, "details": f"Cannot get platform-profile info {e}"}), flush=True)

    try:
        rgb_controller = RGBController()
        platform_id, zone_count, firmware_version = rgb_controller.connect()
    except Exception as e:
        print(json.dumps({"type": "status", "success": False, "details": f"Cannot connect to hid {e}"}), flush=True)

    try:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue

            try:
                command = json.loads(line)
                action = command.get("action")

                if action == ACTION_CONFIG_GET:
                    rgb_config = load_config()
                    print(json.dumps({"type": "config", "zones": zone_count, "profile": profile, "profile-choices": profile_choices, "rgb-effects": rgb_config}), flush=True)

                    try:
                        rgb_controller.apply_zones_config(rgb_config)
                    except:
                        pass

                elif action == ACTION_RGB_SET:
                    config = {int(key): value for key, value in command.get("config", {}).items()}
                    rgb_controller.apply_zones_config(config)
                    print(json.dumps({"type": "status", "success": True, "details": "Correctly set rgb effects"}), flush=True)

                    try:
                        save_config(config)
                    except:
                        pass

                elif action == ACTION_PROFILE_SET:
                    current_profile = platform_profile.get_current_profile()
                    target_profile = command.get("profile")

                    if target_profile:
                        if not target_profile == current_profile:
                            platform_profile.set_profile(target_profile)
                            print(json.dumps({"type": "status", "success": True, "details": f"Correctly set platform profile to {target_profile}"}), flush=True)
                        else:
                            print(json.dumps({"type": "status", "success": True, "details": f"Platform profile altready set to {current_profile}"}), flush=True)

            except Exception as e:
                print(json.dumps({"type": "status", "success": False, "details": f"{e}"}), flush=True)

    except KeyboardInterrupt:
        pass
    finally:
        rgb_controller.close()

if __name__ == "__main__":
    main()
