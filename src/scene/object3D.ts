import { RenderList } from "../renderer/renderList.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import vec4 from "../../lib/tsm/vec4.js";
import mat4 from "../../lib/tsm/mat4.js";
import { Behavior } from "./behavior.js";
import vec3 from "../../lib/tsm/vec3.js";
import quat from "../../lib/tsm/quat.js";
import { BoundingRenderModes } from "../renderer/boundingRenderModes.js";

export class Object3D {
    // base class of all render objects
    public constructor() {
        this.name = "";
        this.visible = true;
        this.category = -1;
        this.id = 0;
        this.color = new vec4([1,1,1,1]);
        this._active = true;
        this.isStatic = false;
        this.autoUpdateTransform = false;
        this.behaviors = [];
        this.parent = null;
        this._children = [];
        this.localTransform = mat4.identity.copy();
        this.worldTransform = mat4.identity.copy();
        this.worldTransformPrev = mat4.identity.copy();
        this.translation = new vec3([0,0,0]);
        this.rotation = quat.identity.copy();
        this.scale = new vec3([1,1,1]);
        this._moved = false;
        this.castShadow = false;
        this.receiveShadow = false;
        this.occlusionQuery = false;
        this.occlusionQueryID = null;
        this.occlusionQueryResult = true;
        this.boundingBoxRenderMode = BoundingRenderModes.none;
        this.boundingSphereRenderMode = BoundingRenderModes.none;
        // this._curFrameNumber = -1;
    }

    public name : string;

    public visible: boolean;

    /**
     * category associated with game logic user data
     * category and id
     * user can define some object categories such as useable, pickable, locked, dangerous and so on
     * then can assign a color for each category in silhouette postprocess
     * default value: -1: not pickable, not usable, and do not have silhouette
     */
    public category: number;

    /**
     * id associated with game logic
     * must > zero
     * default value: 0: not pickable, not interactive
     * not all object3D need an id. only the objects need to be interactive in the game level need one
     * there are at most 1000 interactive objects (with id) in a game level allowed
     */
    public id: number;

    /**
     * tag passed into shader. internal use only
     */
    public get tag(): number {
        return this.category * 1000 + this.id;
    }

    /**
     * every object can have a color itself
     */
    public color: vec4;

    private _active: boolean;
    public get active(): boolean {
        return this._active;
    }

    public isStatic: boolean;

    // 在对象这里，只存变换矩阵；由附加的变换组件来计算这些矩阵？
    // 组件机制之后再实现？
    // 可渲染的对象用从此类派生的形式组织；其他类型的对象如变换，物理，声音，逻辑等用组件机制，附加到此类对象上；
    public localTransform : mat4;
    public worldTransform : mat4;
    // todo: prev frame world transform? for temporal effects?
    public worldTransformPrev: mat4;

    /** 是否自动根据 SRT 更新 localTransform */
    public autoUpdateTransform: boolean;

    // 以下三个属性主要用于播放动画
    
    /** 位移。注意：要通过设置此值变换对象，需启用 Object3D.autoUpdateTransform, 或手动调用 Object3D.updateLocalTransform */
    public translation: vec3;
    /** 旋转。注意：要通过设置此值变换对象，需启用 Object3D.autoUpdateTransform, 或手动调用 Object3D.updateLocalTransform */
    public rotation: quat;
    /** 缩放。注意：要通过设置此值变换对象，需启用 Object3D.autoUpdateTransform, 或手动调用 Object3D.updateLocalTransform */
    public scale: vec3;

    private _moved: boolean;
    public get moved(): boolean {
        return this._moved;
    }

    public castShadow: boolean;
    public receiveShadow: boolean;

    // todo: occlusion query? need bounding box?
    public occlusionQuery: boolean;
    public occlusionQueryID: WebGLQuery|null;
    public occlusionQueryResult: boolean;

    // public showBoundingBox: boolean;
    // public showBoundingSphere: boolean;
    public boundingBoxRenderMode: BoundingRenderModes;
    public boundingSphereRenderMode: BoundingRenderModes;

    public behaviors: Behavior[];

    public parent: Object3D | null;
    
    private _children : Object3D[];
    public get children() : Object3D[] {
        return this._children;
    }

    // private _curFrameNumber: number;

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

    public getChildByName(name: string, recursive: boolean = false): Object3D | null {
        for (const child of this._children) {
            if (child.name === name) {
                return child;
            }

            if (recursive) {
                const ret = child.getChildByName(name, recursive)
                if (ret !== null) {
                    return ret;
                }
            }
        }
        
        return null;
    }

    public getObjectByPath(path: string): Object3D | null {
        const names = path.split("|");
        let ret: Object3D | null = this;
        for (const name of names) {
            if (ret === null) {
                return null;
            }
            ret = ret.getChildByName(name);
        }
        return ret;
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

    // 每次更新应该先更新 behavior，再更新 transform，最后更新 visual
    // Fix me: 是应该分三次递归调用，还是一次递归调用中每对象分别调用？
    public updateBehavior() {
        // update behavior list of this
        // physics is a behavior?
        for (const behavior of this.behaviors) {
            behavior.update();
        }

        // update children?
        for (const child of this._children) {
            child.updateBehavior();
        }
    }

    public updateLocalTransform() {
        this.localTransform.compose(this.translation, this.rotation, this.scale);
        // todo: mark local transform dirty?
    }

    public updateWorldTransform(updateParents: boolean, updateChildren: boolean) {
        // todo: only update transforms when dirty?
        if (this._active === false) {
            return;
        }

        if( updateParents && this.parent) {
            this.parent.updateWorldTransform(true, false);
        }

        if (this.autoUpdateTransform) {
            this.updateLocalTransform();
        }

        // record prev transform
        this.worldTransform.copy(this.worldTransformPrev);

        if (this.parent) {
            mat4.product(this.parent.worldTransform, this.localTransform, this.worldTransform);
        } else {
            this.localTransform.copy(this.worldTransform);
        }

        this._moved = ! this.worldTransformPrev.equals(this.worldTransform);

        this.onWorldTransformUpdated();

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

    public destroy(destroyChildren: boolean) {
        // subclass release WebGL resources.
        if (this.occlusionQueryID) {
            GLDevice.gl.deleteQuery(this.occlusionQueryID);
            this.occlusionQueryID = null;
        }
        if (destroyChildren) {
            for (const child of this._children) {
                child.destroy(destroyChildren);
            }
        }
    }

    protected onWorldTransformUpdated() {
        // subclass can do things
    }
}