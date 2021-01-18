import { ActionControlBehavior, Object3D, RigidBody, Scene } from "../../../src/mini3DEngine";
import { MonsterCtrlBehavior } from "./monsterCtrlBehavior";

export class InfectedFemaleCtrlBehavior extends MonsterCtrlBehavior {
    public get typeName(): string {
        return "InfectedFemaleCtrlBehavior";
    }
    public isA(typeName: string): boolean {
        if(typeName === "InfectedFemaleCtrlBehavior") return true;
        return super.isA(typeName);
    }
    // todo: isA?
    public constructor(owner: Object3D, body: RigidBody, actionCtrl: ActionControlBehavior, scene: Scene) {
        super(owner, body, actionCtrl, scene);
    }
}