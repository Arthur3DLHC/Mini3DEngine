import { Material } from "./material.js";
import { vec4 } from "gl-matrix";
import { Texture } from "../../WebGLResources/texture.js";

export class StandardPBRMaterial extends Material {
    public constructor() {
        super();
        this.color = vec4.fromValues(1,1,1,1);
        this.emissive = vec4.fromValues(1,1,1,1);
        // this.reflectivity = 0.5;
        this.roughness = 0.5;
        this.metallic = 0.0;

        this.colorMap = null;
        this.metallicRoughnessMap = null;
        this.normalMap = null;
        this.occlusionMap = null;
        this.emissiveMap = null;
    }
    // no shader, just PBR params and textures
    /**
     * 基础色
     */
    public color: vec4;

    public emissive: vec4;

    /**
     * 反射率。取值范围: 0~1，默认值：0.5。应该根据各种材料实际值设置；最小0.04
     */
    // public reflectivity: number;
    /**
     * 粗糙度
     */
    public roughness: number;
    /**
     * 金属度
     */
    public metallic: number;

    public colorMap: Texture | null;
    // public reflectivityMap: Texture | null;
    public metallicRoughnessMap: Texture | null;
    public normalMap: Texture | null;
    public occlusionMap: Texture | null;
    public emissiveMap: Texture | null;

    // 注意: 环境反射贴图是统一从 cluster 的 cubemap 列表里读取，不作为材质属性。
    // 区分是否是皮肤模型，通过统一的参数传入，也不放在材质属性里？
    // TODO: subsurface scattering 参数，是否放在这种材质里？还是单独写一种材质？

    // todo: load from json data?
}