import { Behavior } from "../../../src/mini3DEngine.js";

export const MakePoses = {
    IDLE: "idle",
    DANCE: "dance",
    MASTURBATE: "masturbate",
    BREAST: "breast",
    ORAL: "oral",
    COWGIRL: "cowgirl",
    COWGIRL_FAST: "cowgirlfast",
    COWGIRL_CUM: "cowgirlcum"
};

export class MakePoseBehavior extends Behavior {
    public get typeName(): string {
        return "MakePoseBehavior";
    }
    public curPose: string = MakePoses.IDLE;
}