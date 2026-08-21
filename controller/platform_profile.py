import os
import glob

PLATFORM_PROFILE_ROOT = "/sys/class/platform-profile"
ALIENWARE_WMI = "alienware-wmi"

def get_profile_path():
    for path in sorted(glob.glob(f"{PLATFORM_PROFILE_ROOT}/platform-profile-*")):
        name_file = os.path.join(path, "name")
        try:
            with open(name_file) as f:
                if f.read().strip() == ALIENWARE_WMI:
                    return path
        except OSError:
            continue

class PlatformProfile:

    def __init__(self):
        self.profile_path = get_profile_path()
        if not self.profile_path:
            raise RuntimeError("No alienware-wmi platform-profile device found")

    def get_profiles(self):
        if not self.profile_path:
            raise RuntimeError("No alienware-wmi platform-profile device found")
        with open(os.path.join(self.profile_path, "choices")) as f:
            return f.read().split()

    def get_current_profile(self):
        if not self.profile_path:
            raise RuntimeError("No alienware-wmi platform-profile device found")
        with open(os.path.join(self.profile_path, "profile")) as f:
            return f.read().strip()

    def set_profile(self, profile: str):
        if profile not in self.get_profiles():
            raise ValueError(f"'{profile}' not in available profiles")
        with open(os.path.join(self.profile_path, "profile"), "w") as f:
            f.write(profile)
        return True

# ['low-power', 'quiet', 'balanced', 'balanced-performance', 'performance', 'custom']
if __name__ == "__main__":

    pp = PlatformProfile()
    current_profile = pp.get_current_profile()
    target_profile = "balanced-performance"

    if not current_profile == target_profile:
        pp.set_profile(target_profile)
    else:
        print("Profile already set")
