import os
import glob

HWMON_ROOT = "/sys/class/hwmon"
ALIENWARE_WMI = "alienware_wmi"

def get_hwmon_path():
    for path in sorted(glob.glob(f"{HWMON_ROOT}/hwmon*")):
        name_file = os.path.join(path, "name")
        try:
            with open(name_file) as f:
                if f.read().strip() == ALIENWARE_WMI:
                    return path
        except OSError:
            continue

class Hwmon:

    def __init__(self):
        self.hwmon_path = get_hwmon_path()
        if not self.hwmon_path:
            raise RuntimeError("No alienware hwmon device found")

    def get_fan_rpms(self):
        result = {}

        if not self.hwmon_path:
            return result

        for fan_input in sorted(glob.glob(os.path.join(self.hwmon_path, "fan*_input"))):

            label = os.path.basename(fan_input).replace("_input", "")

            try:
                with open(fan_input, "r") as f:
                    result[label] = int(f.read().strip())
            except (OSError, ValueError):
                continue
        return result

    def get_fan_maxes(self):
        result = {}

        if not self.hwmon_path:
            return result

        for fan_max in sorted(glob.glob(os.path.join(self.hwmon_path, "fan*_max"))):

            label = os.path.basename(fan_max).replace("_max", "")

            try:
                with open(fan_max, "r") as f:
                    result[label] = int(f.read().strip())
            except (OSError, ValueError):
                continue
        return result

    def get_fan_percents(self, labels=None):
        result = {}

        rpms = self.get_fan_rpms()
        maxes = self.get_fan_maxes()

        for index, label in enumerate(rpms):
            if labels and len(labels) == len(rpms):
                result[labels[index]] = round(min(rpms[label] / maxes[label], 1.0) * 100)
            else:
                result[label] = round(min(rpms[label] / maxes[label], 1.0) * 100)

        return result

    def get_temps(self):
        result = {}
        if not self.hwmon_path:
            return result
        for temp_input in sorted(glob.glob(os.path.join(self.hwmon_path, "temp*_input"))):

            label_file = temp_input.replace("_input", "_label")

            key = os.path.basename(temp_input).replace("_input", "")

            try:
                with open(label_file) as f:
                    key = f.read().strip() or key
            except OSError:
                pass
            try:
                with open(temp_input) as f:
                    millidegrees = int(f.read().strip())
                    result[key] = round(millidegrees / 1000)
            except (OSError, ValueError):
                continue
        return result


if __name__ == "__main__":

    h = Hwmon()
    print(h.get_fan_percents(["CPU", "GPU"]))
    print(h.get_temps())
