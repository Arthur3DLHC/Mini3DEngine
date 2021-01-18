import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, Clock, Object3D, RigidBody, Scene } from "../../../src/mini3DEngine.js";
import { MonsterCtrlBehavior, MonsterState } from "./monsterCtrlBehavior.js";
import { TPSPlayerBehavior } from "./tpsPlayerBehavior.js";

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

    public update() {
        // const curTime = Clock.instance.curTime;
        // if (curTime - this._lastThinkTime > this.thinkInterval) {
        //     this.think();
        //     this._lastThinkTime = curTime;
        // }

        // todo: chase player after attacked.

        // facing dir
        // 
        // this._facingDir.setComponents(0, 0, 0);
        // let facingYaw = this.yaw + Math.PI * 0.5;
        // this._facingDir.x = Math.cos(facingYaw);
        // this._facingDir.z = -Math.sin(facingYaw);
        if (this._player !== null) {
            this.owner.worldTransform.getTranslation(MonsterCtrlBehavior._tmpMyPosition);
            this._player.worldTransform.getTranslation(MonsterCtrlBehavior._tmpPlayerPosition);

            // set player direction as destination direction
            vec3.direction(MonsterCtrlBehavior._tmpPlayerPosition, MonsterCtrlBehavior._tmpMyPosition, this._destinationDir);
            this._distToPlayer = vec3.distance(MonsterCtrlBehavior._tmpMyPosition, MonsterCtrlBehavior._tmpPlayerPosition);
        }

        switch(this._curState) {
            case MonsterState.Idle:
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
            case MonsterState.Moving:
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
            case MonsterState.Attacking:
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
                        this.rest();
                    //}
                }
                break;
            case MonsterState.Attacked:
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
            case MonsterState.Down:
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                // set actionCtrl params
                // if already down, can not transit to other states?
                break;
        }

        if (this.upperBodyLayer !== undefined) {
            if (this._curState === MonsterState.Attacked) {
                this.upperBodyLayer.blendWeight = 1;
            } else {
                this.upperBodyLayer.blendWeight = 0;
            }
        }
    }
}