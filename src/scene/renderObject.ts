export class RenderObject {
    // base class of all render objects
    public constructor() {
        this._children = [];
    }

    // todo: transform matrix?

    // todo: children management
    
    private _children : RenderObject[];
    public get Children() : RenderObject[] {
        return this._children;
    }

    public attachChild(child : RenderObject) {
        // todo: transform
    }
}