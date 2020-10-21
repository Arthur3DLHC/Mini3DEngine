import { ActionCondition } from "../../../src/mini3DEngine";
import { MakePoseBehavior } from "../behaviors/makePoseBehavior";

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