// 📄 DialogManager.ts
import { Scene } from "@babylonjs/core";
import { PNJ } from "../components/PNJ";
import { HUD } from "../components/HUD";

export class DialogManager {
    private dialogBox: HTMLElement;
    private intervalId: number | null = null;
    private scene: Scene;
    private introComplete: boolean = false;

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
            border: "2px solid white",
            animation: "pulse 1.5s infinite",
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

    private showDialog(lines: string[], onComplete: () => void) {
        let index = 0;
        const skipHint = " <span style='opacity: 0.7;'>(Appuyez sur Espace pour continuer)</span>";

        const showLine = () => {
            const [speaker, text] = this.extractSpeakerAndText(lines[index]);
            this.typeText(speaker, text, () => {
                window.addEventListener("keydown", waitForSpace);
            });
        };

        const waitForSpace = (event: KeyboardEvent) => {
            if (event.code === "Space") {
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

    private extractSpeakerAndText(line: string): [string, string] {
        const match = line.match(/^\[(.+?)\]\s*(.+)$/);
        if (match) {
            return [match[1], match[2]];
        }
        return ["", line];
    }

    private typeText(speaker: string, text: string, onFinish: () => void) {
        let index = 0;
        this.dialogBox.innerHTML = speaker ? `<strong>${speaker}:</strong><br/>` : "";

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

    public hasSeenIntro(): boolean {
        return this.introComplete;
    }

    public startIntroMonologue(onComplete: () => void) {
        const lines = [
            "[Moi] Où est-ce que je suis...?",
            "[Moi] C'est si sombre ici... et silencieux.",
            "[Moi] Je ne me souviens de rien...",
            "[Moi] Attends... là-bas... quelqu’un ?",
            "[Moi] Peut-être qu’il pourra m’aider..."
        ];

        this.showDialog(lines, () => {
            this.introComplete = true;
            onComplete();
        });
    }

    public startFirstPNJDialog(onComplete: () => void) {
        const lines = [
            "[Inconnu] Bienvenue dans ton cauchemar, voyageur.",
            "[Inconnu] Ici, tout ce que tu crains prend vie.",
            "[Inconnu] Si tu veux t’en sortir, il te faudra récupérer les fragments de ton esprit : les collectibles.",
            "[Inconnu] Mais attention, ce monde est dangereux. Des créatures rôdent.",
            "[Inconnu] Une astuce : appuie sur V pour te voir d’en haut. Ça t’aidera à t’orienter.",
            "[Inconnu] Bonne chance... tu vas en avoir besoin."
        ];

        this.showDialog(lines, onComplete);
    }

    public startAllCollectedDialog(onComplete: () => void) {
        const lines = [
            "[Inconnu] Tu l’as fait. Tu as tout récupéré.",
            "[Inconnu] Pas mal pour un rêveur perdu.",
            "[Inconnu] Mais ce n’est pas encore fini...",
            "[Inconnu] La prochaine zone t’attend. Rejoins-la.",
            "[Inconnu] On se reverra… bientôt."
        ];

        this.showDialog(lines, onComplete);
    }

    public startLevel0Intro(onComplete: () => void) {
        const lines = [
            "[Moi] Je suis tellement stressé... J'ai un partiel bientôt, mais j'ai la flemme de réviser.",
            "[Moi] Peut-être que mon ami a révisé ?"
        ];

        this.showDialog(lines, onComplete);
    }

    public startLevel0ComputerDialog(onComplete: () => void) {
        const lines = [
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
        ];

        this.showDialog(lines, onComplete);
    }

    public startLevel0SleepDialog(onComplete: () => void) {
        const lines = [
            "[Moi] Bon... Je vais aller dormir."
        ];

        this.showDialog(lines, onComplete);
    }

    public showChatStyleDialog(lines: string[], onComplete: () => void) {
        let index = 0;

        const chatBox = document.createElement("div");
        chatBox.style.position = "absolute";
        chatBox.style.bottom = "10px";
        chatBox.style.left = "10px";
        chatBox.style.width = "300px";
        chatBox.style.maxHeight = "300px";
        chatBox.style.overflowY = "auto";
        chatBox.style.backgroundColor = "#1e1e1e";
        chatBox.style.border = "1px solid #555";
        chatBox.style.borderRadius = "8px";
        chatBox.style.padding = "10px";
        chatBox.style.color = "#eee";
        chatBox.style.fontFamily = "monospace";
        chatBox.style.fontSize = "16px";
        chatBox.style.zIndex = "999";
        document.body.appendChild(chatBox);

        const nextLine = () => {
            if (index >= lines.length) {
                window.removeEventListener("keydown", handleKey);
                document.body.removeChild(chatBox);
                onComplete();
                return;
            }

            const [speaker, text] = this.extractSpeakerAndText(lines[index]);
            const bubble = document.createElement("div");
            bubble.style.marginBottom = "8px";
            bubble.innerHTML = `<strong style="color:#4fc3f7;">${speaker}</strong>: ${text}`;
            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
            index++;
        };

        const handleKey = (event: KeyboardEvent) => {
            if (event.code === "Space") {
                event.preventDefault();
                nextLine();
            }
        };

        window.addEventListener("keydown", handleKey);
        nextLine();
    }
}

// Tu pourras appeler ces méthodes depuis Level1.ts à différents moments du jeu.