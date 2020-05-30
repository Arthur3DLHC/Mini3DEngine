import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import mat4 from "../../lib/tsm/mat4.js";
import vec4 from "../../lib/tsm/vec4.js";

/**
 * base class for geometry instances
 * used in instancing drawing
 */
export class GeometryInstances {
    public constructor() {
    }

    public static readonly defaultNameTransform = "a_instanceTransform";
    public static readonly defaultNameColor = "a_instanceColor";

    public attributes: VertexBufferAttribute[] = [];

    public instanceBuffer: VertexBuffer | null = null;

    public needUpdate: boolean = true;

    public transforms: mat4[] = [];
    public colors: vec4[] = [];

    public isStatic: boolean = true;

    public create() {
        // implement default creation logic for transform and color attributes
        // sub class can override this.
    }

    public updateBuffer() {
        // sub class can override this.
        // check need resize the vertex buffer?
    }
}