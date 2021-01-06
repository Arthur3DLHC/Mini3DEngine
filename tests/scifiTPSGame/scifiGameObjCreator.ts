import { GameObjectCreator, Object3D } from "../../src/mini3DEngine.js";

export class SciFiGameObjCreator extends GameObjectCreator {

    public createGameObject(prefabKey: string, componentProps: any): Object3D {
        switch(prefabKey) {
            case "player":
                return this.createPlayer(componentProps);
            case "infectedFemale":
                return this.createInfectedFemale(componentProps);
        }
        throw new Error("Unrecogonized prefab: " + prefabKey);
    }
    
    createPlayer(componentProps: any): Object3D {
        throw new Error("Method not implemented.");
    }
    createInfectedFemale(componentProps: any): Object3D {
        throw new Error("Method not implemented.");
    }
}