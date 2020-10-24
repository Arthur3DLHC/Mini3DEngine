import { ActionCondition } from "../../../src/mini3DEngine.js";
import { MakePoseBehavior } from "../behaviors/makePoseBehavior.js";

export class MakePoseCondition extends ActionCondition {
    public constructor(poseName: string, behavior: MakePoseBehavior) {
        super();
        this.poseName = poseName;
        this._behavior = behavior;
    }
    public poseName: string | null = null;
    private _behavior: MakePoseBehavior;
    public get isTrue() {
        return this._behavior.curPose === this.poseName;
    }
}