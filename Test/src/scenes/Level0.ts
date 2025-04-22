import {
    Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight, 
KeyboardEventTypes, Ray, Color3, Mesh, Texture, DynamicTexture, PointLight,SceneLoader,PhysicsAggregate, PhysicsShapeType,PhysicsImpostor
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { Level } from "./Level";
import { DialogManager } from "../Dialog/DialogManager";
import { SceneUtils } from "../utils/SceneUtils";
import { Music } from "../music/music";

export class Level0 extends Level{
    protected scene!: Scene;
    protected camera!: FollowCamera;
    protected player! : Player;
    protected canvas!: HTMLCanvasElement;
    private levelCompleteCallback: (() => void) | null = null;
    private interactionHint!: HTMLDivElement;
    private hudMission!: HTMLDivElement;
    private handleSleepMission!: (event: KeyboardEvent) => void;
    private handleComputerInteraction!: () => void;
    private music: Music;

    constructor(scene: Scene,canvas: HTMLCanvasElement) {
        super(scene, canvas);
        this.music = new Music("./src/music/soundstrack/rendez-vous.mp3");
        this.init();
    }

    private async init() {
        await SceneLoader.AppendAsync("./src/assets/models/", "bedroom.glb", this.scene);
        console.log("🔍 Chambre importée !",);
        const bedroomMesh = this.scene.getMeshByName("__root__");
        if (bedroomMesh) {
            bedroomMesh.position.y += 10;
            bedroomMesh.position.x -= 2;
            bedroomMesh.position.z += 18;
            bedroomMesh.scaling = new Vector3(1.2, 1.2, 1.2);
            bedroomMesh.metadata = { level0: true };
        }
        
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
        light.metadata = { level0: true };

        const ground = MeshBuilder.CreateGround("ground", { width: 150, height: 150 }, this.scene);
        ground.metadata = { level0: true };

        const groundMaterial = new StandardMaterial("ground", this.scene);
        groundMaterial.diffuseColor = new Color3(1, 1, 0.2);
        groundMaterial.metadata = { level0: true };
        ground.material = groundMaterial;
        ground.position.y = 0;
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        //gestion mur chambre
        const wallMaterial = new StandardMaterial("wallMat", this.scene);
        wallMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
        wallMaterial.metadata = { level0: true };
        const wallThickness = 100;
        const wallHeight = 100;
        const groundSize = 250;
        const northWall = MeshBuilder.CreateBox("northWall", {
            width: groundSize,
            height: wallHeight,
            depth: wallThickness
        }, this.scene);
        northWall.position.set(0, wallHeight / 2, -groundSize / 2);
        northWall.material = wallMaterial;
        northWall.metadata = { level0: true };
        new PhysicsAggregate(northWall, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        // Mur Sud
        const southWall = MeshBuilder.CreateBox("southWall", {
            width: groundSize,
            height: wallHeight,
            depth: wallThickness
        }, this.scene);
        southWall.position.set(0, wallHeight / 2, groundSize / 2);
        southWall.material = wallMaterial;
        console.log("🆕 Création de", southWall.name);
        southWall.metadata = { level0: true };
        new PhysicsAggregate(southWall, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        // Mur Est
        const eastWall = MeshBuilder.CreateBox("eastWall", {
            width: groundSize,
            height: wallHeight,
            depth: wallThickness
        }, this.scene);
        eastWall.rotation.y = Math.PI / 2;
        eastWall.position.set(groundSize / 2, wallHeight / 2, 0);
        eastWall.material = wallMaterial;
        eastWall.metadata = { level0: true };
        new PhysicsAggregate(eastWall, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        // Mur Ouest
        const westWall = MeshBuilder.CreateBox("westWall", {
            width: groundSize,
            height: wallHeight,
            depth: wallThickness
        }, this.scene);
        westWall.rotation.y = Math.PI / 2; // Rotation pour orienter le mur
        westWall.position.set(-groundSize / 2, wallHeight / 2, 0);
        westWall.material = wallMaterial;
        westWall.metadata = { level0: true };
        new PhysicsAggregate(westWall, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        
        //gestion collision meuble
        const petitmeuble = MeshBuilder.CreateBox("petitmeuble", {
            width: 20,
            height: 20,
            depth: 10,
        }, this.scene);
        
        petitmeuble.position = new Vector3(68, 0, 30);
        petitmeuble.rotation.y = Math.PI / 2;
        petitmeuble.visibility = 0;
        petitmeuble.metadata = { level0: true };
        new PhysicsAggregate(petitmeuble, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const lit = MeshBuilder.CreateBox("lit", {
            width: 28,
            height: 20,
            depth: 50,
        }, this.scene);
        
        lit.position = new Vector3(65, 0, 52);
        lit.rotation.y = Math.PI / 2;
        lit.visibility = 0;
        lit.metadata = { level0: true };
        new PhysicsAggregate(lit, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const porte = MeshBuilder.CreateBox("porte", {
            width: 10,
            height: 20,
            depth: 25,
        }, this.scene);
        
        porte.position = new Vector3(-30, 0, 65);
        porte.rotation.y = Math.PI / 2;
        porte.visibility = 0;
        porte.metadata = { level0: true };
        new PhysicsAggregate(porte, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        
        const lampe = MeshBuilder.CreateBox("lampe", {
            width: 18,
            height: 20,
            depth: 10,
        }, this.scene);
        
        lampe.position = new Vector3(72, 0, 72);
        lampe.rotation.y = Math.PI / 2;
        lampe.visibility = 0;
        lampe.metadata = { level0: true };
        new PhysicsAggregate(lampe, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const grandmeuble = MeshBuilder.CreateBox("grandmeuble", {
            width: 20,
            height: 20,
            depth: 22,
        }, this.scene);
        
        grandmeuble.position = new Vector3(72, 0, -60);
        grandmeuble.rotation.y = Math.PI / 2;
        grandmeuble.visibility = 0;
        grandmeuble.metadata = { level0: true };
        new PhysicsAggregate(grandmeuble, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const chaise = MeshBuilder.CreateBox("chaise", {
            width: 15,
            height: 20,
            depth: 14,
        }, this.scene);
        
        chaise.position = new Vector3(-36, 0, -40);
        chaise.rotation.y = Math.PI / 2;
        chaise.visibility = 0;
        chaise.metadata = { level0: true };
        new PhysicsAggregate(chaise, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const bureau = MeshBuilder.CreateBox("bureau", {
            width: 20,
            height: 20,
            depth: 35,
        }, this.scene);
        
        bureau.position = new Vector3(-30, 0, -61);
        bureau.rotation.y = Math.PI / 2;
        bureau.visibility = 0;
        bureau.metadata = { level0: true };
        new PhysicsAggregate(bureau, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        // Ajout d'une zone d'interaction pour l'ordinateur
        const ordinateur = MeshBuilder.CreateBox("ordinateur", {
            width: 10,
            height: 10,
            depth: 10,
        }, this.scene);
        ordinateur.position = new Vector3(-22.53, 4, -47.48); // Updated position of the computer
        ordinateur.visibility = 0;
        ordinateur.metadata = { level0: true };

        this.interactionHint = document.createElement("div");
        this.interactionHint.style.position = "absolute";
        this.interactionHint.style.bottom = "50px";
        this.interactionHint.style.left = "50%";
        this.interactionHint.style.transform = "translateX(-50%)";
        this.interactionHint.style.padding = "10px 20px";
        this.interactionHint.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.interactionHint.style.color = "white";
        this.interactionHint.style.fontFamily = "Arial, sans-serif";
        this.interactionHint.style.fontSize = "18px";
        this.interactionHint.style.borderRadius = "5px";
        this.interactionHint.style.display = "none";
        this.interactionHint.innerText = "Appuyez sur E pour utiliser l'ordinateur";
        document.body.appendChild(this.interactionHint);

        this.hudMission = document.createElement("div");
        this.hudMission.style.position = "absolute";
        this.hudMission.style.top = "20px";
        this.hudMission.style.right = "20px";
        this.hudMission.style.fontSize = "20px";
        this.hudMission.style.color = "white";
        this.hudMission.style.fontFamily = "Arial, sans-serif";
        this.hudMission.innerText = "Mission: ";
        document.body.appendChild(this.hudMission);

        const updateHUD = (mission: string) => {
            this.hudMission.innerText = `Mission: ${mission}`;
        };

        const dialogManager = new DialogManager(this.scene);

        // Dialogue initial
        dialogManager.startLevel0Intro(() => {
            updateHUD("Aller sur l'ordinateur");
        });

        // Interaction avec l'ordinateur
        this.handleComputerInteraction = () => {
            dialogManager.showChatStyleDialog([
                "[Ami] Hey, t'as révisé pour le partiel ?",
                "[Moi] Euh... pas vraiment. Et toi ?",
                "[Ami] Ouais, un peu. Mais c'est chaud. J'ai l'impression que ça va être compliqué.",
                "[Moi] Ouais, pareil. J'ai ouvert mes notes, mais j'ai fini par regarder des vidéos sur YouTube.",
                "[Ami] Haha, classique. Moi aussi, j'ai perdu une heure sur des memes avant de m'y mettre.",
                "[Moi] Franchement, je me dis que je vais y aller au talent.",
                "[Ami] Sérieux ? T'as pas peur de te planter ?",
                "[Moi] Bah, on verra bien. Au pire, c'est qu'un partiel.",
                "[Ami] T'es vraiment un sinj.",
                "[Moi] Haha, merci. Bonne chance pour le partiel !",
                "[Ami] Merci, toi aussi... enfin si tu te décides à bosser un jour."
            ], () => {
                dialogManager.startLevel0SleepDialog(() => {
                    updateHUD("Aller au lit");
                    window.addEventListener("keydown", this.handleSleepMission);
                });
            });
        };

        this.handleSleepMission = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === "e") {
                const playerPosition = this.player.getCapsulePosition();
                const distanceToBed1 = Vector3.Distance(playerPosition, new Vector3(49, 4, 34));
                const distanceToBed2 = Vector3.Distance(playerPosition, new Vector3(31.231, 4, 62.546));
                if (distanceToBed1 < 10 || distanceToBed2 < 10) {
                    console.log("💤 Aller au lit !");
                    this.loadLevel1();
                }
            }
        };

        this.scene.onBeforeRenderObservable.add(() => { 
            const playerPosition = this.player.getCapsulePosition();
            const distanceToComputer = Vector3.Distance(playerPosition, ordinateur.position);
            const distanceToBed1 = Vector3.Distance(playerPosition, new Vector3(49, 4, 34));
            const distanceToBed2 = Vector3.Distance(playerPosition, new Vector3(31.231, 4, 62.546));
            //console.log("Distance to Bed 1:", distanceToBed1);
            //console.log("Distance to Bed 2:", distanceToBed2);

            if (distanceToComputer < 10) {
                this.interactionHint.innerText = "Appuyez sur E pour utiliser l'ordinateur";
                this.interactionHint.style.display = "block";
            } else if (distanceToBed1 < 10 || distanceToBed2 < 10) {
                this.interactionHint.innerText = "Appuyez sur E pour aller dormir";
                this.interactionHint.style.display = "block";
            } else {
                this.interactionHint.style.display = "none";
            }
        });

        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "e") {
                const playerPosition = this.player.getCapsulePosition();
                const distanceToComputer = Vector3.Distance(playerPosition, new Vector3(-24, 4, -45)); // Updated coordinates for the computer
                if (distanceToComputer < 10) {
                    console.log("💻 Interaction avec l'ordinateur !");
                    this.interactionHint.style.display = "none";
                    this.handleComputerInteraction();
                }
            }
        });

        // Gestion personnage et caméra
        this.player = new Player(this.scene, new Vector3(0, 0, 0), "student.glb",0); // Removed the extra "level0" argument
        await this.player.meshReady();
        this.player.getMesh().scaling = new Vector3(0.16, 0.16, 0.16);
        setupControls(this.player, 240);
        super.setupFollowCamera();
        this.followCamera.heightOffset = 30; 
        this.followCamera.radius = 80;
        this.update(); // Pour debug la position joueur

        // Déclenche la fin du niveau après un délai (par exemple, une cinématique ou un événement)
        setTimeout(() => {
            console.log("🎉 Niveau 0 terminé !");
            if (this.levelCompleteCallback) {
                this.levelCompleteCallback();
            }
        }, 5000); // 5 secondes pour simuler une cinématique ou un événement
    }

    protected update() {
        this.scene.onBeforeRenderObservable.add(() => {
            //console.log("📍 Player position:", this.player.getCapsulePosition());
            
        });
        window.addEventListener("keydown", () => {
            this.music.playMusic();
        }, { once: true });
        window.addEventListener("click", () => {
            this.music.playMusic();
        }, { once: true });
    }

    public async disposeLevel() {
        console.log("🧹 Nettoyage du Level0...");
        // Dispose only resources marked with level0
        this.scene.meshes.forEach(mesh => {
            if (mesh.metadata?.level0) {
                console.log("Disposing", mesh.name);
                if (mesh.physicsBody) {
                    console.log("Disposing physics body for", mesh.name);
                    mesh.physicsBody.dispose();
                }
                mesh.dispose(false, true);
            }
        });

        if (this.player?.getPhysics()?.body) {
            this.player?.getPhysics()?.body.dispose();
        }
        
        const playerMesh = this.player.getMesh?.();
        if (playerMesh?.dispose) {
            playerMesh.dispose();
        }

        this.scene.meshes.forEach(mesh => {
            if (mesh.metadata?.level0) {
                mesh.dispose(false, true);
            }
        });

        this.scene.lights.forEach(light => {
            if (light.metadata?.level0) {
                light.dispose();
            }
        });

        this.scene.materials.forEach(mat => {
            if (mat.metadata?.level0) {
                mat.dispose();
            }
        });

        this.scene.textures.forEach(tex => {
            if (tex.metadata?.level0) {
                tex.dispose();
            }
        });

        this.scene.cameras.forEach(cam => {
            if (cam.metadata?.level0) {
                cam.dispose();
            }
        });
        this.scene.meshes.forEach(mesh => {
            if (!mesh.metadata?.level0) {
            }
        });

        // Clear observables and keyboard events
        this.scene.onBeforeRenderObservable.clear();
        this.scene.onKeyboardObservable.clear();

        window.removeEventListener("keydown", this.handleSleepMission);
        window.removeEventListener("keydown", this.handleComputerInteraction);

        // Remove DOM elements
        document.body.removeChild(this.interactionHint);
        document.body.removeChild(this.hudMission);
        this.scene.meshes
    .filter(m => m.name !== "__root__")
    .forEach(m => {
        m.dispose(false, true);
    });
        this.music.stopMusic();
        console.log("✅ Level nettoyé !");
        const restants = this.scene.meshes.filter(m => m.name !== "__root__");
        console.log("🧱 Meshes vraiment restants :", restants.map(m => m.name));
        this.scene.onBeforeRenderObservable.clear();
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    private async loadLevel1() {
        console.log("🔄 Chargement du niveau 1...");

        await this.disposeLevel(); // 🧹 Nettoie le niveau 0 (DOM, événements)
        //SceneUtils.softClear(this.scene); // 🧹 Nettoyage doux de la scène

        this.scene.executeWhenReady(() => {
            import("./Level1").then(({ Level1 }) => {
                new Level1(this.scene, this.canvas);
            }).catch(console.error);
        });
    }

    public onLevelComplete(callback: () => void) {
        this.levelCompleteCallback = callback;
    }
}