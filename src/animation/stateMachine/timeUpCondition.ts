import { Clock } from "../../scene/clock";
import { ActionCondition } from "./actionCondition";

export class TimeUpCondition extends ActionCondition {
    public timeLeft: number = 0;
    public get isTrue() {
        this.timeLeft -= Clock.instance.elapsedTime;
        return this.timeLeft < 0;
    }    
}