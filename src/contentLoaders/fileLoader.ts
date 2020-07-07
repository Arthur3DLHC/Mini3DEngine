// https://github.com/bwasty/gltf-loader-ts/blob/master/source/fileloader.ts
// Adapted from THEE.FileLoader
// https://github.com/mrdoob/three.js/blob/master/src/loaders/FileLoader.js

import { LoadingManager } from './loadingmanager.js';

export type ProgressCallback = (xhr: XMLHttpRequest) => void;
export type XMLHttpRequestResponse = any;

export class FileLoader {
    manager: LoadingManager;
    path: string | undefined;
    responseType: XMLHttpRequestResponseType | undefined;
    withCredentials: boolean = false;;
    mimeType: string | undefined;
    requestHeaders: { [k: string]: string } = {};

    private runningRequests: { [url: string]: Promise<XMLHttpRequestResponse>} = {};

    constructor(manager: LoadingManager) {
        this.manager = manager;
    }
    load(url: string, onProgress?: ProgressCallback): Promise<XMLHttpRequestResponse> {
        if (this.path !== undefined) { url = this.path + url; }
        url = this.manager.resolveURL(url);

        if (this.runningRequests[url]) {
            return this.runningRequests[url];
        }

        const promise = new Promise((resolve, reject) => {
            // TODO!!: Check for data: URI
            // (-> Safari can not handle Data URIs through XMLHttpRequest so process manually)

            // NOTE: Not using `fetch` because it doesn't support progress reporting
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            const self = this;
            xhr.onload = function(event: ProgressEvent) {
                const response = this.response;

                /* istanbul ignore if */
                if (this.status === 0) {
                    // Some browsers return HTTP Status 0 when using non-http protocol
                    // e.g. 'file://' or 'data://'. Handle as success.
                    console.warn('FileLoader: HTTP Status 0 received.');
                    resolve(response);
                    self.manager.itemEnd(url);
                } else if (this.status === 200) {
                    resolve(response);
                    self.manager.itemEnd(url);
                } else {
                    reject({
                        url,
                        status: this.status,
                        statusText: xhr.statusText,
                    });

                    self.manager.itemEnd(url);
                    self.manager.itemError(url);
                }

                delete self.runningRequests[url];
            };

            xhr.onprogress = (xhr: any) => {
                if (onProgress) {
                    onProgress(xhr);
                }
            };

            /* istanbul ignore next */
            xhr.onerror = function(event: ProgressEvent) {
                reject({
                    url,
                    status: this.status,
                    statusText: xhr.statusText,
                });
                self.manager.itemEnd(url);
                self.manager.itemError(url);

                delete self.runningRequests[url];
            };

            if (this.responseType) { xhr.responseType = this.responseType; }
            if (this.withCredentials) { xhr.withCredentials = this.withCredentials; }
            if (this.mimeType && xhr.overrideMimeType) {
                xhr.overrideMimeType(this.mimeType !== undefined ? this.mimeType : 'text/plain');
            }

            for (const header in this.requestHeaders) {
                xhr.setRequestHeader(header, this.requestHeaders[header]);
            }

            // tslint:disable-next-line:no-null-keyword
            xhr.send(null);
            this.manager.itemStart(url);
        });

        this.runningRequests[url] = promise;

        return promise;
    }

    setRequestHeader(key: string, value: string) {
        this.requestHeaders[key] = value;
        return this;
    }
}
