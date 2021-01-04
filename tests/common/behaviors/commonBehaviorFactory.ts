import { Behavior, BehaviorFactory, Object3D } from "../../../src/mini3DEngine.js";

export class CommonBehaviorFactory implements BehaviorFactory {
    
    createBehavior(behaviorType: string, owner: Object3D, options: any): Behavior {
        throw new Error("Method not implemented.");
    }

}