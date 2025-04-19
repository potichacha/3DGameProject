import { Scene, Vector3, Quaternion, Matrix, Ray, PickingInfo, PhysicsShapeType } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeCapsule } from "@babylonjs/core";
import { Player } from "../components/Player";

const MOVE_SPEED = 30;
const ROTATION_SPEED = 0.025;
const JUMP_IMPULSE = 50; // Keep high for now, tune later if jump works
const GROUND_CHECK_EXTRA_DISTANCE = 0.2;
const FORWARD_CHECK_DISTANCE = 0.5;
const AIR_DAMPING_FACTOR = 0.98; // Less aggressive damping
const AIR_CONTROL_FACTOR = 0.4; // Player has 40% of ground move speed in air

export function setupControls(player: Player) {
    let playerPhysicsAggregate: PhysicsAggregate | null = player.getPhysics();
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
    const playerCapsuleHalfHeight = playerCapsuleKnownHeight / 2;
    const capsuleCenterToBottom = playerCapsuleHalfHeight;


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
                break;
        }
    });

    window.addEventListener("keyup", (event) => {
        switch (event.key.toLowerCase()) {
            case "z":
                inputStates.forward = false;
                player.getAnimationGroups()[1]?.stop();
                break;
            case "s":
                inputStates.backward = false;
                player.getAnimationGroups()[1]?.stop();
                break;
            case "q": inputStates.left = false; break;
            case "d": inputStates.right = false; break;
            case " ":
                 inputStates.jump = false;
                 break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        const currentAggregate = player.getPhysics();
        const body = currentAggregate?.body;
        const transformNode = player.getCapsule();

        if (!body || !transformNode || !body.shape) {
             playerPhysicsAggregate = player.getPhysics();
            return;
        }

        // --- Ground Check ---
        const groundRayOrigin = transformNode.position;
        const groundRayLength = capsuleCenterToBottom + GROUND_CHECK_EXTRA_DISTANCE;
        const groundRay = new Ray(groundRayOrigin, Vector3.Down(), groundRayLength);
        // Exclude the player capsule itself from the ground check
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
        let newVelocity = new Vector3(currentLinVelocity.x, currentLinVelocity.y, currentLinVelocity.z); // Start with current velocity
        let canMoveForward = true; // Used only for grounded forward check

        // Calculate desired horizontal movement based on input, ignore obstacles for now
        let horizontalTargetVelocity = Vector3.Zero();
        if (inputStates.backward) {
            horizontalTargetVelocity.addInPlace(forwardWorld.negate().scale(MOVE_SPEED));
        }
        if (inputStates.forward) { // Forward obstacle check done later if grounded
             horizontalTargetVelocity.addInPlace(forwardWorld.scale(MOVE_SPEED));
        }


        if (isGrounded) {
             // --- Forward Obstacle Check (Grounded Only) ---
             if (inputStates.forward) {
                 const radius = playerCapsuleKnownRadius;
                 const forwardRayOrigin = transformNode.position.add(forwardWorld.scale(radius * 0.5)); // Check from front edge
                 const forwardRay = new Ray(forwardRayOrigin, forwardWorld, FORWARD_CHECK_DISTANCE); // Check short distance ahead
                 const forwardHit = scene.pickWithRay(forwardRay, (mesh) => mesh.isPickable && mesh.checkCollisions && mesh !== transformNode);
                 if (forwardHit?.pickedMesh) {
                     canMoveForward = false;
                     // Zero out forward component of target velocity if blocked
                     if(Vector3.Dot(horizontalTargetVelocity, forwardWorld) > 0){
                         horizontalTargetVelocity = Vector3.Zero(); // Or just remove forward component
                     }
                 }
             }

            // --- Apply Ground Velocity ---
            if (horizontalTargetVelocity.lengthSquared() > 0.01) {
                newVelocity.x = horizontalTargetVelocity.x;
                newVelocity.z = horizontalTargetVelocity.z;
            } else if (!inputStates.left && !inputStates.right) { // No input, damp horizontal velocity
                 newVelocity.x *= 0.8; // Ground damping
                 newVelocity.z *= 0.8;
            } else { // Only rotating, keep current horizontal velocity
                newVelocity.x = currentLinVelocity.x;
                newVelocity.z = currentLinVelocity.z;
            }

        } else {
            // --- Apply Air Velocity ---
            // Calculate target horizontal velocity based on input, scaled for air control
            let airTargetVelocity = Vector3.Zero();
             if (inputStates.backward) {
                 airTargetVelocity.addInPlace(forwardWorld.negate().scale(MOVE_SPEED * AIR_CONTROL_FACTOR));
             }
             if (inputStates.forward) {
                  airTargetVelocity.addInPlace(forwardWorld.scale(MOVE_SPEED * AIR_CONTROL_FACTOR));
             }

             // Apply damping to current velocity
             newVelocity.x = currentLinVelocity.x * AIR_DAMPING_FACTOR;
             newVelocity.z = currentLinVelocity.z * AIR_DAMPING_FACTOR;

             // Add the air control input velocity to the damped velocity
             // This allows changing direction mid-air, but with less authority
             newVelocity.x += airTargetVelocity.x * (scene.getEngine().getDeltaTime()/1000); // Scale by delta time for smoother acceleration feel
             newVelocity.z += airTargetVelocity.z * (scene.getEngine().getDeltaTime()/1000);

             // Optional: Clamp max air speed if desired
             // const horizontalSpeed = Math.sqrt(newVelocity.x*newVelocity.x + newVelocity.z*newVelocity.z);
             // const maxAirSpeed = MOVE_SPEED * 0.5; // Example cap
             // if(horizontalSpeed > maxAirSpeed) {
             //    newVelocity.x *= maxAirSpeed / horizontalSpeed;
             //    newVelocity.z *= maxAirSpeed / horizontalSpeed;
             // }
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