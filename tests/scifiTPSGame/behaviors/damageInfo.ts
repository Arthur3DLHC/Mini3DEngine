import { Object3D } from "../../../src/mini3DEngine.js";

export class DamageInfo {
    public constructor(attacker: Object3D, amount: number = 0) {
        this.attacker = attacker;
        this.amount = amount;
    }
    public amount: number = 0;
    public attacker: Object3D;

    //#region damage features
    public blowUp: boolean = false;
    //#endregion
}