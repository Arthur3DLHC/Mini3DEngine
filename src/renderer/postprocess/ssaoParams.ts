export class SSAOParams {
    public enable: boolean = true;
    public radius: number = 8;              // meters
    public minDistance: number = 0.005;     // -1, 1 range
    public maxDistance: number = 0.1;       // -1, 1 range
    public blurSize: number = 1.0;          // px
    public intensiy: number = 1.0;
    public power: number = 2.0;
}