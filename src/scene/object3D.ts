import { mat4 } from "gl-matrix";
import { RenderItem } from "../renderer/renderItem.js";

export class Object3D {
    // base class of all render objects
    public constructor() {
        this.name = "";
        this.parent = null;
        this._children = [];
        this.localTransform = mat4.create();
        this.worldTransform = mat4.create();
    }

    // todo: need an id?

    public name : string;

    // 在对象这里，只存变换矩阵；由附加的变换组件来计算这些矩阵？
    // 组件机制之后再实现？
    // 可渲染的对象用从此类派生的形式组织；其他类型的对象如变换，物理，声音，逻辑等用组件机制，附加到此类对象上；
    public localTransform : mat4;
    public worldTransform : mat4;

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

    public updateWorldTransform(updateParents: boolean, updateChildren: boolean) {
        // todo: only update transforms when dirty
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

    public provideRenderItem(itemList: RenderItem[]) {
        // todo: subclasses add primitive to list
    }
}