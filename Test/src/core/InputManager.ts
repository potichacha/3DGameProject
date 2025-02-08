import { Vector3, Quaternion, Matrix } from "@babylonjs/core";
import { PhysicsAggregate } from "@babylonjs/core";

const MOVE_SPEED = 20; // 🚀 Augmenté pour aller plus vite
const ROTATION_SPEED = 0.02; // ✅ Rotation douce et précise

export function setupControls(playerPhysics: PhysicsAggregate) {
    let inputStates = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
    };

    let rotationY = 0; // ✅ Mémorise la rotation persistante

    // ✅ Ajout des écouteurs d'événements
    window.addEventListener("keydown", (event) => {
        switch (event.key.toLowerCase()) {
            case "s": inputStates.forward = true; break;
            case "z": inputStates.backward = true; break;
            case "q": inputStates.right = true; break; // 🔄 Q tourne à droite maintenant
            case "d": inputStates.left = true; break; // 🔄 D tourne à gauche maintenant
            case " ": inputStates.jump = true; break;
        }
        console.log(`🕹️ Key Down: ${event.key}`, inputStates);
    });

    window.addEventListener("keyup", (event) => {
        switch (event.key.toLowerCase()) {
            case "s": inputStates.forward = false; break;
            case "z": inputStates.backward = false; break;
            case "q": inputStates.right = false; break;
            case "d": inputStates.left = false; break;
            case " ": inputStates.jump = false; break;
        }
        console.log(`🛑 Key Up: ${event.key}`, inputStates);
    });

    playerPhysics.body.transformNode.getScene().onBeforeRenderObservable.add(() => {
        const body = playerPhysics.body;
        const transformNode = body.transformNode;

        if (!body || !transformNode) {
            console.warn("❌ Problème: Pas de body ou transformNode détecté !");
            return;
        }

        // ✅ **Accumulation correcte de la rotation avec inversion**
        if (inputStates.left) {
            rotationY += ROTATION_SPEED; // 🔄 D tourne à gauche
        }
        if (inputStates.right) {
            rotationY -= ROTATION_SPEED; // 🔄 Q tourne à droite
        }

        // ✅ Appliquer la rotation au personnage
        transformNode.rotationQuaternion = Quaternion.FromEulerAngles(0, rotationY, 0);
        //console.log("🔄 Rotation Y:", rotationY);

        // ✅ **Correction du calcul du `forwardVector`**
        const forwardMatrix = Matrix.RotationY(rotationY);
        const forwardVector = Vector3.TransformNormal(Vector3.Forward(), forwardMatrix).normalize();

        //qconsole.log("➡️ Forward Vector:", forwardVector);

        let newVelocity = body.getLinearVelocity();
        let moving = false;

        // ✅ Appliquer la vélocité sans annuler le mouvement précédent
        if (inputStates.forward) {
            newVelocity = forwardVector.scale(MOVE_SPEED).add(new Vector3(0, newVelocity.y, 0));
            moving = true;
        }
        if (inputStates.backward) {
            newVelocity = forwardVector.scale(-MOVE_SPEED).add(new Vector3(0, newVelocity.y, 0));
            moving = true;
        }

        // ✅ Ralentissement progressif si aucune touche n'est pressée
        if (!moving) {
            newVelocity = new Vector3(newVelocity.x * 0.9, newVelocity.y, newVelocity.z * 0.9);
        }

        body.setLinearVelocity(newVelocity);
        //console.log("🚀 Vitesse appliquée:", newVelocity);

        // ✅ Gestion du saut
        if (inputStates.jump && Math.abs(body.getLinearVelocity().y) < 0.05) {
            body.applyImpulse(new Vector3(0, 10, 0), transformNode.getAbsolutePosition());
            console.log("🦘 Saut !");
        }
    });
}