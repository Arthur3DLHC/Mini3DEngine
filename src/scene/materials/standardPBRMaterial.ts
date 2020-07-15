import { Material } from "./material.js";
import { Texture } from "../../WebGLResources/textures/texture.js";
import vec4 from "../../../lib/tsm/vec4.js";
import vec3 from "../../../lib/tsm/vec3.js";

export class StandardPBRMaterial extends Material {
    public constructor() {
        super();
        this.color = new vec4([1.0,1.0,1.0,1.0]);
        this.emissive = new vec4([0.0,0.0,0.0,0.0]);
        // this.reflectivity = 0.5;
        this.roughness = 0.5;
        this.metallic = 0.0;

        this.subsurfaceColor = new vec3([1.0, 1.0, 1.0]);
        this.subsurface = 0.0;

        this.colorMap = null;
        this.metallicRoughnessMap = null;
        this.normalMap = null;
        this.occlusionMap = null;
        this.emissiveMap = null;

        // fix me: according to the specification of gltf file, the color value should multiply by colorMap in shader
        // this is different from 3ds max standard material
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