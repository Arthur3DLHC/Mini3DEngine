// https://zhuanlan.zhihu.com/p/20374706

export class Hammersley {
    /**
     * 获得一个取样点
     * @param dimension 维度
     * @param index 取样点索引
     * @param base 基数，必须用质数
     * @param numSamples 取样点总数
     */
    public static get(dimension: number, index: number, base: number, numSamples: number): number {
        if (dimension === 0) {
            return index / numSamples;
        } else {
            return this.radicalInverse(index, base);
        }
    }

    private static radicalInverse(index: number, base: number): number {
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