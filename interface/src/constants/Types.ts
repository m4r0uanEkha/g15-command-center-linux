export type Effect = {
    title: string;
    icon: string;
};

export type RGBA = {
    r: number;
    g: number;
    b: number;
    a: number;
};

export type FansMetrics = {
    cpuSpeed: number;
    cpuTemperature: number;
    gpuSpeed: number;
    gpuTemperature: number;
}

export type RGBEffect = {
    effect: number;
    rgba1: RGBA;
    rgba2: RGBA;
    brightness: number;
    tempo: number;
    duration: number;
}