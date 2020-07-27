/**
 * byte size table for WebGL component types
 */
export const COMPONENT_BYTE_SIZES: { [index: number]: number } = {
    5120: 1, //Int8Array,
    5121: 1, //Uint8Array,
    5122: 2, //Int16Array,
    5123: 2, //Uint16Array,
    5125: 4, //Uint32Array,
    5126: 4, //Float32Array,
};