// mostly from https://github.com/bwasty/gltf-loader-ts/blob/master/source/gltf-loader.ts
// Originally derived from THREE.GLTFLoader
// https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/GLTFLoader.js

import { LoadingManager } from "./loadingmanager.js";
import { GltfAsset } from "./gltfAsset.js";
import { LoaderUtils } from "./loaderUtils.js";
import { FileLoader } from "./fileLoader.js";
import { GLTFBinaryData, BINARY_HEADER_MAGIC } from "./gltfBinaryData.js";

/**
 * GLTF model file loaer
 */
export class GLTFLoader {
    /**
     * Pass in a custom `LoadingManager` for progress reporting.
     */
    public constructor(manager: LoadingManager) {
        this._manager = manager;
    }

    private _manager: LoadingManager;

    public async load(url: string, onProgress?: (xhr: XMLHttpRequest) => void): Promise<GltfAsset> {
        const path = LoaderUtils.extractUrlBase(url);

        // according three.js, should track 1 more loading item here
        this._manager.itemStart(url);

        // load json content by an httprequest
        const loader = new FileLoader(this._manager);
        loader.responseType = "arraybuffer";
        const data = await loader.load(url, onProgress);
        const ret = await this.parse(data, path);

        this._manager.itemEnd(url);

        return ret;
    }

    private async parse(data: ArrayBuffer, path: string): Promise<GltfAsset> {
        let content: string | null = null;
        // tslint:disable-next-line:no-unnecessary-initializer
        let glbData: GLTFBinaryData | undefined = undefined;
        if (typeof data === 'string') {
            content = data;
        } else {
            const magic = LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
            if (magic === BINARY_HEADER_MAGIC) {
                glbData = new GLTFBinaryData(data);
                content = glbData.json;
            } else {
                content = LoaderUtils.decodeText(new Uint8Array(data));
            }
        }

        if (content !== null) {

            const json = JSON.parse(content);

            if (json.asset === undefined || json.asset.version[0] < 2) {
                throw new Error('Unsupported asset. glTF versions >=2.0 are supported.');
            }
            return new GltfAsset(json, path, glbData, this._manager);
        } else {
            // todo: return what?
            throw new Error("Faild parsing gltf data.");
        }
    }
}