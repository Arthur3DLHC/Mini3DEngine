import { Object3D } from "./object3D.js";
import { RenderPrimitive } from "../renderer/renderPrimitive.js";

export class Mesh extends Object3D {
    // todo: geometry? or hold vertex data, index data, vbo, ibo, and let geometries share reference them?
    // todo: materials

    public providePrimitive(primitiveList: RenderPrimitive[]) {
        // todo: add my primitives to list
    }
}