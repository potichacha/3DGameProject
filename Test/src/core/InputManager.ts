import {Quaternion, Ray, Vector3} from "@babylonjs/core";
import {Player} from "../components/Player";

const DEFAULT_MOVE_SPEED = 30;
const ROTATION_SPEED = 0.025;
const JUMP_IMPULSE = 45;
const GROUND_CHECK_EXTRA_DISTANCE = 0.2;
const FORWARD_CHECK_DISTANCE = 0.5;
const AIR_DAMPING_FACTOR = 0.98;
const AIR_CONTROL_FACTOR = 0.9;

export function setupControls(player: Player, customMoveSpeed?: number){
    const MOVE_SPEED = customMoveSpeed ?? DEFAULT_MOVE_SPEED;
    let inputStates = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
    };

    let rotationY = 0;
    let isGrounded = false;

    const scene = player.getCapsule()?.getScene();
    if (!scene) {
        console.error("Player capsule or scene not found for input setup.");
        return;
    }

    const playerCapsuleKnownHeight = 8;
    const playerCapsuleKnownRadius = 3.5;
    const capsuleCenterToBottom = playerCapsuleKnownHeight / 2;


    window.addEventListener("keydown", (event) => {
        switch (event.key.toLowerCase()) {
            case "s": inputStates.backward = true;
                player.getAnimationGroups()[1]?.play(true); break;
            case "z": inputStates.forward = true;
                player.getAnimationGroups()[1]?.play(true); break;
            case "q": inputStates.left = true; break;
            case "d": inputStates.right = true; break;
            case " ":
                inputStates.jump = true;
                if(player.getLevel() != 1){
                    player.getAnimationGroups()[2]?.play(true);
                }
                break;
        }
    });

    window.addEventListener("keyup", (event) => {
        const currentAggregate = player.getPhysics();
        switch (event.key.toLowerCase()) {
            case "z":
                inputStates.forward = false;
                player.getAnimationGroups()[1]?.stop();
                if (currentAggregate) currentAggregate.body.setLinearVelocity(new Vector3(0, 0, 0));
                break;
            case "s":
                inputStates.backward = false;
                player.getAnimationGroups()[1]?.stop();
                if (currentAggregate) currentAggregate.body.setLinearVelocity(new Vector3(0, 0, 0));
                break;
            case "q": inputStates.left = false; break;
            case "d": inputStates.right = false; break;
            case " ":
                inputStates.jump = false;
                if(player.getLevel() != 1){
                    player.getAnimationGroups()[2]?.play(false);
                }
                
                 break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        const currentAggregate = player.getPhysics();
        const body = currentAggregate?.body;
        const transformNode = player.getCapsule();

        if (!body || !transformNode || !body.shape) {
            return;
        }

        // --- Ground Check ---
        const groundRayOrigin = transformNode.position;
        const groundRayLength = capsuleCenterToBottom + GROUND_CHECK_EXTRA_DISTANCE;
        const groundRay = new Ray(groundRayOrigin, Vector3.Down(), groundRayLength);
        const groundHit = scene.pickWithRay(groundRay, (mesh) => mesh.isPickable && mesh.checkCollisions && mesh !== transformNode);
        isGrounded = !!groundHit?.pickedMesh;

        // --- Rotation ---
        if (inputStates.left) {
            rotationY -= ROTATION_SPEED;
        }
        if (inputStates.right) {
            rotationY += ROTATION_SPEED;
        }
        if(transformNode.rotationQuaternion){
             transformNode.rotationQuaternion = Quaternion.FromEulerAngles(0, rotationY, 0);
        } else {
             transformNode.rotation = new Vector3(0, rotationY, 0);
        }

        // --- Movement Calculation ---
        const forwardWorld = transformNode.forward.negate();
        let currentLinVelocity = body.getLinearVelocity() || Vector3.Zero();
        let newVelocity = new Vector3(currentLinVelocity.x, currentLinVelocity.y, currentLinVelocity.z);

        // Calculate desired horizontal movement based *only* on forward/backward input
        let horizontalTargetVelocity = Vector3.Zero();
        if (inputStates.backward) {
            horizontalTargetVelocity.addInPlace(forwardWorld.negate().scale(MOVE_SPEED));
        }
        // Check forward obstacles only if trying to move forward (and grounded)
        if (inputStates.forward && isGrounded) {
            const forwardRayOrigin = transformNode.position.add(forwardWorld.scale(playerCapsuleKnownRadius * 0.5));
            const forwardRay = new Ray(forwardRayOrigin, forwardWorld, FORWARD_CHECK_DISTANCE);
            const forwardHit = scene.pickWithRay(forwardRay, (mesh) => mesh.isPickable && mesh.checkCollisions && mesh !== transformNode);
            if (forwardHit?.pickedMesh) {
            } else {
                 horizontalTargetVelocity.addInPlace(forwardWorld.scale(MOVE_SPEED));
             }
        } else if (inputStates.forward && !isGrounded){ // Allow forward air movement without obstacle check
             horizontalTargetVelocity.addInPlace(forwardWorld.scale(MOVE_SPEED));
        }


        if (isGrounded) {
             // --- Apply Ground Velocity ---
             if (horizontalTargetVelocity.lengthSquared() > 0.01) {
                 // Apply calculated forward/backward movement
                 newVelocity.x = horizontalTargetVelocity.x;
                 newVelocity.z = horizontalTargetVelocity.z;
             } else {
                 // No forward/backward input (could be idle or just rotating)
                 // Stop horizontal movement by setting velocity to zero
                 newVelocity.x = 0;
                 newVelocity.z = 0;
             }

        } else {
            // --- Apply Air Velocity ---
            // Calculate target horizontal velocity based on input, scaled for air control
            let airTargetVelocity = Vector3.Zero();
             if (inputStates.backward) {
                 airTargetVelocity.addInPlace(forwardWorld.negate().scale(MOVE_SPEED * AIR_CONTROL_FACTOR));
             }
             if (inputStates.forward) { // Use the same forward input check result
                  airTargetVelocity.addInPlace(forwardWorld.scale(MOVE_SPEED * AIR_CONTROL_FACTOR));
             }

             // Apply damping to current velocity
             newVelocity.x = currentLinVelocity.x * AIR_DAMPING_FACTOR;
             newVelocity.z = currentLinVelocity.z * AIR_DAMPING_FACTOR;

             // Add the air control input velocity influence
             const deltaTime = scene.getEngine().getDeltaTime() / 1000 || (1/60); // Use fallback delta time if needed
             newVelocity.x += airTargetVelocity.x * deltaTime;
             newVelocity.z += airTargetVelocity.z * deltaTime;
        }

        // --- Final Velocity Update ---
        body.setLinearVelocity(newVelocity);

        // --- Apply Jump Impulse ---
        if (inputStates.jump && isGrounded) {
             if (currentLinVelocity.y < 1) {
                body.applyImpulse(new Vector3(0, JUMP_IMPULSE, 0), transformNode.getAbsolutePosition());
                inputStates.jump = false;
                isGrounded = false;
             } else {
                 inputStates.jump = false;
             }
        } else if (inputStates.jump && !isGrounded) {
             inputStates.jump = false;
        }
    });
}