export class HUD {
    private counterElement: HTMLElement;

    constructor() {
        // 📌 Création de l'élément HTML pour afficher le compteur
        this.counterElement = document.createElement("div");
        this.counterElement.style.position = "absolute";
        this.counterElement.style.top = "20px";
        this.counterElement.style.left = "50%";
        this.counterElement.style.transform = "translateX(-50%)";
        this.counterElement.style.fontSize = "24px";
        this.counterElement.style.color = "white";
        this.counterElement.style.fontFamily = "Arial, sans-serif";
        document.body.appendChild(this.counterElement);

        this.update(0, 3); // Par défaut, 0/3 collectibles
    }

    update(current: number, total: number) {
        this.counterElement.innerText = `Collectibles : ${current}/${total}`;
    }
}