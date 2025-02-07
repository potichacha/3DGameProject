import { Vector3, Quaternion } from "@babylonjs/core";
import { PhysicsAggregate } from "@babylonjs/core";

export function setupControls(playerPhysics: PhysicsAggregate) {
    const rotationSpeed = Math.PI / 18; // 📌 10° par frame (plus fluide)
    const moveSpeed = 5; // 📌 Vitesse d'avancement (plus raisonnable)
    const jumpForce = 10; // 📌 Force de saut
    let isJumping = false;

    window.addEventListener("keydown", (event) => {
        const body = playerPhysics.body;
        const transformNode = body.transformNode;
        
        // Récupérer la direction avant en fonction de la rotation actuelle
        const forward = new Vector3(
            Math.sin(transformNode.rotationQuaternion?.toEulerAngles().y || 0),
            0,
            Math.cos(transformNode.rotationQuaternion?.toEulerAngles().y || 0)
        ).normalize();

        switch (event.key.toLowerCase()) {
            case "z": // Avancer
                body.setLinearVelocity(forward.scale(moveSpeed).add(new Vector3(0, body.getLinearVelocity().y, 0)));
                break;

            case "s": // Reculer
                body.setLinearVelocity(forward.scale(-moveSpeed).add(new Vector3(0, body.getLinearVelocity().y, 0)));
                break;

            case "q": // Rotation gauche
                rotatePlayer(body, -rotationSpeed);
                break;

            case "d": // Rotation droite
                rotatePlayer(body, rotationSpeed);
                break;

            case " ":
                if (!isJumping && Math.abs(body.getLinearVelocity().y) < 0.1) {
                    body.applyImpulse(new Vector3(0, jumpForce, 0), transformNode.getAbsolutePosition());
                    isJumping = true;

                    // Attendre l'atterrissage avant de permettre un nouveau saut
                    setTimeout(() => (isJumping = false), 500);
                }
                break;
        }
    });
}

// Fonction pour tourner correctement le joueur avec des quaternions
function rotatePlayer(body: PhysicsAggregate["body"], angle: number) {
    const currentRotation = body.transformNode.rotationQuaternion || Quaternion.Identity();
    const newRotation = Quaternion.RotationAxis(Vector3.Up(), angle).multiply(currentRotation);
    body.transformNode.rotationQuaternion = newRotation;
}