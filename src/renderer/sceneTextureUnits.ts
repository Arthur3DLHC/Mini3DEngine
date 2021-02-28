/**
 * preserved scene texture units
 * these textures will be setted at these units at beginning of every frame and keep not modified.
 * so you can set sampler uniforms as these values if these textures is needed in some shader
 */
export enum SceneTextureUnits {
    shadowmapAtlas = 1,
    decalAtlas = 2,
    envMapArray = 3,
    specularDFG = 4,
    irradianceProbeArray = 5,
    count = 6,
}