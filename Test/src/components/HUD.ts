    export class HUD {
        private counterElement: HTMLElement;
        private missionElement: HTMLElement;
        private distanceElement: HTMLElement;
        private healthBarContainer: HTMLElement;
        private healthBar: HTMLElement;

        constructor() {
            // Compteur
            this.counterElement = document.createElement("div");
            this.counterElement.style.position = "absolute";
            this.counterElement.style.top = "20px";
            this.counterElement.style.left = "50%";
            this.counterElement.style.transform = "translateX(-50%)";
            this.counterElement.style.fontSize = "24px";
            this.counterElement.style.color = "white";
            this.counterElement.style.fontFamily = "Arial, sans-serif";
            document.body.appendChild(this.counterElement);

            // Mission
            this.missionElement = document.createElement("div");
            this.missionElement.style.position = "absolute";
            this.missionElement.style.top = "20px";
            this.missionElement.style.right = "20px";
            this.missionElement.style.fontSize = "20px";
            this.missionElement.style.color = "white";
            this.missionElement.style.fontFamily = "Arial, sans-serif";
            this.missionElement.innerText = "Mission: Collect all items!";
            document.body.appendChild(this.missionElement);

            // Distance
            this.distanceElement = document.createElement("div");
            this.distanceElement.style.position = "absolute";
            this.distanceElement.style.top = "60px";
            this.distanceElement.style.right = "20px";
            this.distanceElement.style.fontSize = "20px";
            this.distanceElement.style.color = "white";
            this.distanceElement.style.fontFamily = "Arial, sans-serif";
            this.distanceElement.innerText = "Distance: 0m";
            document.body.appendChild(this.distanceElement);

            // Barre de vie
            this.healthBarContainer = document.createElement("div");
            this.healthBarContainer.style.position = "absolute";
            this.healthBarContainer.style.top = "20px";
            this.healthBarContainer.style.left = "20px";
            this.healthBarContainer.style.width = "200px";
            this.healthBarContainer.style.height = "20px";
            this.healthBarContainer.style.backgroundColor = "red";
            this.healthBarContainer.style.border = "2px solid black";
            document.body.appendChild(this.healthBarContainer);

            this.healthBar = document.createElement("div");
            this.healthBar.style.width = "100%";
            this.healthBar.style.height = "100%";
            this.healthBar.style.backgroundColor = "green";
            this.healthBarContainer.appendChild(this.healthBar);
        }

        update(current: number, total: number) {
            this.counterElement.innerText = `Collectibles : ${current}/${total}`;
        }

        updateDistance(distance: number, label: string) {
            this.distanceElement.innerText = `${label}: ${distance.toFixed(1)}m`;
        }

        updatePlayerHealth(health: number) {
            this.healthBar.style.width = `${Math.max(0, Math.min(health, 100))}%`; // Clamp health between 0 and 100

            // Interpolation de couleur du vert (100%) au rouge (0%)
            const red = Math.min(255, Math.floor((100 - health) * 2.55)); // Augmente le rouge  
            const green = Math.min(255, Math.floor(health * 2.55)); // Diminue le vert
            this.healthBar.style.backgroundColor = `rgb(${red}, ${green}, 0)`; // Couleur interpolée
        }

        showDistance() {
            this.distanceElement.style.display = "block"; // ✅ Affiche la distance
        }

        hideDistance() {
            this.distanceElement.style.display = "none"; // ✅ Cache la distance
        }

        showCounter() {
            this.counterElement.style.display = "block"; // ✅ Affiche le compteur
        }

        hideCounter() {
            this.counterElement.style.display = "none"; // ✅ Cache le compteur
        }

        showCollectiblesHUD() {
            this.showCounter(); // ✅ Affiche le compteur
            this.showDistance(); // ✅ Affiche la distance
        }

        hideCollectiblesHUD() {
            this.hideCounter(); // ✅ Cache le compteur
        }

        updateMission(mission: string) {
            this.missionElement.innerText = `Mission: ${mission}`;
        }

        resetHUD() {
            this.update(0, 0); // Réinitialise le compteur des collectibles
            this.updateDistance(0, ""); // Réinitialise la distance
            this.updateMission(""); // Réinitialise la mission
            this.hideCollectiblesHUD(); // Cache les collectibles
        }
    }