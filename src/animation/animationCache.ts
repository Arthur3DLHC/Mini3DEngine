import { AnimationData } from "./animationData.js";

/**
 * put animation frames data in cache
 */
export class AnimationCache {
    private _cache: Map<string, AnimationData> = new Map<string, AnimationData>();
}