import { AnimationAction } from "./animationAction";

/**
 * Simple controller to select one animation action from multiple actions to play
 */
export class ActionSelector {
    public constructor() {

    }

    public actions: AnimationAction[] = [];

    private _curAction: AnimationAction | null = null;

    public get curAction(): AnimationAction | null {
        return this._curAction;
    }
    
    public playAction(actionName: string) {
        // find action by name
        // fix me: use a map to store actions?
        const newAction = this.actions.find((action: AnimationAction)=>{
            return actionName === action.name;
        });

        if (newAction === undefined) {
            throw new Error("Action not found: " + actionName);
        }

        if (this._curAction !== null) {
            this._curAction.stop();
        }

        this._curAction = newAction;
        this._curAction.reset();
        this._curAction.play();
    }

    public update(time: number, deltaTime: number) {
        if (this._curAction !== null) {
            this._curAction.update(time, deltaTime);
        }
    }
}