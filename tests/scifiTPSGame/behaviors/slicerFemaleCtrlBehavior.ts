import { ActionControlBehavior } from "../../../src/animation/actionControlBehavior.js";
import { Clock } from "../../../src/mini3DEngine.js";
import { RigidBody } from "../../../src/physics/rigidBody.js";
import { Object3D } from "../../../src/scene/object3D.js";
import { Scene } from "../../../src/scene/scene.js";
import { DamageInfo } from "./damageInfo.js";
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
        const curTime = Clock.instance.curTime;

        super.update();

        switch(this._curState) {
            case SlicerFemaleState.Idle:
                this._veloctity.x = 0;
                this._veloctity.z = 0;

                // when idle, only think once every 1 second?
                // todo: reduce interval when caution
                if (curTime - this._lastThinkTime > this.thinkInterval) {
                    // priority:

                    // attack (front, back, jump)

                    // if caution, chances strafe to dodge damage

                    // chase player
                }
                break;
            case SlicerFemaleState.MovingForward:
                // slicer turns faster than infected female
                break;
            case SlicerFemaleState.StrafingLeft:
                // count down
                break;
            case SlicerFemaleState.StrafingRight:
                // count down
                break;
            case SlicerFemaleState.Jumping:
                // turn to idle state when touch ground
                break;
            case SlicerFemaleState.Attacking:
                // count down
                break;
            case SlicerFemaleState.Attacked:
                // count down
                break;
            case SlicerFemaleState.Down:
                break;
        }
    }

    public onAttacked(damageInfo: DamageInfo): void {
        throw new Error("Method not implemented.");
    }
}