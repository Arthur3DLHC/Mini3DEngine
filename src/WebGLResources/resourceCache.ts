/**
 * Hardware resource caches
 */
export class ResourceCache {
    private constructor() {

    }

    private static _instance: ResourceCache | null = null;
    public static get instance(): ResourceCache {
        if (ResourceCache._instance === null) {
            ResourceCache._instance = new ResourceCache();
        }
        return ResourceCache._instance;
    }

    // Hardware resource caches
    // geometry, texture...

    // clear caches
    
}