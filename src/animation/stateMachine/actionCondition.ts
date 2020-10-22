/**
 * base class of all action transit conditions
 */
export class ActionCondition {
    /**
     * subclasses override this method to implement their own check logic
     */
    public get isTrue() {
        return false;
    }

    /**
     * reset when enter state
     */
    public reset() {

    }
}