import { Vector3, Quaternion, Matrix } from "@babylonjs/core";
import { PhysicsAggregate } from "@babylonjs/core";
import { Player } from "../components/Player";

const MOVE_SPEED = 20; // 🚀 Augmenté pour aller plus vite
const ROTATION_SPEED = 0.02; // ✅ Rotation douce et précise

export function setupControls(player: Player) {
    let playerPhysics: PhysicsAggregate = player.getPhysics();
    let inputStates = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
    };

    let rotationY = 0; // ✅ Mémorise la rotation persistante

    window.addEventListener("keydown", (event) => {
        switch (event.key.toLowerCase()) {
            case "z": inputStates.backward= true; break;
            case "s": inputStates.forward = true; break;
            case "q": inputStates.left = true; break; // 🔄 Q tourne à gauche
            case "d": inputStates.right = true; break; // 🔄 D tourne à droite
            case " ": inputStates.jump = true; break;
        }
    });

    window.addEventListener("keyup", (event) => {
        switch (event.key.toLowerCase()) {
            case "z": inputStates.backward = false; break;
            case "s": inputStates.forward = false; break;
            case "q": inputStates.left = false; break;
            case "d": inputStates.right = false; break;
            case " ": inputStates.jump = false; break;
        }
    });

    playerPhysics.body.transformNode.getScene().onBeforeRenderObservable.add(() => {
        const body = playerPhysics.body;
        const transformNode = body.transformNode;

        if (!body || !transformNode) return;

        let moving = false;

        // ✅ Gestion correcte de la rotation
        if (inputStates.left) {
            rotationY -= ROTATION_SPEED; // Tourne à gauche
        }
        if (inputStates.right) {
            rotationY += ROTATION_SPEED; // Tourne à droite
        }

        transformNode.rotationQuaternion = Quaternion.FromEulerAngles(0, rotationY, 0);

        const forwardMatrix = Matrix.RotationY(rotationY);
        const forwardVector = Vector3.TransformNormal(Vector3.Forward(), forwardMatrix).normalize();

        let newVelocity = body.getLinearVelocity();

        if (inputStates.forward) {
            newVelocity = forwardVector.scale(MOVE_SPEED).add(new Vector3(0, newVelocity.y, 0));
            moving = true;
        }
        if (inputStates.backward) {
            newVelocity = forwardVector.scale(-MOVE_SPEED).add(new Vector3(0, newVelocity.y, 0));
            moving = true;
        }

        if (!moving) {
            newVelocity = new Vector3(newVelocity.x * 0.9, newVelocity.y, newVelocity.z * 0.9);
        }

        body.setLinearVelocity(newVelocity);

        if (inputStates.jump && Math.abs(body.getLinearVelocity().y) < 0.05) {
            body.applyImpulse(new Vector3(0, 10, 0), transformNode.getAbsolutePosition());
        }
    });
}