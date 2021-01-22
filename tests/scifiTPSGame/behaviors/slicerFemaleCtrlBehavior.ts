import vec3 from "../../../lib/tsm/vec3.js";
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

    public jumpHorizSpeed: number = 2;
    public jumpVertiSpeed: number = 1;

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
                // jump state is a blendtree state
                // set y speed param as blending param

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

    public moveTo(dest: vec3) {
        // if (this._curState !== SlicerFemaleState.Down) {
            dest.copyTo(this._destination);
            this._curState = SlicerFemaleState.MovingForward;
            this._actionCtrl.actionParams.set("curAction", SlicerFemaleState.MovingForward);
        //}
    }

    public strafe() {
        // note: only strafe when facing player? 'saw' player is aiming

        // strafe left or right? randomly?
        const rand = Math.random();
        if (rand <= 0.5) {
            this._curState = SlicerFemaleState.StrafingLeft;
        } else {
            this._curState = SlicerFemaleState.StrafingRight;
        }
        this._caution = true;
        this._recoverTimeLeft = 0.5;
        this._actionCtrl.actionParams.set("curAction", this._curState);
    }

    public attack(front: boolean) {
        // attack toward current orientation
        // let player have chance to dodge
        this._curState = SlicerFemaleState.Attacking;
        this._caution = true;
        this._recoverTimeLeft = 1.85;
        let action = this._curState * 100;
        if (front) {
            this._hitTimeLeft = 0.73;
        } else {
            action = this._curState * 100 + 1;
            this._hitTimeLeft = 0.73;
        }
        this._actionCtrl.actionParams.set("curAction", action);
    }

    public jump() {
        // todo: set jump velocity once?
        this._veloctity.x = this._facingDir.x * this.jumpHorizSpeed;
        this._veloctity.z = this._facingDir.z * this.jumpHorizSpeed;
        this._veloctity.y = this.jumpVertiSpeed;
        
        this._caution = true;
        this._curState = SlicerFemaleState.Jumping;
        this._actionCtrl.actionParams.set("curAction", SlicerFemaleState.Jumping);
    }

    public rest() {
        // if (this._curState !== SlicerFemaleState.Down) {
            this._curState = SlicerFemaleState.Idle;
            this._actionCtrl.actionParams.set("curAction", SlicerFemaleState.Idle);
        //}
    }

    public onAttacked(damageInfo: DamageInfo): void {
        throw new Error("Method not implemented.");
    }
}