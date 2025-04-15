import { Scene } from "@babylonjs/core";
import { PNJ } from "../components/PNJ";
import { HUD } from "../components/HUD";

export class DialogManager {
    private dialogBox: HTMLElement;
    private intervalId: number | null = null;
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;

        this.dialogBox = document.createElement("div");
        Object.assign(this.dialogBox.style, {
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            borderRadius: "10px",
            border: "2px solid white", // Ajout d'une bordure
            animation: "pulse 1.5s infinite", // Animation pour attirer l'attention
            display: "none",
        });

        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes pulse {
                0% { border-color: white; }
                50% { border-color: rgba(255, 255, 255, 0.5); }
                100% { border-color: white; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(this.dialogBox);
    }

    public showDialog(lines: string[], onComplete: () => void) {
        let index = 0;
        const skipHint = " <span style='opacity: 0.7;'>(Appuyez sur Espace pour continuer)</span>";

        const showLine = () => {
            this.typeText(lines[index], () => {
                window.addEventListener("keydown", waitForSpace);
            });
        };

        const waitForSpace = (event: KeyboardEvent) => {
            if (event.key === " ") {
                window.removeEventListener("keydown", waitForSpace);
                index++;
                if (index < lines.length) {
                    showLine();
                } else {
                    this.hide();
                    onComplete();
                }
            }
        };

        this.dialogBox.style.display = "block";
        showLine();
    }

    private typeText(text: string, onFinish: () => void) {
        let index = 0;
        this.dialogBox.innerHTML = "";

        if (this.intervalId !== null) window.clearInterval(this.intervalId);

        this.intervalId = window.setInterval(() => {
            if (index < text.length) {
                this.dialogBox.innerHTML += text[index] === ' ' ? '&nbsp;' : text[index];
                index++;
            } else {
                if (this.intervalId !== null) window.clearInterval(this.intervalId);
                this.dialogBox.innerHTML += " <span style='opacity: 0.7;'>(Appuyez sur Espace pour continuer)</span>";
                onFinish();
            }
        }, 50);
    }

    public hide() {
        this.dialogBox.style.display = "none";
    }

    public initIntroDialog(scene: Scene, pnj: PNJ, hud: HUD, onComplete: () => void) {
        this.showDialog(
            [
                "Hmm... Où suis-je ?",
                "Tout semble si étrange... Ces murs, ce silence...",
                "On dirait un labyrinthe géant. Mais pourquoi suis-je ici ?",
                "Oh, attends... Je vois quelqu'un au loin.",
                "Peut-être qu'il pourra m'aider à comprendre ce qui se passe."
            ],
            onComplete
        );
    }

    public startPNJDialog(lines: string[], onComplete: () => void) {
        this.showDialog(lines, () => {
            console.log("🗨️ Dialogue avec le PNJ terminé.");
            onComplete();
        });
    }
}