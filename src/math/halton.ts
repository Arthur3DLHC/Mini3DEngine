/**
 * Generate halton sequence
 * https://en.wikipedia.org/wiki/Halton_sequence
 */
export class Halton {
    public static get(index: number, base: number): number {
        let result = 0;
        let f = 1 / base;
        let i = index;
        while (i > 0) {
            result = result + f * (i % base);
            i = Math.floor(i / base);
            f = f / base;
        }
        return result;
    }
}