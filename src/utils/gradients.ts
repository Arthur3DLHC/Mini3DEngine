// take from https://github.com/BabylonJS/Babylon.js/blob/master/src/Misc/gradients.ts,
// with some modifications.

// fix me: is it better to use typescript generic?

import vec4 from "../../lib/tsm/vec4.js";

/** Interface used by value gradients */
export interface IValueGradient {
    /** gradient value between 0 and 1 */
    gradient: number;
}

export class ColorGradient implements IValueGradient {
    public constructor( public gradient: number, public color: vec4 ) {
    }
}

export class GradientHelper {
    /**
     * get nearest two gradients before and after specific ratio.
     * @param ratio current ratio, between 0 and 1
     * @param gradients 
     * @param updateFunc 
     */
    public static GetCurrentGradient(ratio: number, gradients: IValueGradient[], updateFunc: (current: IValueGradient, next: IValueGradient, mix: number) => void) {
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