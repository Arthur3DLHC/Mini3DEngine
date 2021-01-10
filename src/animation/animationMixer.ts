import { AnimationAction } from "./animationAction.js";
import { AnimTargetPath } from "./animationChannel.js";
import { ObjectPropertiesMixer, PropertyMixer } from "./objectPropertiesMixer.js";

/**
 * hold the mix agents for animation channel targets
 * mix the animation values here, then apply them to actual target node properties
 * this is to prevent the instable mix result of animations
 * (prevent zero sum weights, normalize the sum weights, and so on)
 * 
 * I used to mix the animation on the Object3D's scale, rotate, translation directly,
 * by clear their value to zero first, then add weightd values of every animation
 * but because animations to mix together may not have exactly same target nodes,
 * some node target's weight will keep zero or not be 1 after the mixing
 * so, after invesigated the AnimationMixer code of three.js,
 * I decide to add a similar class to do this.
 */
export class AnimationMixer {
    public constructor() {

    }

    private _propMixers: ObjectPropertiesMixer[] = [];

    public clear() {
        this._propMixers = [];
        // is that necessary to unbind all animation channels?
    }

    public bindAnimation(animation: AnimationAction) {
        for (const channel of animation.channels) {
            // todo: find or create propMixer for channel
            // todo: change channel's target to propMixer
            let propMixer: ObjectPropertiesMixer | undefined = this._propMixers.find((m)=>{return m.target === channel.target;});
            if (propMixer === undefined) {
                propMixer = new ObjectPropertiesMixer(channel.target);

                this._propMixers.push(propMixer);
            }
            channel.targetMixer = propMixer;
            switch (channel.path) {
                case AnimTargetPath.scale:
                    channel.targetVec3Mixer = propMixer.scale;
                    break;
                case AnimTargetPath.rotation:
                    channel.targetQuatMixer = propMixer.rotation;
                    break;
                case AnimTargetPath.translation:
                    channel.targetVec3Mixer = propMixer.translation;
                    break;
            }
        }
    }

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