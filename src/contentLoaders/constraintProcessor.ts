import { SpringConstraint } from "../animation/constraint/springConstraint.js";
import { Object3D } from "../scene/object3D.js";
import { Node } from "./gltf.js";

export class ConstraintProcessor {
    /**
     * default constraints processing function
     * registered to GltfSceneBuilder.processConstraints
     */
    public processConstraints(node: Object3D, nodeDef: Node) {
        const ext = nodeDef.extras;
        if (ext.springConstraint !== undefined) {
            // springConstraint object
            const spring = new SpringConstraint(node);
            spring.enable = true;
            // properties
            if (ext.spring_rotation !== undefined) spring.rotation = ext.spring_rotation;
            if (ext.spring_stiff !== undefined) spring.stiffness = ext.spring_stiff;
            if (ext.spring_damp !== undefined) spring.damp = ext.spring_damp;
            if (ext.spring_gravity !== undefined) spring.gravity = ext.spring_gravity;
            // local tail position and up dir
            // need to swap y and z
            if (ext.spring_tail !== undefined) {
                spring.localTailPosition.setComponents(ext.spring_tail[0], ext.spring_tail[2], ext.spring_tail[1]);
            }
            if (ext.spring_up !== undefined) {
                spring.localUpDir.setComponents(ext.spring_up[0], ext.spring_up[2], ext.spring_up[1]);
            }
            node.constraintsWorld.push(spring);
        }
        // todo: other constraint types
    }
}