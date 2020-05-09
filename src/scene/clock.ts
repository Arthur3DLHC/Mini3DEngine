/**
 * a global timer for animations
 */
export class Clock {
    private constructor() {

    }
    private static _instance: Clock|null = null;
    public static get instance(): Clock {
        if (this._instance == null) {
            this._instance = new Clock();
        }
        return this._instance;
    }

    private _then: number = -1;
    private _elapsedTime: number = 0;
    private _curTime: number = 0;
    private _running = true;
    private _speed = 1;

    public start() {
        this._running = true;
    }

    public stop() {
        this._running = false;
    }

    /**
     * should be called in game loop function per frame
     * @param now 
     */
    public update(now: number) {
        if (this._then < 0) {
            this._then = now;
        }
        if (this._running) {
            this._elapsedTime = this._speed * (now - this._then) * 0.001;
        } else {
            this._elapsedTime = 0;
        }
        this._then = now;
        this._curTime += this._elapsedTime;
    }

    public get curTime(): number {
        return this._curTime;
    }

    public get elapsedTime(): number {
        return this._elapsedTime;
    }
}