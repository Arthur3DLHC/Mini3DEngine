import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, Clock, Object3D, RigidBody, Scene } from "../../../src/mini3DEngine.js";
import { MonsterCtrlBehavior } from "./monsterCtrlBehavior.js";
import { TPSPlayerBehavior } from "./tpsPlayerBehavior.js";

export enum InfectedFemaleState {
    Idle,
    Moving,
    Attacking,
    Attacked,
    Down,
}

export class InfectedFemaleCtrlBehavior extends MonsterCtrlBehavior {
    public get typeName(): string {
        return "InfectedFemaleCtrlBehavior";
    }
    public isA(typeName: string): boolean {
        if(typeName === "InfectedFemaleCtrlBehavior") return true;
        return super.isA(typeName);
    }
    public constructor(owner: Object3D, body: RigidBody, actionCtrl: ActionControlBehavior, scene: Scene) {
        super(owner, body, actionCtrl, scene);
    }

    protected _curState: InfectedFemaleState = InfectedFemaleState.Idle;

    public update() {

        // todo: think interval
        
        // const curTime = Clock.instance.curTime;
        // if (curTime - this._lastThinkTime > this.thinkInterval) {
        //     this.think();
        //     this._lastThinkTime = curTime;
        // }
        super.update();

        switch(this._curState) {
            case InfectedFemaleState.Idle:
                // this._curAction = 0;
                // if player in attack range, attack ?
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                if(this.playerInMeleeAttackRange()) {
                    this.attack();
                } else if(this.playerInSight()) {
                    // if player in sight, move ?
                    this.moveTo(MonsterCtrlBehavior._tmpPlayerPosition);
                } else {
                    // if idled for a well, move to an random destination?
                }
                break;
            case InfectedFemaleState.Moving:
                // upate destination position
                // always player cur position for now?
                MonsterCtrlBehavior._tmpPlayerPosition.copyTo(this._destination);

                // turn toward destination dir?
                // calculate dest yaw?
                // or use quaternions? how?
                this.turnToFaceDestination();

                // move toward cur facing dir
                this._veloctity.x = this._facingDir.x * this.moveSpeed;
                this._veloctity.z = this._facingDir.z * this.moveSpeed;

                // if approached destination position, idle or attack ?
                // refers to cur behavior is patrolling or chasing?
                // what if player dead? change state to idle?
                if (this.playerInMeleeAttackRange()) {
                    this.attack();
                } else if (this._distToPlayer > this.senseRange) {
                    this.rest();
                }
                break;
            case InfectedFemaleState.Attacking:
                // recover time left
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                this._recoverTimeLeft -= Clock.instance.elapsedTime;
                this._hitTimeLeft -= Clock.instance.elapsedTime;
                if (this._hitTimeLeft < 0.0 && this._player !== null) {
                    this._hitTimeLeft = 1000;
                    const playerCtrl: TPSPlayerBehavior | undefined = this._player.getBehaviorByTypeName("TPSPlayerBehavior") as TPSPlayerBehavior;
                    if (playerCtrl !== undefined) {
                        playerCtrl.onAttacked();
                    }
                }
                if (this._recoverTimeLeft < 0.0) {
                    // attack again or rest?
                    // if (this.playerInMeleeAttackRange()) {
                    //     this.attack();
                    // } else {
                        // this.rest();
                    this.moveTo(MonsterCtrlBehavior._tmpPlayerPosition);

                    //}
                }
                break;
            case InfectedFemaleState.Attacked:
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                
                // recover time left
                this._recoverTimeLeft -= Clock.instance.elapsedTime;
                // if recovered (and player in sense range?), move toward player
                if (this._recoverTimeLeft < 0.0) {
                    // move to player?
                    this.moveTo(MonsterCtrlBehavior._tmpPlayerPosition);
                    // if(this.playerInSight()) {
                    //     // if player in sight, move ?
                    //     this.moveTo(MonsterCtrlBehavior._tmpPlayerPosition);
                    // } else {
                    //     this.rest();
                    // }
                }
                break;
            case InfectedFemaleState.Down:
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                // set actionCtrl params
                // if already down, can not transit to other states?
                break;
        }

        if (this.upperBodyLayer !== undefined) {
            if (this._curState === InfectedFemaleState.Attacked) {
                this.upperBodyLayer.blendWeight = 1;
            } else {
                this.upperBodyLayer.blendWeight = 0;
            }
        }
    }

    public moveTo(dest: vec3) {
        if (this._curState !== InfectedFemaleState.Down ) {
            dest.copyTo(this._destination);
            this._curState = InfectedFemaleState.Moving;
            this._actionCtrl.actionParams.set("curAction", InfectedFemaleState.Moving);
        }
    }

    public attack() {
        // attack toward current orientation ?
        this._curState = InfectedFemaleState.Attacking;
        this._recoverTimeLeft = 1.75;
        this._hitTimeLeft = 0.5;
        // todo: select attack action randomly
        this._actionCtrl.actionParams.set("curAction", this._curState * 100 + Math.round(Math.random() * (this.attackingActions - 1)));

        // if facing player and close enough, player take damage ?
    }

    public onAttacked() {
        if (this._curState !== InfectedFemaleState.Down) {
            // todo: calculate damage and hp left.
            // if hp < 0, down; else attacked
            // the down animation will be played once and keep the pose at last frame;
            this.HP--;

            if (this.HP > 0) {
                this._curState = InfectedFemaleState.Attacked;
                this._actionCtrl.actionParams.set("curAction", InfectedFemaleState.Attacked);
                this._recoverTimeLeft = 0.5;                
            } else {
                this._curState = InfectedFemaleState.Down;
                this._actionCtrl.actionParams.set("curAction", InfectedFemaleState.Down);
            }
            // todo: different animation of damage: light and heavy

        }
    }

    public rest() {
        if (this._curState !== InfectedFemaleState.Down) {
            this._curState = InfectedFemaleState.Idle;
            this._actionCtrl.actionParams.set("curAction", InfectedFemaleState.Idle);
        }
    }
}