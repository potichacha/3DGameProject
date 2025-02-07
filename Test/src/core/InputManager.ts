import { Vector3, Quaternion } from "@babylonjs/core";
import { PhysicsAggregate } from "@babylonjs/core";

const MOVE_SPEED = 5;
const ROTATION_SPEED = 0.1; // ✅ Même rotation que ton exemple (0.02)

export function setupControls(playerPhysics: PhysicsAggregate) {
    let inputStates = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
    };

    window.addEventListener("keydown", (event) => {
        switch (event.key.toLowerCase()) {
            case "s": inputStates.forward = true; break; // ✅ Avancer
            case "z": inputStates.backward = true; break; // ✅ Reculer
            case "q": inputStates.left = true; break; // ✅ Rotation fluide à gauche
            case "d": inputStates.right = true; break; // ✅ Rotation fluide à droite
            case " ": inputStates.jump = true; break;
        }
    });

    window.addEventListener("keyup", (event) => {
        switch (event.key.toLowerCase()) {
            case "s": inputStates.forward = false; break;
            case "z": inputStates.backward = false; break;
            case "q": inputStates.left = false; break;
            case "d": inputStates.right = false; break;
            case " ": inputStates.jump = false; break;
        }
    });

    playerPhysics.body.transformNode.getScene().onBeforeRenderObservable.add(() => {
        const body = playerPhysics.body;
        const transformNode = body.transformNode;

        // ✅ **Utilisation correcte du frontVector comme dans ton exemple**
        const forwardVector = new Vector3(
            Math.sin(transformNode.rotationQuaternion?.toEulerAngles().y || 0),
            0,
            Math.cos(transformNode.rotationQuaternion?.toEulerAngles().y || 0)
        ).normalize();

        let velocity = new Vector3(0, body.getLinearVelocity().y, 0);

        if (inputStates.forward) velocity = forwardVector.scale(MOVE_SPEED);
        if (inputStates.backward) velocity = forwardVector.scale(-MOVE_SPEED);

        // ✅ **Stopper le mouvement quand aucune touche n'est pressée**
        if (!inputStates.forward && !inputStates.backward) {
            velocity = new Vector3(0, body.getLinearVelocity().y, 0);
        }

        body.setLinearVelocity(velocity);

        // ✅ **Q et D utilisent la rotation fluide comme dans ton exemple**
        if (inputStates.left) {
            transformNode.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), ROTATION_SPEED)
                .multiply(transformNode.rotationQuaternion || Quaternion.Identity());
        }
        if (inputStates.right) {
            transformNode.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), -ROTATION_SPEED)
                .multiply(transformNode.rotationQuaternion || Quaternion.Identity());
        }

        if (inputStates.jump && Math.abs(body.getLinearVelocity().y) < 0.1) {
            body.applyImpulse(new Vector3(0, 10, 0), transformNode.getAbsolutePosition());
        }
    });
}