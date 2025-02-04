import { Vector3 } from "@babylonjs/core";
import { PhysicsAggregate } from "@babylonjs/core";

export function setupControls(playerPhysics: PhysicsAggregate) {
    let isJumping = false;

    window.addEventListener("keydown", (event) => {
        const force = new Vector3(0, 0, 0);

        switch (event.key) {
            case "ArrowUp": case "z":
                force.z = -5;
                break;
            case "ArrowDown": case "s":
                force.z = 5;
                break;
            case "ArrowLeft": case "q":
                force.x = -5;
                break;
            case "ArrowRight": case "d":
                force.x = 5;
                break;
            case " ":
                if (!isJumping) {
                    force.y = 10;
                    isJumping = true;
                    setTimeout(() => isJumping = false, 500); // Empêche le spam de saut
                }
                break;
        }

        playerPhysics.body.applyImpulse(force, playerPhysics.transformNode.getAbsolutePosition());
    });
}