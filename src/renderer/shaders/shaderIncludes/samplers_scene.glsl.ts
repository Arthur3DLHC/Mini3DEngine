/**
 * samplers per scene
 */
export default /** glsl */`
precision mediump sampler2DShadow;
precision mediump sampler2DArray;
precision mediump sampler3D;
// samplers
// debug shadow texture
// uniform sampler2D s_shadowAtlasStatic;
// uniform sampler2D s_shadowAtlas;
// uniform sampler2DShadow s_shadowAtlasStatic;
uniform sampler2DShadow s_shadowAtlas;
uniform sampler2D s_decalAtlas;
uniform sampler2DArray s_envMapArray;
uniform sampler2D s_specularDFG;
uniform sampler3D s_irrVolAtlas;
`;