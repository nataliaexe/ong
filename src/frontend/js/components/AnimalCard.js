export class AnimalCard {
  constructor(element) {
    this.element = element
  }
  
  static initAll() {
    document.querySelectorAll(".animal-card").forEach(card => new AnimalCard(card))
  }
}

export default AnimalCard
