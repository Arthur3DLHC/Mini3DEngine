export class GLDevice {
    public static gl: WebGL2RenderingContext;
    public static init(canvas: HTMLCanvasElement) {
        // initialize WebGL 2.0
        const gl2 = canvas.getContext('webgl2', {antialias: false});
        if (gl2) {
            this.gl = gl2;
        } else {
            // no fall back render pipeline yet
            throw new Error("WebGL 2 is not available");
        }
    }
}