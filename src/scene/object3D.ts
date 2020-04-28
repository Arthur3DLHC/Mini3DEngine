import { mat4 } from "gl-matrix";
import { RenderItem } from "../renderer/renderItem.js";
import { RenderList } from "../renderer/renderList.js";

export class Object3D {
    // base class of all render objects
    public constructor() {
        this.name = "";
        this.visible = true;
        this._active = true;
        this.parent = null;
        this._children = [];
        this.localTransform = mat4.create();
        this.worldTransform = mat4.create();
        this.castShadow = false;
        this.receiveShadow = false;
        this.occlusionQuery = false;
        this.occlusionID = 0;
        this.occlusionQueryResult = true;
    }

    // todo: need an id?

    public name : string;

    public visible: boolean;

    private _active: boolean;
    public get active(): boolean {
        return this._active;
    }

    // 在对象这里，只存变换矩阵；由附加的变换组件来计算这些矩阵？
    // 组件机制之后再实现？
    // 可渲染的对象用从此类派生的形式组织；其他类型的对象如变换，物理，声音，逻辑等用组件机制，附加到此类对象上；
    public localTransform : mat4;
    public worldTransform : mat4;

    public castShadow: boolean;
    public receiveShadow: boolean;

    // todo: occlusion query? need bounding box?
    public occlusionQuery: boolean;
    public occlusionID: number;
    public occlusionQueryResult: boolean;

    public parent: Object3D | null;
    
    private _children : Object3D[];
    public get Children() : Object3D[] {
        return this._children;
    }

    public attachChild(object : Object3D) {
        // todo: update transform?
        // todo: key children with their name? need to use Map
        // check duplicate
        // if (this._children.hasOwnProperty(child.name)) {
        //     throw "Child with name " + child.name + " already exist.";
        // }
        // this._children[child.name] = child;
        if (object === this) {
            throw "Can not add object itself as child";
        }
        if (object.parent) {
            object.parent.removeChild(object);
        }
        this._children.push(object);
        object.parent = this;
    }

    public removeChild(object : Object3D) {
        const index = this._children.indexOf(object);
        if (index !== -1) {
            object.parent = null;
            this._children.splice(index, 1);
        }
    }

    public getChildByName(name: string): Object3D | null {
        for (const child of this._children) {
            if (child.name === name) {
                return child;
            }
        }
        return null;
    }

    public activate(activateParents: boolean, activateChildren: boolean) {
        if (activateParents && this.parent) {
            this.parent.activate(true, false);
        }
        this._active = true;
        if (activateChildren) {
            for (const child of this._children) {
                child.activate(false, true);
            }
        }
    }

    public deactivate(deactivateParents: boolean, deactivateChildren: boolean) {
        if (deactivateParents && this.parent) {
            this.parent.deactivate(true, false);
        }
        this._active = true;
        if (deactivateChildren) {
            for (const child of this._children) {
                child.deactivate(false, true);
            }
        }
    }

    public updateWorldTransform(updateParents: boolean, updateChildren: boolean) {
        // todo: only update transforms when dirty?
        if (this._active === false) {
            return;
        }

        if( updateParents && this.parent) {
            this.parent.updateWorldTransform(true, false);
        }

        if (this.parent) {
            mat4.multiply(this.worldTransform, this.parent.worldTransform, this.localTransform);
        } else {
            mat4.copy(this.worldTransform, this.localTransform);
        }

        if( updateChildren ) {
            for (const child of this._children) {
                child.updateWorldTransform(false, true);
            }
            // for (const key in this._children) {
            //     if (this._children.hasOwnProperty(key)) {
            //         const child = this._children[key];
            //         child.updateWorldTransform(false, true);
            //     }
            // }
        }
    }

    public provideRenderItem(renderList: RenderList) {
        // todo: subclasses add primitive to list
    }

    public destroy() {
        // subclass release WebGL resources.
    }
}