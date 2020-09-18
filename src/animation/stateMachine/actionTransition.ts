import { ActionCondition } from "./actionCondition.js";
import { ActionState } from "./actionState.js";

export class ActionTransition {
    public conditions: ActionCondition[] = [];
    public targetState: ActionState | null = null;
}