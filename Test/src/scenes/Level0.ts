import {
    Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight, 
KeyboardEventTypes, Ray, Color3, Mesh, Texture, DynamicTexture, PointLight,SceneLoader,PhysicsAggregate, PhysicsShapeType,PhysicsImpostor
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { Level } from "./Level";


export class Level0 extends Level{
    protected scene!: Scene;
    protected camera!: FollowCamera;
    protected player! : Player;
    protected canvas!: HTMLCanvasElement;

    constructor(scene: Scene,canvas: HTMLCanvasElement) {
        super(scene, canvas);
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
        }
        
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;

        const ground = MeshBuilder.CreateGround("ground", { width: 150, height: 150 }, this.scene);
        const groundMaterial = new StandardMaterial("ground", this.scene);
        groundMaterial.diffuseColor = new Color3(1, 1, 0.2);
        ground.material = groundMaterial;
        ground.position.y = 0;
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        //gestion mur chambre
        const wallMaterial = new StandardMaterial("wallMat", this.scene);
        wallMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
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
        new PhysicsAggregate(northWall, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        // Mur Sud
        const southWall = MeshBuilder.CreateBox("southWall", {
            width: groundSize,
            height: wallHeight,
            depth: wallThickness
        }, this.scene);
        southWall.position.set(0, wallHeight / 2, groundSize / 2);
        southWall.material = wallMaterial;
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
        new PhysicsAggregate(westWall, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        
        //gestion collision meuble
        const petitmeuble = MeshBuilder.CreateBox("collisionBox", {
            width: 20,
            height: 20,
            depth: 10,
        }, this.scene);
        
        petitmeuble.position = new Vector3(68, 0, 30);
        petitmeuble.rotation.y = Math.PI / 2;
        petitmeuble.visibility = 0;
        new PhysicsAggregate(petitmeuble, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const lit = MeshBuilder.CreateBox("collisionBox", {
            width: 28,
            height: 20,
            depth: 50,
        }, this.scene);
        
        lit.position = new Vector3(65, 0, 52);
        lit.rotation.y = Math.PI / 2;
        lit.visibility = 0;
        new PhysicsAggregate(lit, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const porte = MeshBuilder.CreateBox("collisionBox", {
            width: 10,
            height: 20,
            depth: 25,
        }, this.scene);
        
        porte.position = new Vector3(-30, 0, 65);
        porte.rotation.y = Math.PI / 2;
        porte.visibility = 0;
        new PhysicsAggregate(porte, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        
        const lampe = MeshBuilder.CreateBox("collisionBox", {
            width: 18,
            height: 20,
            depth: 10,
        }, this.scene);
        
        lampe.position = new Vector3(72, 0, 72);
        lampe.rotation.y = Math.PI / 2;
        lampe.visibility = 0;
        new PhysicsAggregate(lampe, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const grandmeuble = MeshBuilder.CreateBox("collisionBox", {
            width: 20,
            height: 20,
            depth: 22,
        }, this.scene);
        
        grandmeuble.position = new Vector3(72, 0, -60);
        grandmeuble.rotation.y = Math.PI / 2;
        grandmeuble.visibility = 0;
        new PhysicsAggregate(grandmeuble, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const chaise = MeshBuilder.CreateBox("collisionBox", {
            width: 15,
            height: 20,
            depth: 14,
        }, this.scene);
        
        chaise.position = new Vector3(-36, 0, -40);
        chaise.rotation.y = Math.PI / 2;
        chaise.visibility = 0;
        new PhysicsAggregate(chaise, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        const bureau = MeshBuilder.CreateBox("collisionBox", {
            width: 20,
            height: 20,
            depth: 35,
        }, this.scene);
        
        bureau.position = new Vector3(-30, 0, -61);
        bureau.rotation.y = Math.PI / 2;
        bureau.visibility = 0;
        new PhysicsAggregate(bureau, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        //gestion personnage et camera
        this.player = new Player(this.scene, new Vector3(0, 0, 0),"student.glb");
        await this.player.meshReady();
        this.player.getMesh().scaling = new Vector3(0.16, 0.16, 0.16);
        setupControls(this.player);
        super.setupFollowCamera();
        this.followCamera.heightOffset = 30; 
        this.followCamera.radius = 80;
        //this.update(); //pour debug laposition joueur
    }

    protected update() {
        this.scene.onBeforeRenderObservable.add(() => {
            console.log("📍 Player position:", this.player.getCapsulePosition());
        });
    }
    private loadLevel1() {
        console.log("🔄 Chargement du niveau 1...");
        import("./Level1").then(({ Level1 }) => { // Correction du chemin vers Level1
            new Level1(this.scene, this.canvas); // Initialise le niveau 1
        }).catch((error) => {
            console.error("❌ Erreur lors du chargement du niveau 1 :", error);
        });
    }
}