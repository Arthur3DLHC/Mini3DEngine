import { PrimitiveGroup } from "./primitiveGroup";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute";

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
    public vertexBuffer: WebGLBuffer | null;
    
    // ibo
    public indexBuffer: WebGLBuffer | null;

    // groups
    public groups: PrimitiveGroup[];

    // todo: instanced?
}