import { Texture } from "./texture.js";
import { GLDevice } from "../glDevice.js";
import mat4 from "../../../lib/tsm/mat4.js";
import vec3 from "../../../lib/tsm/vec3.js";

export class TextureCube extends Texture {
    public constructor() {
        super();
    }

    public get target(): GLenum {
        return GLDevice.gl.TEXTURE_CUBE_MAP;
    }

    /**
     * get the proper sampler type for this texture
     */
    public get samplerType(): GLenum {
        // depth textures should use shadow sampler
        if (this.format === GLDevice.gl.DEPTH_COMPONENT || this.format === GLDevice.gl.DEPTH_STENCIL) {
            return GLDevice.gl.SAMPLER_CUBE_SHADOW;
        } else {
            return GLDevice.gl.SAMPLER_CUBE;
        }
    }

    // todo: source，长图的形式？

    public create() {
        // create gl texture
        // initialize tex by gl.TexImageCube
        throw new Error("Not implemented.");
    }
    public upload() {
        throw new Error("Not implemented.");
    }

    // todo: define cube face ids
    public static readonly face_positive_x = 0;
    public static readonly face_negative_x = 1;
    public static readonly face_positive_y = 2;
    public static readonly face_negative_y = 3;
    public static readonly face_positive_z = 4;
    public static readonly face_negative_z = 5;

    public static readonly face_view_matrices: mat4[] = [
        // +x, -x
        mat4.lookAt(vec3.zero, new vec3([1, 0, 0]), new vec3([0, 1, 0])), mat4.lookAt(vec3.zero, new vec3([-1, 0, 0]), new vec3([0, 1, 0])),
        // +y, -y
        mat4.lookAt(vec3.zero, new vec3([0, 1, 0]), new vec3([0, 0, 1])), mat4.lookAt(vec3.zero, new vec3([0, -1, 0]), new vec3([0, 0, -1])),
        // +z, -z
        mat4.lookAt(vec3.zero, new vec3([0, 0, 1]), new vec3([0, 1, 0])), mat4.lookAt(vec3.zero, new vec3([0, 0, -1]), new vec3([0, 1, 0])),
    ];

    public static glCubeFaceFromIndex(faceId: number): GLenum {
        return GLDevice.gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceId;
    }

    public static getFaceViewMatrix(faceId: number): mat4 {
        return this.face_view_matrices[faceId];
    }

    public static debugOuputAxes() {
        // todo: output vectors in cubemap face view spaces
        const v = new vec3([1, 2, 3]);  // 1, 2, 3 to distinguish x, y, z
        const vv = new vec3();
        TextureCube.getFaceViewMatrix(TextureCube.face_positive_x).multiplyVec3(v, vv);
        console.log("+X: " + vv.x + ", " + vv.y + ", " + vv.z);
        TextureCube.getFaceViewMatrix(TextureCube.face_negative_x).multiplyVec3(v, vv);
        console.log("-X: " + vv.x + ", " + vv.y + ", " + vv.z);
        TextureCube.getFaceViewMatrix(TextureCube.face_positive_y).multiplyVec3(v, vv);
        console.log("+Y: " + vv.x + ", " + vv.y + ", " + vv.z);
        TextureCube.getFaceViewMatrix(TextureCube.face_negative_y).multiplyVec3(v, vv);
        console.log("-Y: " + vv.x + ", " + vv.y + ", " + vv.z);
        TextureCube.getFaceViewMatrix(TextureCube.face_positive_z).multiplyVec3(v, vv);
        console.log("+Z: " + vv.x + ", " + vv.y + ", " + vv.z);
        TextureCube.getFaceViewMatrix(TextureCube.face_negative_z).multiplyVec3(v, vv);
        console.log("-Z: " + vv.x + ", " + vv.y + ", " + vv.z);
    }
}