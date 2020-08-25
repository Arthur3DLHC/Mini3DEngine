import { Mesh } from "./mesh.js";
import mat4 from "../../lib/tsm/mat4.js";
import vec4 from "../../lib/tsm/vec4.js";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { Object3D } from "./object3D.js";
import { BoundingSphere } from "../math/boundingSphere.js";

export class InstancedMesh extends Mesh {
    public constructor(maxInstanceCount: number, hasColor: boolean, extraFloats: number, isStatic: boolean) {
        super();
        this.curInstanceCount = 0;
        this._maxInstanceCount = maxInstanceCount;
        this._tmpMatrix = new mat4();
        this._hasColor = hasColor;
        this._extraFloats = extraFloats;
        this._instFloatSize = 16;
        if (hasColor) {
            this._instFloatSize += 4;
        }
        this._instFloatSize += extraFloats;
        this._instanceData = new Float32Array(maxInstanceCount * this._instFloatSize);
        this._vertexBuffer = new VertexBuffer(isStatic? GLDevice.gl.STATIC_DRAW : GLDevice.gl.DYNAMIC_DRAW);
        this._attributes = [];

        // todo: create vertex attributes
        // mat4 a_instanceMatrix
        this._attributes.push(new VertexBufferAttribute("a_instanceMatrix", this._vertexBuffer, 4, GLDevice.gl.FLOAT, 0, 0, 1));
        this._attributes.push(new VertexBufferAttribute("a_instanceMatrix", this._vertexBuffer, 4, GLDevice.gl.FLOAT, 16, 1, 1));
        this._attributes.push(new VertexBufferAttribute("a_instanceMatrix", this._vertexBuffer, 4, GLDevice.gl.FLOAT, 32, 2, 1));
        this._attributes.push(new VertexBufferAttribute("a_instanceMatrix", this._vertexBuffer, 4, GLDevice.gl.FLOAT, 48, 3, 1));

        // vec4 a_instanceColor
        if (hasColor) {
            this._attributes.push(new VertexBufferAttribute("a_instanceColor", this._vertexBuffer, 4, GLDevice.gl.FLOAT, 64, 0, 1));
        }

        this._dirty = false;
    }
    private _instanceData: Float32Array;
    private _instFloatSize: number;
    private _maxInstanceCount: number;
    private _tmpMatrix: mat4;

    private _vertexBuffer: VertexBuffer;
    private _attributes: VertexBufferAttribute[];

    private _hasColor: boolean;
    private _extraFloats: number;
    private _dirty: boolean;

    public curInstanceCount: number;
    public get maxInstanceCount(): number {
        return this._maxInstanceCount;
    }
    public get instanceAttributes(): VertexBufferAttribute[] {return this._attributes;}

    public setMatrixOf(instanceIdx: number, matrix: mat4) {
        const start = instanceIdx * this._instFloatSize;
        for(let i = 0; i < 16; i++) this._instanceData[start + i] = matrix.values[i];
        this._dirty = true;
    }

    public setColorOf(instanceIdx: number, color: vec4) {
        if (this._hasColor) {
            const start = instanceIdx * this._instFloatSize + 16;
            for(let i = 0; i < 4; i++) this._instanceData[start + i] = color.values[i];
           this._dirty = true;
        }
    }

    /**
     * setExtraFloats
     */
    public setExtraFloats(instanceIdx: number, values: number[]) {
        if (this._extraFloats > 0) {
            let start = instanceIdx * this._instFloatSize + 16;
            if(this._hasColor) start += 4;
            for(let i = 0; i < this._extraFloats; i++) this._instanceData[start + i] = values[i];
            this._dirty = true;
        }
    }

    public updateInstanceVertexBuffer() {
        if (this._dirty) {
            // todo: copy the data to instance vertex buffer
            this._vertexBuffer.stride = this._instFloatSize * 4;
            this._vertexBuffer.data = this._instanceData;
            
            // update data of vertex buffer
            if (this._vertexBuffer.glBuffer === null) {
                this._vertexBuffer.create();
            } else {
                this._vertexBuffer.update();
            }

            // enlarge bounding sphere to contain all instances
            if (this.geometry && this.curInstanceCount > 0) {
                this.getInstanceMatrix(0, this._tmpMatrix);
                this.geometry.boundingSphere.transform(this._tmpMatrix, this._boundingSphere);

                const worldSphere = new BoundingSphere();
                for (let i = 1; i < this.curInstanceCount; i++) {
                    this.getInstanceMatrix(i, this._tmpMatrix);
                    this.geometry.boundingSphere.transform(this._tmpMatrix, worldSphere);
                    this._boundingSphere.enlarge(worldSphere);
                }
            }

            this._dirty = false;
        }
    }

    /**
     * the entire bounding sphere, in world space
     * will be updated when updating joint matrices
     */
    public get boundingSphere(): BoundingSphere {
        // contains all instances, in world space
        return this._boundingSphere;
    }

    public destroy(destroyChildren: boolean) {
        if (this._vertexBuffer !== undefined) {
            this._vertexBuffer.release();
        }
        super.destroy(destroyChildren);
    }

    // fix me: should update vertex buffer when providePrimitive?

    /**
     * update all instance matrices of static instanced meshes in the scene
     * this should only be called once after the scene has been built and updated for first time?
     * @param scene the scene contains instanced meshes
     */
    public static updateInstancedMeshes(obj: Object3D) {
        if (obj instanceof InstancedMesh) {
            const instMesh = obj as InstancedMesh;
            instMesh.updateInstanceVertexBuffer();
        }

        for (const child of obj.children) {
            InstancedMesh.updateInstancedMeshes(child);
        }
    }

    private getInstanceMatrix(index: number, dest: mat4) {
        const start = index * this._instFloatSize;
        for(let i = 0; i < 16; i++) dest.values[i] = this._instanceData[start + i];
    }
}