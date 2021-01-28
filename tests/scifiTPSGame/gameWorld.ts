import { ObjectTagRenderer } from "../../src/mini3DEngine.js";
import { MonsterCtrlBehavior } from "./behaviors/monsterCtrlBehavior.js";

/**
 * a class to simplify test the interaction between gameobjects
 */
export class GameWorld {
    public static monsters: MonsterCtrlBehavior[] = [];
    public static objectTagRenderer: ObjectTagRenderer | null = null;
}