import { Texture } from "./texture.js";
import { GLDevice } from "../glDevice.js";
import mat4 from "../../../lib/tsm/mat4.js";

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

    public static glCubeFaceFromIndex(faceId: number): GLenum {
        return GLDevice.gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceId;
    }

    public static getFaceViewMatrix(faceId: number, result: mat4) {
        switch (faceId) {
            case this.face_positive_x:
                break;
            case this.face_negative_x:
                break;
            case this.face_positive_y:
                break;
            case this.face_negative_y:
                break;
            case this.face_positive_z:
                break;
            case this.face_negative_z:
                break;
            default:
                break;
        }
        throw new Error("Not implemented.")
    }
}