import { Quaternion, Ray, Vector3 } from "@babylonjs/core";
import { Player } from "../components/Player";

const DEFAULT_MOVE_SPEED = 30;
const ROTATION_SPEED = 0.025;
const JUMP_IMPULSE = 45;
const GROUND_CHECK_EXTRA_DISTANCE = 0.2;
const FORWARD_CHECK_DISTANCE = 0.5;
const AIR_DAMPING_FACTOR = 0.98;
const AIR_CONTROL_FACTOR = 0.9;

export function setupControls(player: Player, customMoveSpeed?: number) {
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
        switch (event.code) {
            case "KeyS":
                inputStates.backward = true;
                player.getAnimationGroups()[1]?.play(true);
                break;
            case "KeyW":
                inputStates.forward = true;
                player.getAnimationGroups()[1]?.play(true);
                break;
            case "KeyA":
                inputStates.left = true;
                break;
            case "KeyD":
                inputStates.right = true;
                break;
            case "Space":
                inputStates.jump = true;
                if (player.getLevel() !== 1) {
                    player.getAnimationGroups()[2]?.play(true);
                }
                break;
        }
    });

    window.addEventListener("keyup", (event) => {
        const currentAggregate = player.getPhysics();
        switch (event.code) {
            case "KeyW":
                inputStates.forward = false;
                player.getAnimationGroups()[1]?.stop();
                currentAggregate?.body.setLinearVelocity(new Vector3(0, 0, 0));
                break;
            case "KeyS":
                inputStates.backward = false;
                player.getAnimationGroups()[1]?.stop();
                currentAggregate?.body.setLinearVelocity(new Vector3(0, 0, 0));
                break;
            case "KeyA":
                inputStates.left = false;
                break;
            case "KeyD":
                inputStates.right = false;
                break;
            case "Space":
                inputStates.jump = false;
                if (player.getLevel() !== 1) {
                    player.getAnimationGroups()[2]?.play(false);
                }
                break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        const currentAggregate = player.getPhysics();
        const body = currentAggregate?.body;
        const transformNode = player.getCapsule();
        if (!body || !transformNode || !body.shape) return;

        // Ground check
        const groundRayOrigin = transformNode.position;
        const groundRayLength = capsuleCenterToBottom + GROUND_CHECK_EXTRA_DISTANCE;
        const groundRay = new Ray(groundRayOrigin, Vector3.Down(), groundRayLength);
        const groundHit = scene.pickWithRay(groundRay, (m) => m.isPickable && m.checkCollisions && m !== transformNode);
        isGrounded = !!groundHit?.pickedMesh;

        // Rotation
        if (inputStates.left) rotationY -= ROTATION_SPEED;
        if (inputStates.right) rotationY += ROTATION_SPEED;
        if (transformNode.rotationQuaternion) {
            transformNode.rotationQuaternion = Quaternion.FromEulerAngles(0, rotationY, 0);
        } else {
            transformNode.rotation = new Vector3(0, rotationY, 0);
        }

        // Movement
        const forwardWorld = transformNode.forward.negate();
        const currentVelocity = body.getLinearVelocity() || Vector3.Zero();
        let newVelocity = currentVelocity.clone();
        let horizontalTargetVelocity = Vector3.Zero();

        if (inputStates.backward) {
            horizontalTargetVelocity.addInPlace(forwardWorld.negate().scale(MOVE_SPEED));
        }

        if (inputStates.forward && isGrounded) {
            const forwardRayOrigin = transformNode.position.add(forwardWorld.scale(playerCapsuleKnownRadius * 0.5));
            const forwardRay = new Ray(forwardRayOrigin, forwardWorld, FORWARD_CHECK_DISTANCE);
            const forwardHit = scene.pickWithRay(forwardRay, (m) => m.isPickable && m.checkCollisions && m !== transformNode);
            if (!forwardHit?.pickedMesh) {
                horizontalTargetVelocity.addInPlace(forwardWorld.scale(MOVE_SPEED));
            }
        } else if (inputStates.forward && !isGrounded) {
            horizontalTargetVelocity.addInPlace(forwardWorld.scale(MOVE_SPEED));
        }

        if (isGrounded) {
            newVelocity.x = horizontalTargetVelocity.x;
            newVelocity.z = horizontalTargetVelocity.z;
        } else {
            let airTargetVelocity = Vector3.Zero();
            if (inputStates.backward) {
                airTargetVelocity.addInPlace(forwardWorld.negate().scale(MOVE_SPEED * AIR_CONTROL_FACTOR));
            }
            if (inputStates.forward) {
                airTargetVelocity.addInPlace(forwardWorld.scale(MOVE_SPEED * AIR_CONTROL_FACTOR));
            }

            const dt = scene.getEngine().getDeltaTime() / 1000 || 1 / 60;
            newVelocity.x = currentVelocity.x * AIR_DAMPING_FACTOR + airTargetVelocity.x * dt;
            newVelocity.z = currentVelocity.z * AIR_DAMPING_FACTOR + airTargetVelocity.z * dt;
        }

        body.setLinearVelocity(newVelocity);

        if (inputStates.jump && isGrounded) {
            if (currentVelocity.y < 1) {
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