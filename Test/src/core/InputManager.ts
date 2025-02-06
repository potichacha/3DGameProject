import { Vector3, Quaternion } from "@babylonjs/core";
import { PhysicsAggregate } from "@babylonjs/core";

export function setupControls(playerPhysics: PhysicsAggregate) {
    const rotationSpeed = Math.PI / 9; // 📌 20° par frame
    const moveSpeed = 20; // 📌 Vitesse d'avancement
    let isJumping = false;

    window.addEventListener("keydown", (event) => {
        const body = playerPhysics.body;
        let forward = new Vector3(
            Math.sin(body.transformNode.rotation.y),
            0,
            Math.cos(body.transformNode.rotation.y)
        );

        switch (event.key.toLowerCase()) {
            case "z": // Avancer
                body.setLinearVelocity(forward.scale(moveSpeed));
                console.log("Z");
                break;
            case "s": // Reculer
                body.setLinearVelocity(forward.scale(-moveSpeed));
                break;
            case "q": // Rotation gauche (-90°)
                body.transformNode.rotation.y -= rotationSpeed;
                break;
            case "d": // Rotation droite (+90°)d
                body.transformNode.rotation.y += rotationSpeed;
                break;
            case " ":
                if (!isJumping) {
                    body.applyImpulse(new Vector3(0, 10, 0), body.transformNode.getAbsolutePosition());
                    isJumping = true;
                    setTimeout(() => (isJumping = false), 500);
                }
                break;
        }
    });
}
