import { Object3D } from "./object3D.js";
import { RenderItem } from "../renderer/renderItem.js";
import { Material } from "./materials/material.js";

export class Mesh extends Object3D {
    public constructor() {
        super();
        this.materials = [];
    }
    // todo: geometry? or hold vertex data, index data, vbo, ibo, and let geometries share reference them?
    // todo: material list
    public materials: Material[];

    public provideRenderItem(primitiveList: RenderItem[]) {
        // todo: add my primitives to list
    }
}