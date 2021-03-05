/**
 * the generic gradient class
 * reference: https://github.com/BabylonJS/Babylon.js/blob/master/src/Misc/gradients.ts
 */
export class Gradient<T> {
    /**
     * 
     * @param gradient gradient position, between 0 and 1
     * @param value note: use new object instances
     */
    public constructor(gradient: number, value: T) {
        this.gradient = gradient;
        this.value = value;
    }

    /** must between 0 and 1 */
    public gradient: number = 0;
    public value: T;
}

export class GradientHelper {
    /**
     * get nearest two gradients before and after specific ratio.
     * @param ratio current ratio, between 0 and 1
     * @param gradients 
     * @param updateFunc 
     */
    public static GetCurrentGradient<T>(ratio: number, gradients: Gradient<T>[], updateFunc: (current: Gradient<T>, next: Gradient<T>, mix: number) => void) {
        if(ratio < gradients[0].gradient) {
            updateFunc(gradients[0], gradients[0], 1);
            return;
        }

        for(let i = 0; i < gradients.length - 1; i++) {
            const curr = gradients[i];
            const next = gradients[i + 1];

            if (ratio >= curr.gradient && ratio <= next.gradient ) {
                const mix = (ratio - curr.gradient) / (next.gradient - curr.gradient);
                updateFunc(curr, next, mix);
                return;
            }
        }

        const last = gradients[gradients.length - 1];
        updateFunc(last, last, 1);
    }
}