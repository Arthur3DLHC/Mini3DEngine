import { AnimationData } from "./animationData.js";

/**
 * put animation frames data in cache
 */
export class AnimationCache {
    private constructor() {

    }

    private static _instance: AnimationCache | null = null;
    public static get instance(): AnimationCache {
        if (AnimationCache._instance === null) {
            AnimationCache._instance = new AnimationCache();
        }
        return AnimationCache._instance;
    }

    public enabled: boolean = true;
    private _animations: Map<string, AnimationData> = new Map<string, AnimationData>();

    public add(key: string, anim: AnimationData) {
        if(!this.enabled) return;
        this._animations.set(key, anim);
    }

    public get(key: string): AnimationData | undefined {
        if(!this.enabled) return;
        return this._animations.get(key);
    }

    public remove(key: string) {
        this._animations.delete(key);
    }

    public clear() {
        this._animations.clear();
    }
}