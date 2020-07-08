// Adapted from https://github.com/mrdoob/three.js/blob/dev/src/loaders/Loader.js

import { LoadingManager } from "./loadingmanager.js";

export class BaseLoader {
    public constructor(manager: LoadingManager) {
        this.manager = manager;
    }
    
    public path: string | undefined;
    public crossOrigin: string | undefined;
    public manager: LoadingManager;
}