import { AnimationAction } from "../animationAction.js";
import { AnimationBlendNode } from "../blendTree/animationBlendNode.js";
import { ActionCondition } from "./actionCondition.js";
import { ActionState } from "./actionState.js";
import { ActionStateMachine } from "./actionStateMachine.js";

/**
 * Action state with an animation blend tree
 * See unity3d blend tree and action state manuals https://docs.unity3d.com/Manual/class-BlendTree.html
 */
export class ActionStateBlendTree extends ActionState {

    public constructor(name: string, machine: ActionStateMachine) {
        super(name, machine);
    }

    // hold the animation blend tree
    public rootNode: AnimationBlendNode | null = null;

    public update() {
        super.update();
        if (this.rootNode !== null && this.machine !== null) {
            this.rootNode.weight = this.machine.animationLayer.blendWeight * this.weight;
            this.rootNode.updateWeights(this.machine.actionCtrl.actionParams);

            // todo: clear all target channel values of animations in node?
            // do not need to clear after using the object property mixers

            // this.rootNode.clearAnimationTargetChannelValues();
            
            // blend the animations according to the node global weights?
            this.rootNode.updateAnimations();
        }
    }

    public enter() {
        super.enter();
        // play all leaf node animations
        // if (this.rootNode !== null) {
        //     this.rootNode.playAnimation();
        // }
    }

    public exit() {
        super.exit();
        // stop all leaf node animations
        // if (this.rootNode !== null) {
        //     this.rootNode.stopAnimation();
        // }
    }

    public playAnimation() {
        super.playAnimation();
        if (this.rootNode !== null) {
            this.rootNode.playAnimation();
        }
    }

    public stopAnimation() {
        super.stopAnimation();
        if (this.rootNode !== null) {
            this.rootNode.stopAnimation();
        }
    }

    public fromJSON(stateDef: any, animations: AnimationAction[], machine: ActionStateMachine, customConditionCreation?: (conditionDef: any)=>ActionCondition) {
        super.fromJSON(stateDef, animations, machine, customConditionCreation);

        if(stateDef.rootNode !== undefined) {
            const node: AnimationBlendNode = new AnimationBlendNode(this);
            node.fromJSON(stateDef.rootNode, animations);
            this.rootNode = node;
        }
    }
}