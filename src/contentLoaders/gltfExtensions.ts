// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md

export interface Spot {
    "innerConeAngle"?: number;
    "outerConeAngle"?: number;
}

export interface KHR_Light_Punctual {
    "name"?: string;
    "color"?: number[];
    "intensity"?: number;
    "type": "directional" | "point" | "spot" | string;
    "range"?: number;
    "spot"?: Spot;
    "extras"?: any;
}

export interface KHR_Lights_Punctual {
    "lights": KHR_Light_Punctual[];
}

export interface KHR_Node_Light_Punctual {
    "light": number;
}