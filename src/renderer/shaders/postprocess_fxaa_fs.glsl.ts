/**
 * fxaa fragment shader
 * mostly from babylon.js
 * https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/fxaa.fragment.fx
 * with some modifications
 */
export default /** glsl */`
uniform sampler2D s_source;
uniform vec2 u_texelSize;

in vec2 ex_texcoord;
in vec2 ex_texcoordS;
in vec2 ex_texcoordE;
in vec2 ex_texcoordN;
in vec2 ex_texcoordW;
in vec2 ex_texcoordNW;
in vec2 ex_texcoordSE;
in vec2 ex_texcoordNE;
in vec2 ex_texcoordSW;

layout(location = 0) out vec4 o_color;

const float fxaaQualitySubpix = 1.0;
const float fxaaQualityEdgeThreshold = 0.166;
const float fxaaQualityEdgeThresholdMin = 0.0833;
const vec3 kLumaCoefficients = vec3(0.2126, 0.7152, 0.0722);
#define FxaaLuma(rgba) dot(rgba.rgb, kLumaCoefficients)

void main(void) {
	// o_color = texture(s_source, ex_texcoord);
	// o_color = vec4(1.0, 0.0, 0.0, 1.0);
	// return;

	vec2 posM;

	posM.x = ex_texcoord.x;
	posM.y = ex_texcoord.y;

	vec4 rgbyM = texture(s_source, ex_texcoord, 0.0);
	float lumaM = FxaaLuma(rgbyM);
	float lumaS = FxaaLuma(texture(s_source, ex_texcoordS, 0.0));
	float lumaE = FxaaLuma(texture(s_source, ex_texcoordE, 0.0));
	float lumaN = FxaaLuma(texture(s_source, ex_texcoordN, 0.0));
	float lumaW = FxaaLuma(texture(s_source, ex_texcoordW, 0.0));
	float maxSM = max(lumaS, lumaM);
	float minSM = min(lumaS, lumaM);
	float maxESM = max(lumaE, maxSM);
	float minESM = min(lumaE, minSM);
	float maxWN = max(lumaN, lumaW);
	float minWN = min(lumaN, lumaW);
	float rangeMax = max(maxWN, maxESM);
	float rangeMin = min(minWN, minESM);
	float rangeMaxScaled = rangeMax * fxaaQualityEdgeThreshold;
	float range = rangeMax - rangeMin;
	float rangeMaxClamped = max(fxaaQualityEdgeThresholdMin, rangeMaxScaled);

#ifndef MALI
	if(range < rangeMaxClamped) 
	{
		o_color = rgbyM;
		return;
	}
#endif

	float lumaNW = FxaaLuma(texture(s_source, ex_texcoordNW, 0.0));
	float lumaSE = FxaaLuma(texture(s_source, ex_texcoordSE, 0.0));
	float lumaNE = FxaaLuma(texture(s_source, ex_texcoordNE, 0.0));
	float lumaSW = FxaaLuma(texture(s_source, ex_texcoordSW, 0.0));
	float lumaNS = lumaN + lumaS;
	float lumaWE = lumaW + lumaE;
	float subpixRcpRange = 1.0 / range;
	float subpixNSWE = lumaNS + lumaWE;
	float edgeHorz1 = (-2.0 * lumaM) + lumaNS;
	float edgeVert1 = (-2.0 * lumaM) + lumaWE;
	float lumaNESE = lumaNE + lumaSE;
	float lumaNWNE = lumaNW + lumaNE;
	float edgeHorz2 = (-2.0 * lumaE) + lumaNESE;
	float edgeVert2 = (-2.0 * lumaN) + lumaNWNE;
	float lumaNWSW = lumaNW + lumaSW;
	float lumaSWSE = lumaSW + lumaSE;
	float edgeHorz4 = (abs(edgeHorz1) * 2.0) + abs(edgeHorz2);
	float edgeVert4 = (abs(edgeVert1) * 2.0) + abs(edgeVert2);
	float edgeHorz3 = (-2.0 * lumaW) + lumaNWSW;
	float edgeVert3 = (-2.0 * lumaS) + lumaSWSE;
	float edgeHorz = abs(edgeHorz3) + edgeHorz4;
	float edgeVert = abs(edgeVert3) + edgeVert4;
	float subpixNWSWNESE = lumaNWSW + lumaNESE;
	float lengthSign = u_texelSize.x;
	bool horzSpan = edgeHorz >= edgeVert;
	float subpixA = subpixNSWE * 2.0 + subpixNWSWNESE;

	if (!horzSpan)
	{
		lumaN = lumaW;
	}

	if (!horzSpan) 
	{
		lumaS = lumaE;
	}

	if (horzSpan) 
	{
		lengthSign = u_texelSize.y;
	}

	float subpixB = (subpixA * (1.0 / 12.0)) - lumaM;
	float gradientN = lumaN - lumaM;
	float gradientS = lumaS - lumaM;
	float lumaNN = lumaN + lumaM;
	float lumaSS = lumaS + lumaM;
	bool pairN = abs(gradientN) >= abs(gradientS);
	float gradient = max(abs(gradientN), abs(gradientS));

	if (pairN)
	{
		lengthSign = -lengthSign;
	}

	float subpixC = clamp(abs(subpixB) * subpixRcpRange, 0.0, 1.0);
	vec2 posB;

	posB.x = posM.x;
	posB.y = posM.y;

	vec2 offNP;

	offNP.x = (!horzSpan) ? 0.0 : u_texelSize.x;
	offNP.y = (horzSpan) ? 0.0 : u_texelSize.y;

	if (!horzSpan) 
	{
		posB.x += lengthSign * 0.5;
	}

	if (horzSpan)
	{
		posB.y += lengthSign * 0.5;
	}

	vec2 posN;

	posN.x = posB.x - offNP.x * 1.5;
	posN.y = posB.y - offNP.y * 1.5;

	vec2 posP;

	posP.x = posB.x + offNP.x * 1.5;
	posP.y = posB.y + offNP.y * 1.5;

	float subpixD = ((-2.0) * subpixC) + 3.0;
	float lumaEndN = FxaaLuma(texture(s_source, posN, 0.0));
	float subpixE = subpixC * subpixC;
	float lumaEndP = FxaaLuma(texture(s_source, posP, 0.0));

	if (!pairN) 
	{
		lumaNN = lumaSS;
	}

	float gradientScaled = gradient * 1.0 / 4.0;
	float lumaMM = lumaM - lumaNN * 0.5;
	float subpixF = subpixD * subpixE;
	bool lumaMLTZero = lumaMM < 0.0;

	lumaEndN -= lumaNN * 0.5;
	lumaEndP -= lumaNN * 0.5;

	bool doneN = abs(lumaEndN) >= gradientScaled;
	bool doneP = abs(lumaEndP) >= gradientScaled;

	if (!doneN) 
	{
		posN.x -= offNP.x * 3.0;
	}

	if (!doneN) 
	{
		posN.y -= offNP.y * 3.0;
	}

	bool doneNP = (!doneN) || (!doneP);

	if (!doneP) 
	{
		posP.x += offNP.x * 3.0;
	}

	if (!doneP)
	{
		posP.y += offNP.y * 3.0;
	}

	if (doneNP)
	{
		if (!doneN) lumaEndN = FxaaLuma(texture(s_source, posN.xy, 0.0));
		if (!doneP) lumaEndP = FxaaLuma(texture(s_source, posP.xy, 0.0));
		if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
		if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
	
		doneN = abs(lumaEndN) >= gradientScaled;
		doneP = abs(lumaEndP) >= gradientScaled;
	
		if (!doneN) posN.x -= offNP.x * 12.0;
		if (!doneN) posN.y -= offNP.y * 12.0;
	
		doneNP = (!doneN) || (!doneP);
	
		if (!doneP) posP.x += offNP.x * 12.0;
		if (!doneP) posP.y += offNP.y * 12.0;
	}

	float dstN = posM.x - posN.x;
	float dstP = posP.x - posM.x;

	if (!horzSpan)
	{
		dstN = posM.y - posN.y;
	}
	if (!horzSpan) 
	{
		dstP = posP.y - posM.y;
	}

	bool goodSpanN = (lumaEndN < 0.0) != lumaMLTZero;
	float spanLength = (dstP + dstN);
	bool goodSpanP = (lumaEndP < 0.0) != lumaMLTZero;
	float spanLengthRcp = 1.0 / spanLength;
	bool directionN = dstN < dstP;
	float dst = min(dstN, dstP);
	bool goodSpan = directionN ? goodSpanN : goodSpanP;
	float subpixG = subpixF * subpixF;
	float pixelOffset = (dst * (-spanLengthRcp)) + 0.5;
	float subpixH = subpixG * fxaaQualitySubpix;
	float pixelOffsetGood = goodSpan ? pixelOffset : 0.0;
	float pixelOffsetSubpix = max(pixelOffsetGood, subpixH);

	if (!horzSpan)
	{
		posM.x += pixelOffsetSubpix * lengthSign;
	}

	if (horzSpan)
	{
		posM.y += pixelOffsetSubpix * lengthSign;
	}

#ifdef MALI
	if(range < rangeMaxClamped) 
	{
		o_color = rgbyM;
	}
	else
	{
		o_color = texture(s_source, posM, 0.0);
	}
#else
	o_color = texture(s_source, posM, 0.0);
#endif
}

`;