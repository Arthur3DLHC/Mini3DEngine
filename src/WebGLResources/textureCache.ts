import { Texture } from "./textures/texture";

/**
 * Hardware resource caches
 */
export class TextureCache {
    private constructor() {

    }

    private static _instance: TextureCache | null = null;
    public static get instance(): TextureCache {
        if (TextureCache._instance === null) {
            TextureCache._instance = new TextureCache();
        }
        return TextureCache._instance;
    }

    public enabled: Boolean = true;
    private textures: Map<string, Texture> = new Map<string, Texture>();

    public add(key: string, file: any) {
		if ( this.enabled === false ) return;
        this.textures.set(key, file);
    }

    public get(key: string): any {
		if ( this.enabled === false ) return;
        return this.textures.get(key);
    }

    public remove(key: string, release: Boolean = true) {
        const tex = this.textures.get(key);
        if (tex !== undefined) {
            if (release) {
                tex.release();
            }
            this.textures.delete(key);
        }
    }

    public clear(release: Boolean = true) {
        if (release) {
            for (const tex of this.textures.values()) {
                tex.release();
            }
        }
        this.textures.clear();
    }
}