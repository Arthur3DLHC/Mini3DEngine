import { BufferGeometry } from "./bufferGeometry.js";

/**
 * geometry cache.
 * cache the geometries loaded from gltf files.
 */
export class GeometryCache {
    private constructor() {

    }

    private static _instance: GeometryCache | null = null;
    public static get instance(): GeometryCache {
        if (GeometryCache._instance === null) {
            GeometryCache._instance = new GeometryCache();
        }
        return GeometryCache._instance;
    }

    public enabled: boolean = true;
    private geometries: Map<string, BufferGeometry> = new Map<string, BufferGeometry>();

    public add(key: string, geometry: BufferGeometry) {
		if ( this.enabled === false ) return;
        this.geometries.set(key, geometry);
    }

    public get(key: string): BufferGeometry | undefined {
		if ( this.enabled === false ) return undefined;
        return this.geometries.get(key);
    }

    public remove(key: string, release: boolean = true) {
        const geom = this.geometries.get(key);
        if (geom !== undefined) {
            if (release) {
                geom.destroy();
            }
            this.geometries.delete(key);
        }
    }

    public clear(release: boolean = true) {
        if (release) {
            for (const geom of this.geometries.values()) {
                geom.destroy();
            }
        }
        this.geometries.clear();
    }
}