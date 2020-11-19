import { AnimationAction } from "../animationAction.js";
import { AnimationBlendNode } from "../blendTree/animationBlendNode.js";
import { ActionState } from "./actionState.js";

/**
 * Action state with an animation blend tree
 * See unity3d blend tree and action state manuals https://docs.unity3d.com/Manual/class-BlendTree.html
 */
export class ActionStateBlendTree extends ActionState {

    public constructor(name: string) {
        super(name);
    }

    // todo: hold the animation blend tree
    public rootNode: AnimationBlendNode | null = null;

    public fromJSON(stateDef: any, animations: AnimationAction[]) {
        throw new Error("Method not implemented.");
    }
}