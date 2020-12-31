import vec3 from "../../lib/tsm/vec3.js";
import { EnvironmentProbe, EnvironmentProbeType, Scene, SRTTransform } from "../../src/mini3DEngine.js";

/**
 * helper functions for build demo scene
 */
export class SceneHelper {
    public static addEnvProbe(name: string, size: number, position: vec3, scene: Scene, probeType: EnvironmentProbeType) {
        const probe = new EnvironmentProbe();
        probe.name = name;
        probe.probeType = probeType;
        const probesrt = new SRTTransform();
        probesrt.scaling.x = size; probesrt.scaling.y = size; probesrt.scaling.z = size;
        position.copyTo(probesrt.translation);
        probesrt.update();
        probesrt.transform.copyTo(probe.localTransform);
    
        scene.attachChild(probe);
    }
}