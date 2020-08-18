import { Mesh } from "./mesh.js";
import mat4 from "../../lib/tsm/mat4.js";
import vec4 from "../../lib/tsm/vec4.js";

export class InstancedMesh extends Mesh {
    public constructor(instanceCount: number) {
        super();
        this._instanceData = new Float32Array(instanceCount * this._instFloatSize);
    }
    private _instanceData: Float32Array;
    private readonly _instFloatSize = 20;

    public setMatrixOf(instanceIdx: number, matrix: mat4) {
        
    }

    public setColorOf(instanceIdx: number, color: vec4) {
        
    }
}