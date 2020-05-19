/**
 * uniform blocks per scene
 */
export default /** glsl */`
precision mediump sampler2DShadow;
precision lowp sampler2DArray;
precision lowp sampler3D;
// samplers
// debug shadow texture
uniform sampler2D s_shadowAtlasStatic;
uniform sampler2D s_shadowAtlasDynamic;
// uniform sampler2DShadow s_shadowAtlasStatic;
// uniform sampler2DShadow s_shadowAtlasDynamic;
uniform sampler2D s_decalAtlas;
uniform sampler2DArray s_envMapArray;
uniform sampler3D s_irrVolAtlas;
`;