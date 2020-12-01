import { Clock } from "../../scene/clock.js";
import { ActionCondition } from "./actionCondition.js";

export class TimeUpCondition extends ActionCondition {
    public constructor(duration?: number) {
        super();
        if( duration !== undefined ) {
            this._duration = duration;
            this._timeLeft = duration;
        }
    }
    private _duration: number = 1;
    private _timeLeft: number = 0;

    public get isTrue() {
        this._timeLeft -= Clock.instance.elapsedTime;
        return this._timeLeft < 0;
    }

    public reset() {
        this._timeLeft = this._duration;
    }

    public fromJSON(conditionDef: any) {
        // subclass do jobs
        if (conditionDef.duration !== undefined) {
            this._duration = conditionDef.duration;
            this._timeLeft = conditionDef.duration;
        }
    }
}