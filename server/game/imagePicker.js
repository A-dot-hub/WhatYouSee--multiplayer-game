const fs = require("fs");
const path = require("path");
const shuffle = require("../utils/shuffle");

class ImagePicker {
  constructor() {
    this.images = this.loadImages();
    this.usedImageIds = new Set();
  }
  loadImages() {
    try {
      const filePath = path.join(__dirname, "../data/images.json");
      const rawData = fs.readFileSync(filePath, "utf8");
      return JSON.parse(rawData).images || [];
    } catch (error) {
      console.error("Error loading images:", error);
      return [];
    }
  }
  getRandomImage() {
    if (this.images.length === 0) return null;
    if (this.usedImageIds.size >= this.images.length) this.usedImageIds.clear();
    const available = this.images.filter(
      (img) => !this.usedImageIds.has(img.id),
    );
    const selected = shuffle(available.length > 0 ? available : this.images)[0];
    this.usedImageIds.add(selected.id);
    return selected;
  }
  getTotalImages() {
    return this.images.length;
  }
}
module.exports = ImagePicker;
