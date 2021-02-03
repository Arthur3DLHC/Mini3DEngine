/** one segment in uniform buffer */
export class BufferSegment {
    public constructor() {
        this.start = 0;
        this.count = 0;
    }

    public start: number;
    public count: number;
}