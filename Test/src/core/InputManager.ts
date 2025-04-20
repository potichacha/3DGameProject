import { Vector3, Quaternion, Matrix } from "@babylonjs/core";
import { PhysicsAggregate } from "@babylonjs/core";
import { Player } from "../components/Player";

const MOVE_SPEED = 15; // Réduit la vitesse de déplacement pour un contrôle plus fluide
const ROTATION_SPEED = 0.02; // ✅ Rotation douce et précise

export function setupControls(player: Player) {
    let playerPhysics = player.getPhysics();
    if (!playerPhysics) {
        console.error("❌ Player physics not initialized!");
        return;
    }

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
            case "s": inputStates.backward = true; 
            
            player.getAnimationGroups()[1]?.play(true); break; // Avancer
            case "z": inputStates.forward = true; break; // Reculer
            case "q": inputStates.left = true; break; // Tourner à gauche
            case "d": inputStates.right = true; break; // Tourner à droite
            case " ": inputStates.jump = true; break; // Sauter
        }
    });

    window.addEventListener("keyup", (event) => {
        switch (event.key.toLowerCase()) {
            case "z":
                player.getAnimationGroups()[1]?.play(false);
            case "s":
                inputStates.forward = false;
                inputStates.backward = false;
                playerPhysics.body.setLinearVelocity(new Vector3(0, playerPhysics.body.getLinearVelocity().y, 0)); // Stop movement immediately
                break;
            case "q": inputStates.left = false; break;
            case "d": inputStates.right = false; break;
            case " ": inputStates.jump = false; break;
        }
    });

    playerPhysics.body.transformNode.getScene().onBeforeRenderObservable.add(() => {
        const body = playerPhysics.body;
        const transformNode = body.transformNode;

        if (!body || !body.hpBodyId) {
            console.error("❌ Physics body non initialisé ou invalide !");
            return;
        }

        if (!transformNode) return;

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

        if (inputStates.backward) {
            newVelocity = forwardVector.scale(MOVE_SPEED).add(new Vector3(0, newVelocity.y, 0));
            moving = true;
        }
        if (inputStates.forward) {
            newVelocity = forwardVector.scale(-MOVE_SPEED).add(new Vector3(0, newVelocity.y, 0));
            player.getAnimationGroups()[1]?.play(true); // Joue l'animation de marche
            moving = true;
        }

        if (!moving) {
            newVelocity = new Vector3(0, newVelocity.y, 0); // ✅ Arrête complètement le mouvement horizontal
        }

        body.setLinearVelocity(newVelocity);

        if (inputStates.jump && Math.abs(body.getLinearVelocity().y) < 0.05) {
            body.applyImpulse(new Vector3(0, 10, 0), transformNode.getAbsolutePosition());
        }
    });
}