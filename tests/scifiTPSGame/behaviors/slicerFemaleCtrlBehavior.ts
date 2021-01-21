import { ActionControlBehavior } from "../../../src/animation/actionControlBehavior.js";
import { RigidBody } from "../../../src/physics/rigidBody.js";
import { Object3D } from "../../../src/scene/object3D.js";
import { Scene } from "../../../src/scene/scene.js";
import { MonsterCtrlBehavior } from "./monsterCtrlBehavior.js";

export enum SlicerFemaleState {
    Idle,
    MovingForward,
    StrafingLeft,
    StrafingRight,
    Attacking,
    Attacked,
    Jumping,
    Down,
}

export class SlicerFemaleCtrlBehavoir extends MonsterCtrlBehavior {

    public get typeName(): string {
        return "SlicerFemaleCtrlBehavoir";
    }
    public isA(typeName: string): boolean {
        if(typeName === "SlicerFemaleCtrlBehavoir") return true;
        return super.isA(typeName);
    }
    public constructor(owner: Object3D, body: RigidBody, actionCtrl: ActionControlBehavior, scene: Scene) {
        super(owner, body, actionCtrl, scene);
    }

    protected _curState: SlicerFemaleState = SlicerFemaleState.Idle;

    public update() {
        throw new Error("Method not implemented.");
    }

    public onAttacked(): void {
        throw new Error("Method not implemented.");
    }
}