import { ActionControlBehavior } from "../actionControlBehavior.js";
import { ActionCondition } from "./actionCondition.js";

export class SingleParamCondition extends ActionCondition {
    public constructor(actionCtrl: ActionControlBehavior, pname?: string, op?: string, val?: number) {
        super();
        this._actionCtrl = actionCtrl;
        if (pname !== undefined) this.paramName = pname;
        if (op !== undefined) this.compareOp = op;
        if (val !== undefined) this.compareValue = val;
    }
    public paramName: string = "";
    public compareValue: number = 0;
    public set compareOp(op: string) {
        switch(op) {
            case "==":
            case "===":
                this._compareFunction = this.funcEqual;
                break;
            case "!=":
            case "!==":
                this._compareFunction = this.funcNotEqual;
                break;
            case "<":
                this._compareFunction = this.funcLess;
                break;
            case "<=":
                this._compareFunction = this.funcLessEqual;
                break;
            case ">":
                this._compareFunction = this.funcGreater;
                break;
            case ">=":
                this._compareFunction = this.funcGreaterEqual;
                break;
            default:
                throw new Error("Unrecogonized operator: " + op);
        }
    }
    public get compareOp(): string {
        if(this._compareFunction === this.funcEqual) {
            return "===";
        }
        if(this._compareFunction === this.funcNotEqual) {
            return "!==";
        }
        if(this._compareFunction === this.funcLess) {
            return "<";
        }
        if(this._compareFunction === this.funcLessEqual) {
            return "<=";
        }
        if(this._compareFunction === this.funcGreater) {
            return ">";
        }
        if(this._compareFunction === this.funcGreaterEqual) {
            return ">=";
        }
        throw new Error("wrong operator");
    }

    private _actionCtrl: ActionControlBehavior;
    private _compareFunction: ((paramVal: number, compVal: number) => boolean) = this.funcEqual;

    public get isTrue() {
        const val = this._actionCtrl.actionParams.get(this.paramName);
        if (val === undefined) {
            throw new Error("param not found: " + this.paramName);
        }
        return this._compareFunction(val, this.compareValue);
    }

    /**
     * reset when enter state
     */
    public reset() {

    }

    public fromJSON(conditionDef: any) {
        super.fromJSON(conditionDef);
        if (conditionDef.paramName !== undefined) {
            this.paramName = conditionDef.paramName;
        }
        if (conditionDef.compareValue !== undefined) {
            this.compareValue = conditionDef.compareValue;
        }
        if (conditionDef.compareOp !== undefined) {
            this.compareOp = conditionDef.compareOp;
        }
    }

    private funcEqual(paramVal: number, compVal: number): boolean {
        return paramVal === compVal;
    }

    private funcNotEqual(paramVal: number, compVal: number): boolean {
        return paramVal !== compVal;
    }

    private funcLess(paramVal: number, compVal: number): boolean {
        return paramVal < compVal;
    }

    private funcLessEqual(paramVal: number, compVal: number): boolean {
        return paramVal <= compVal;
    }

    private funcGreater(paramVal: number, compVal: number): boolean {
        return paramVal > compVal;
    }

    private funcGreaterEqual(paramVal: number, compVal: number): boolean {
        return paramVal >= compVal;
    }
}