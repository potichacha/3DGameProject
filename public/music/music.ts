//import { Scene, Sound } from "@babylonjs/core";

export class Music {

    public audioElement: HTMLAudioElement;
    public musique : string;

    constructor(musique: string) {
        this.musique = musique;
        // Créer un élément audio HTML5
        this.audioElement = new Audio();
        this.audioElement.src = this.musique; // L'URL de votre musique
        this.audioElement.loop = true; // Loop pour la musique
        this.audioElement.volume = 0.1; // Ajuster le volume de la musique
    }
    
    public playMusic() {
        this.audioElement.play().then(() => {
            //console.log("Musique de fond en lecture !");
        }).catch((error) => {
            console.error("Erreur lors de la lecture de la musique", error);
        });
    }

    public stopMusic() {
        console.log("Arrêt musique", this.audioElement.src);
        this.audioElement.pause();
        this.audioElement.currentTime = 0; // Rewind à 0
    }

    public setVolume(volume: number) {
        this.audioElement.volume = volume;
    }
}
