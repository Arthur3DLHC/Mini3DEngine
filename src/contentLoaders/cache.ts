// Adapted from https://github.com/mrdoob/three.js/blob/dev/src/loaders/Cache.js

/**
 * Only cache the objects in system memory.
 * for video memory objects, use TextureCache / GeometryCache
 */
export class Cache {
    // put everything in one map? or put objects of different types in different maps?
    public static enabled: boolean = false;
    public static files: Map<string, any> = new Map<string, any>();

    public static add(key: string, file: any) {
		if ( this.enabled === false ) return;
        this.files.set(key, file);
    }

    public static get(key: string): any {
		if ( this.enabled === false ) return;
        return this.files.get(key);
    }

    public static remove(key: string) {
        this.files.delete(key);
    }

    public static clear() {
        this.files.clear();
    }
}