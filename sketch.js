const dots = [];
const factor = 0.01;
const count = 200;
const size = 900;

let mic, fft;

function setup() {
  createCanvas(size, size);
  background(0);

  noiseDetail(2);
  colorMode(HSB, 100);
  noFill();

  mic = new p5.AudioIn();
  mic.start();

  fft = new p5.FFT();
  fft.setInput(mic);

  radius = random(size * 0.5 / 2, size * 0.9 / 2);

  for (let i = 0; i < count; i++) {
    dots.push(new Dot(radius, [40, 80], 220, random(5)));
  }
}

function draw() {
  t = millis() / 10000;
  x = y = millis() / 2000;

  prevX = x;
  prevY = y;

  background(0); // Clear background on each frame

  let bassAmplitude = fft.getEnergy("bass"); // Get bass amplitude
  let trebleAmplitude = fft.getEnergy("treble"); // Get treble amplitude

  for (let n = 0; n < 100; n++) {
    x = sin(t - 2 * prevY) * cos(t - 2 * prevX) - random(0.6, 0.7) * cos(t - 2 * prevX) * sin(t - 2 * prevX);
    y = sin(t - 2 * prevX) * cos(t - 2 * prevY) - random(0.6, 0.7) * cos(t - 2 * prevY) * sin(t - 2 * prevY);

    strokeWeight(1);
    stroke(255); // Use white stroke for better contrast

    // Adjust point and circle size based on bass amplitude
    let pointSize = bassAmplitude / 10;
    let circleSize = (sin(x) + cos(y)) * random(0.5) * (bassAmplitude / 50);

    point(radius * x + size / 2, radius * y + size / 2);
    circle(radius * x + size / 2, radius * y + size / 2, circleSize);

    prevX = x;
    prevY = y;
  }

  // Use treble amplitude to adjust dot parameters
  let trebleMapped = map(trebleAmplitude, 0, 255, 0, 1);

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    n = noise(dot.pos.x * factor, dot.pos.y * factor);
    dot.update(n);

    // Adjust dot's size and color based on treble amplitude
    dot.adjustSizeAndColor(trebleMapped);

    dot.draw();
  }
}

class Dot {
  constructor(radius, colorRange, brightness, alpha) {
    const r = random(TWO_PI);
    const x = width / 2 + sin(r) * radius;
    const y = height / 2 + cos(r) * radius;
    this.pos = createVector(x, y);
    this.prev = createVector(x, y);
    this.color = color(0);
    this.deadCount = 0;
    this.colorRange = colorRange;
    this.alpha = alpha;
    this.brightness = brightness;
  }

  update(noize) {
    this.radius = random(size * 0.5 / 2, size * 0.9 / 2);
    this.v = p5.Vector.fromAngle(noize * TWO_PI + (this.deadCount * PI));
    this.v.setMag(2.5);
    this.prev = this.pos.copy();
    this.pos = this.pos.add(this.v);

    if (dist(width / 2, height / 2, this.pos.x, this.pos.y) > this.radius + 2) {
      this.deadCount++;
    }
  }

  adjustSizeAndColor(amplitude) {
    let newSize = this.radius + amplitude * 100;
    this.radius = constrain(newSize, size * 0.5 / 2, size * 0.9 / 2);

    let mappedColor = map(amplitude, 0, 1, 0, 100);
    this.setColor(mappedColor);
  }

  setColor(mappedColor) {
    this.color = color(mappedColor, 100, this.brightness, this.alpha);
  }

  draw() {
    if (dist(width / 2, height / 2, this.pos.x, this.pos.y) > this.radius || dist(width / 2, height / 2, this.prev.x, this.prev.y) > this.radius) {
      return;
    }

    strokeWeight(sin(this.noize * TWO_PI + (this.deadCount * PI)));
    stroke(this.color);
    point(this.pos.x, this.pos.y);
    circle(this.pos.x, this.pos.y, (sin(this.prev.x) + cos(this.prev.y)) * random(8));
    line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}
