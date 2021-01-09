import { ObjectPropertiesMixer } from "./objectPropertiesMixer.js";

/**
 * hold the mix agents for animation channel targets
 * mix the animation values here, then apply them to actual target not properties
 * this is to prevent the instable mix result of animations
 * (prevent zero sum weights, normalize the sum weights, and so on)
 * 
 * I used to mix the animation on the Object3D's scale, rotate, translation directly,
 * by clear their value to zero first, then add weightd values of every animation
 * but because animations to mix together may not have exactly same target nodes,
 * some target's weight will keep zero or not 1 after the mixing
 * it's necessary
 * so, after invesigated the AnimationMixer code of three.js,
 * I decide to add a similar class to do this.
 */
export class AnimationMixer {
    public constructor() {

    }

    private _propMixers: ObjectPropertiesMixer[] = [];

    public beginMixing() {
        // clear all node target agents' states
        for (const mixer of this._propMixers) {
            mixer.reset();
        }
    }

    public endMixing() {
        // check zero weights, normalize weights, apply to target
        for (const mixer of this._propMixers) {
            mixer.apply();
        }
    }
}