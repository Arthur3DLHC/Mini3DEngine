import { mat4 } from "gl-matrix";

export class RenderObject {
    // base class of all render objects
    public constructor() {
        this._children = [];
        this.localTransform = mat4.create();
        this.worldTransform = mat4.create();
    }

    // todo: transform matrix?
    public localTransform : mat4;
    public worldTransform : mat4;

    // todo: children management
    
    private _children : RenderObject[];
    public get Children() : RenderObject[] {
        return this._children;
    }

    public attachChild(child : RenderObject) {
        // todo: transform
    }
}