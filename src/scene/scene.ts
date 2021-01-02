import { Object3D } from "./object3D.js";
import vec4 from "../../lib/tsm/vec4.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { TextureCube } from "../WebGLResources/textures/textureCube.js";
import { SkinMesh } from "./skinMesh.js";

export class Scene extends Object3D {
    // todo: skybox?
    public background: vec4 | Texture2D | TextureCube | null = null;
    /**
     * the background intensity when rendering main view
     */
    public backgroundIntensity: number = 1;
    /**
     * the background intensity when baking irradiance probes
     */
    public irradianceIntensity: number = 1;

    /**
     * general update function
     */
    public update() {
        this.updateBehavior();
        
        // BaseConstraint.updateList.length = 0;
        this.updateLocalTransform(false, true);
        // BaseConstraint.updateConstraints();

        // BaseConstraint.updateList.length = 0;
        this.updateWorldTransform(false, true);
        // BaseConstraint.updateConstraints();

        SkinMesh.updateSkinMeshes(this);
    }
}