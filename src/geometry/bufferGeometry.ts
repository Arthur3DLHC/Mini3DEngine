import { PrimitiveGroup } from "./primitiveGroup";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute";
import { VertexBuffer } from "../WebGLResources/vertexBuffer";
import { IndexBuffer } from "../WebGLResources/indexBuffer";

export class BufferGeometry {
    public constructor() {
        this.attributes = [];
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.groups = [];
    }

    // vertex attributes
    public attributes: VertexBufferAttribute[];

    // vbo
    public vertexBuffer: VertexBuffer | null;
    
    // ibo
    public indexBuffer: IndexBuffer | null;

    // groups
    public groups: PrimitiveGroup[];

    // todo: instanced?
    public destroy() {
        if (this.vertexBuffer) {
            this.vertexBuffer.release();
            this.vertexBuffer = null;
        }
        if (this.indexBuffer) {
            this.indexBuffer.release();
            this.indexBuffer = null;
        }
    }
}