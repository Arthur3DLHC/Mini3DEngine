import { Behavior } from "../scene/behavior.js";
import { Object3D } from "../scene/object3D.js";
import { AnimationAction } from "./animationAction.js";
import { AnimationLayer } from "./animationLayer.js";
import { AnimationMixer } from "./animationMixer.js";
import { ActionCondition } from "./stateMachine/actionCondition.js";
import { ActionState } from "./stateMachine/actionState.js";
import { ActionStateMachine } from "./stateMachine/actionStateMachine.js";

/**
 * hold the action state machine, and the parameters driving the machine
 */
export class ActionControlBehavior extends Behavior {
    public get typeName(): string {
        return "ActionControlBehavior";
    }
    public isA(typeName: string): boolean {
        if(typeName === "ActionControlBehavior") return true;
        return super.isA(typeName);
    }
    public constructor(owner: Object3D, anims: AnimationAction[]) {
        super(owner);
        // this._stateMachine = new ActionStateMachine(this);
        this._actionParams = new Map<string, number>();
        this._animations = anims;
        this.animationLayers = [];

        // todo: use objectPropertiesMixer for all animations?
        this._animationMixer = new AnimationMixer();
        for (const anim of anims) {
            this._animationMixer.bindAnimation(anim);
        }
    }

    // private _stateMachine: ActionStateMachine;
    private _actionParams: Map<string, number>
    private _animations: AnimationAction[];
    private _animationMixer: AnimationMixer;

    // public get stateMachine(): ActionStateMachine {
    //     return this._stateMachine;
    // }

    /**
     * if layer's blendMode is replace, the later elements will replace the former
     */
    public animationLayers: AnimationLayer[];

    /**
     * the parameters driving the state machine
     * states will change accroding to params in this list
     * blend weights also.
     * the params controlling blendtree node weights should be at 0 ~ 1 range?
     */
    public get actionParams(): Map<string, number> {
        return this._actionParams;
    }

    public get animations(): AnimationAction[] {
        return this._animations;
    }

    public update() {
        // todo: test use mixer

        // todo: remove all clean zero operations in blendtrees;
        for (const layer of this.animationLayers) {
            this._animationMixer.beginMixing();
            layer.update();
            this._animationMixer.endMixing();
        }
    }

    public fromJSON(jsonData: any, customStateCreation?: (stateDef: any)=> ActionState, customConditionCreation?: (conditionDef: any)=>ActionCondition) {
        // add params first
        this._actionParams.clear();

        if (jsonData.actionParams !== undefined) {
            // param name and default value?
            // to iterate all properties through a js object, need to use for...in
            for (const paramName in jsonData.actionParams) {
                if (Object.prototype.hasOwnProperty.call(jsonData.actionParams, paramName)) {
                    const defaultVal = jsonData.actionParams[paramName];
                    this._actionParams.set(paramName, defaultVal);
                }
            }
        }

        if (jsonData.animationLayers !== undefined) {
            this.animationLayers = [];
            for (const layerDef of jsonData.animationLayers) {
                const layer = new AnimationLayer();
                layer.fromJSON(layerDef, this.owner, this, this._animations, customStateCreation, customConditionCreation);
                this.animationLayers.push(layer);
            }
        }
        
        // state machine
        // if (jsonData.stateMachine !== undefined) {
        //     this._stateMachine.fromJSON(jsonData.stateMachine, this._animations, customStateCreation, customConditionCreation);
        // }
    }
}