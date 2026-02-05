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
      const data = JSON.parse(rawData);
      return data.images || [];
    } catch (error) {
      console.error("Error loading images:", error);
      return [];
    }
  }

  getRandomImage() {
    if (this.images.length === 0) {
      console.error("No images available in images.json");
      return null;
    }

    if (this.usedImageIds.size >= this.images.length) {
      this.usedImageIds.clear();
      console.log("All images used, resetting pool");
    }

    const availableImages = this.images.filter(
      (img) => !this.usedImageIds.has(img.id),
    );

    if (availableImages.length === 0) {
      this.usedImageIds.clear();
      const shuffled = shuffle(this.images);
      const selected = shuffled[0];
      this.usedImageIds.add(selected.id);
      return selected;
    }

    const shuffled = shuffle(availableImages);
    const selected = shuffled[0];

    if (
      !selected ||
      !selected.url ||
      !selected.question ||
      selected.answer === undefined
    ) {
      console.error("Invalid image data:", selected);
      return null;
    }

    this.usedImageIds.add(selected.id);

    return selected;
  }

  getTotalImages() {
    return this.images.length;
  }
}

module.exports = ImagePicker;
