import { GameObjectCreator, Object3D, PerspectiveCamera, PhysicsWorld, Scene, TextureLoader } from "../../src/mini3DEngine.js";
import { PlayerPrefab } from "./prefabs/playerPrefab.js";

export class SciFiGameObjCreator extends GameObjectCreator {
    public constructor(physicsWorld: PhysicsWorld, camera: PerspectiveCamera, scene: Scene, textureLoader: TextureLoader) {
        super();

        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.camera = camera;
        this.textureLoader = textureLoader;

        this.playerPhysicsMtl = new CANNON.Material("playerMaterial");
        this.groundPhysicsMtl = new CANNON.Material("groundMaterial");
        this.widgetPhysicsMtl = new CANNON.Material("widgetMaterial");
        
        const player_ground_cm = new CANNON.ContactMaterial(this.playerPhysicsMtl, this.groundPhysicsMtl,
             { friction: 0.0, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
        const player_widget_cm = new CANNON.ContactMaterial(this.playerPhysicsMtl, this.widgetPhysicsMtl,
             { friction: 0.4, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
        const widget_ground_cm = new CANNON.ContactMaterial(this.widgetPhysicsMtl, this.groundPhysicsMtl,
             { friction: 0.4, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
        
        this.physicsWorld.world.addContactMaterial(player_ground_cm);
        this.physicsWorld.world.addContactMaterial(player_widget_cm);
        this.physicsWorld.world.addContactMaterial(widget_ground_cm);
    }

    private playerPhysicsMtl: CANNON.Material;
    private groundPhysicsMtl: CANNON.Material;
    private widgetPhysicsMtl: CANNON.Material;

    private scene: Scene;
    private camera: PerspectiveCamera;
    private textureLoader: TextureLoader;

    public showMature: boolean = false;

    public createGameObject(prefabKey: string, componentProps: any): Object3D {
        switch(prefabKey) {
            case "player":
                return this.createPlayer(componentProps);
            case "infectedFemale":
                return this.createInfectedFemale();
        }
        throw new Error("Unrecogonized prefab: " + prefabKey);
    }

    createPlayer(componentProps: any): Object3D {
        if (this.physicsWorld === null) {
            throw new Error("Need physics world to create player");
        }
        const playerPrefab: PlayerPrefab = new PlayerPrefab(this.gltfAssets, this.physicsWorld, this.scene, this.camera, this.textureLoader, this.playerPhysicsMtl);
        playerPrefab.showMature = this.showMature;
        return playerPrefab.createGameObject(componentProps);
    }

    createInfectedFemale(): Object3D {
        throw new Error("Method not implemented.");
    }
}