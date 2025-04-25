import { Scene, MeshBuilder, Vector3, Mesh, SceneLoader, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";

export class PNJ {
    private scene: Scene;
    private mesh: Mesh | null = null;
    private capsule: Mesh | null = null; // Capsule physique du PNJ
    private handleInteraction: ((event: KeyboardEvent) => void) | null = null; // Référence pour l'écouteur d'événements
    private interactionObserver: any = null; // Ajout d'une référence pour l'observable

    constructor(scene: Scene, position: Vector3) {
        this.scene = scene;

        SceneLoader.ImportMeshAsync("", "./public/models/", "chat.glb", this.scene).then((result) => {
            console.log("🔍 PNJ importés :", result.meshes);

            this.mesh = result.meshes[0] as Mesh;
            this.mesh.position = position;
            this.mesh.scaling = new Vector3(2, 2, 2);

            this.mesh.checkCollisions = false;

            // Ajout de la capsule physique
            this.capsule = MeshBuilder.CreateCapsule("pnjCapsule", { height: 8, radius: 0.5 }, this.scene);
            this.capsule.position = position;
            this.capsule.visibility = 0; // Rendre la capsule invisible
            new PhysicsAggregate(this.capsule, PhysicsShapeType.CAPSULE, { mass: 0 }, this.scene);
        });
    }

    public getMesh(): Mesh | null {
        return this.mesh;
    }

    public getCapsule(): Mesh | null {
        return this.capsule;
    }

    public getPosition(): Vector3 {
        const position = this.mesh ? this.mesh.position : Vector3.Zero();
        //console.log(`📍 Position du PNJ : ${position}`);
        return position;
    }

    public disableInteraction() {
        console.log("🔒 Interaction avec le PNJ désactivée.");
        if (this.interactionObserver) {
            this.scene.onBeforeRenderObservable.remove(this.interactionObserver); // Supprime uniquement l'observable lié à l'interaction
            this.interactionObserver = null;
        }
        if (this.handleInteraction) {
            window.removeEventListener("keydown", this.handleInteraction);
            this.handleInteraction = null; // Supprime la référence
        }
    }

    public enableInteraction(onInteract: () => void, isDialogActive: () => boolean) {
        console.log("🔓 Interaction avec le PNJ activée.");
        const interactionHint = document.createElement("div");
        interactionHint.style.position = "absolute";
        interactionHint.style.bottom = "50px";
        interactionHint.style.left = "50%";
        interactionHint.style.transform = "translateX(-50%)";
        interactionHint.style.padding = "10px 20px";
        interactionHint.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        interactionHint.style.color = "white";
        interactionHint.style.fontFamily = "Arial, sans-serif";
        interactionHint.style.fontSize = "18px";
        interactionHint.style.borderRadius = "5px";
        interactionHint.style.display = "none";
        interactionHint.innerText = "Appuyez sur E pour parler";
        document.body.appendChild(interactionHint);

        const handleInteraction = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === "e" && this.capsule) {
                const playerCapsule = this.scene.getMeshByName("playerCapsule");
                if (!playerCapsule) return;

                const isIntersecting = this.capsule.intersectsMesh(playerCapsule, false);
                if (isIntersecting && !isDialogActive()) {
                    console.log("🗨️ Interaction avec le PNJ réussie !");
                    interactionHint.style.display = "none";
                    onInteract();
                }
            }
        };

        this.interactionObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (!this.capsule) return;

            const playerCapsule = this.scene.getMeshByName("playerCapsule");
            if (!playerCapsule || isDialogActive()) {
                interactionHint.style.display = "none"; // Masque le pop-up si un dialogue est actif
                return;
            }

            const isIntersecting = this.capsule.intersectsMesh(playerCapsule, false);
            interactionHint.style.display = isIntersecting ? "block" : "none";
        });

        window.addEventListener("keydown", handleInteraction);
        this.handleInteraction = handleInteraction; // Stocke la référence pour pouvoir la supprimer
    }

    public setVisible(isVisible: boolean) {
        if (this.mesh) {
            this.mesh.isVisible = isVisible;
        }
        if (this.capsule) {
            this.capsule.isVisible = isVisible;
        }
    }
}
