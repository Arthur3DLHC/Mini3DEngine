import { Material } from "./material.js";
import { vec4, vec3 } from "gl-matrix";
import { Texture } from "../../WebGLResources/textures/texture.js";

export class StandardPBRMaterial extends Material {
    public constructor() {
        super();
        this.color = vec4.fromValues(1.0,1.0,1.0,1.0);
        this.emissive = vec4.fromValues(0.0,0.0,0.0,0.0);
        // this.reflectivity = 0.5;
        this.roughness = 0.5;
        this.metallic = 0.0;

        this.subsurfaceColor = vec3.fromValues(1.0, 1.0, 1.0);
        this.subsurface = 0.0;

        this.colorMap = null;
        this.metallicRoughnessMap = null;
        this.normalMap = null;
        this.occlusionMap = null;
        this.emissiveMap = null;

        this.colorMapAmount = 0;
        this.metallicMapAmount = 0;
        this.roughnessMapAmount = 0;
        this.normalMapAmount = 0;
        this.occlusionMapAmount = 0;
        this.emissiveMapAmount = 0;
    }
    // no shader, just PBR params and textures

    public color: vec4;

    public emissive: vec4;

    // public reflectivity: number;

    public roughness: number;
    public metallic: number;

    public subsurfaceColor: vec3;
    public subsurface: number;

    public colorMap: Texture | null;
    // public reflectivityMap: Texture | null;
    public metallicRoughnessMap: Texture | null;
    public normalMap: Texture | null;
    public occlusionMap: Texture | null;
    public emissiveMap: Texture | null;

    public colorMapAmount: number;
    public metallicMapAmount: number;
    public roughnessMapAmount: number;
    public normalMapAmount: number;
    public occlusionMapAmount: number;
    public emissiveMapAmount: number;

    // 注意: 环境反射贴图是统一从 cluster 的 cubemap 列表里读取，不作为材质属性。
    // 区分是否是皮肤绑定模型，通过统一的参数传入，也不放在材质属性里？

    // TODO: 实现 PBR 材质 Shader 时，参考 https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-b-brdf-implementation

    // todo: load from json data?
}