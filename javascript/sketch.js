let mic;
let fft;
let spectrum;
const dots = [];
const count = 200;
let canvasSize;
let maxFrameRate = 60;
let minFrameRate = 10;

let isRunning = false;

let osc;
let playing = false;
let interval;
let currentNoteIndex = 0;
let notes = [60, 62, 64, 65, 67, 69, 71, 72]; // MIDI音符

let fadeOutDuration = 0.1; // 渐出持续时间（秒）
let fadeOutInterval = 10; // 渐出的时间间隔（毫秒）

const savedImages = [];

let currentView = 'animation'; // 'animation' or 'gallery'

let playButton; // Declare the button globally
let description;
let description2;
let description3;
let HEADdescription;

// Create an AudioContext
let myAudio = document.getElementById("myAudio");
var startButton = document.createElement('button');
startButton.textContent = 'Start';

// Add a click event listener to the Buttons
startButton.addEventListener('click', function () {
  start();
  document.body.removeChild(startButton);
});

document.body.appendChild(startButton);

function setup() {
  canvasSize = Math.min(window.innerWidth, window.innerHeight*0.9);
  createCanvas(window.innerWidth, window.innerHeight);
  background(0);

  noiseDetail(2);
  colorMode(HSB, 100);
  noFill();

  const radius = random(canvasSize * 0.5 / 2, canvasSize * 0.9 / 2);

  for (let i = 0; i < count; i++) {
    dots.push(new Dot(radius, [40, 80], 220, random(5)));
  }

  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0, 256);
  fft.setInput(mic);
  
  HEADdescription = createP('Open the microphone and try to control the graphics with different voices.');
  HEADdescription.position(32, 0); // 设置描述文字的位置
  HEADdescription.addClass('HEADdescription');
}

function start() {
	getAudioContext().resume();

  // Create the Restart button
  let startButton = createButton('Draw Emotion');
  startButton.mousePressed(restartAnimation);

  // Create the Stop/Continue button
  let stopContinueButton = createButton('Stop/Continue');
  stopContinueButton.mousePressed(toggleAnimation1);


  // Create the Clear Canvas button
  let clearButton = createButton('Clear Canva');
  clearButton.mousePressed(clearCanvas);
 

  // Create the View Gallery button
  let viewGalleryButton = createButton('View Gallery');
  viewGalleryButton.mousePressed(viewGallery);
  viewGalleryButton.position(width - viewGalleryButton.width - 32,70);

  // Create the Save button  
  let saveButton = createButton('Save to Gallery');
  saveButton.mousePressed(saveCanvasImage);
  saveButton.position(width - viewGalleryButton.width- saveButton.width - 32,70);
  

  // Create the Play Music button
  playButton = createButton('Play Music');
  playButton.mousePressed(toggleMusic);
  playButton.position(width / 2 - playButton.width / 2, height+30 );

  // Create a paragraph for description
  description = createP('Click "Play Music" to listen to the sound of emotion.');
  description.addClass('description'); // 添加自定义类名
  centerDescription(); // 调用函数使描述文字居中

  description2 = createP('-Click "Draw Emotion" to draw the emotion with speaking.');
  description2.position(32, viewGalleryButton.height*3+12); // 设置描述文字的位置

  description3 = createP('-Click "Save to Gallery" to save the emotion as an image into Emotion Gallery.<br>-Click "View Gallery" to view the saved emotions.');
  description3.position(width - description3.width - 32, viewGalleryButton.height*3+12); // 设置描述文字的位置
  description3.addClass('description3');
}

function centerDescription() {
  let x = width / 2-description.width / 2;
  let y = playButton.position().y + playButton.height/2+12; // 在按钮下方一定距离
  description.position(x, y);
}

function startAnimation() {
  isRunning = true;
  background(0); // Clear the canvas when starting or restarting
}

function stopAnimation() {
  isRunning = false;
}

function draw() {
  if (isRunning) {
    t = millis() / 10000;
    x = y = millis() / 2000;

    prevX = x;
    prevY = y;

    for (let n = 0; n < 100; n++) {
      x = sin(t - 2 * prevY) * cos(t - 2 * prevX) - random(0.6, 0.7) * cos(t - 2 * prevX) * sin(t - 2 * prevX);
      y = sin(t - 2 * prevX) * cos(t - 2 * prevY) - random(0.6, 0.7) * cos(t - 2 * prevY) * sin(t - 2 * prevY);

      strokeWeight(1);
      color(255);

      const centerX = width / 2;
      const centerY = height / 2;
      point(centerX + canvasSize * 0.45 * x, centerY + canvasSize * 0.45 * y);
      circle(centerX + canvasSize * 0.45 * x, centerY + canvasSize * 0.45 * y, (sin(x) + cos(y)) * random(0.5));

      prevX = x;
      prevY = y;
    }

    spectrum = fft.analyze();

    // Calculate the average amplitude of the audio spectrum
    let averageAmplitude = 0;
    for (let i = 0; i < spectrum.length; i++) {
      averageAmplitude += spectrum[i];
    }
    averageAmplitude /= spectrum.length;

    // Amplify the effect of audio on frame rate adjustment
    let audioEffect = map(averageAmplitude, 0, 255, 0.5, 2); // Adjust the range for effect

    // Adjust the frame rate based on the audio effect
    let newFrameRate = map(audioEffect, 0.5, 2, minFrameRate, maxFrameRate);
    frameRate(newFrameRate * 300);

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const noize = map(spectrum[i % spectrum.length], 0, 255, 0, 1);
      dot.update(noize);
      dot.draw(noize);
    }
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
    this.radius = random(canvasSize * 0.5 / 2, canvasSize * 0.9 / 2);

    this.v = p5.Vector.fromAngle(noize * TWO_PI + (this.deadCount * PI));
    this.v.setMag(2.5);

    // Adjust color mapping for more color variation
    const mappedNoize = map(noize, 0, 1, -1, 1);

    // Generate color using HSB color space for more diverse color changes
    const hue = map(mappedNoize, -1, 1, 0, 100);
    const saturation = map(noize, 0, 1, 50, 100);
    const brightness = map(noize, 0, 1, 50, 100);

    this.color = color(hue, saturation, brightness, this.alpha);

    this.prev = this.pos.copy();
    this.pos = this.pos.add(this.v);

    if (dist(width / 2, height / 2, this.pos.x, this.pos.y) > this.radius + 2) {
      this.deadCount++;
    }
  }

  draw(noize) {
    if (dist(width / 2, height / 2, this.pos.x, this.pos.y) > this.radius || dist(width / 2, height / 2, this.prev.x, this.prev.y) > this.radius) {
      return;
    }

    strokeWeight(noize * 5 + 1);
    stroke(this.color);
    point(this.pos.x, this.pos.y);
    circle(this.pos.x, this.pos.y, (sin(this.prev.x) + cos(this.prev.y)) * random(8));
    line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}



function restartAnimation() {
  isRunning = true;
  background(0); // Clear the canvas when restarting
  loop(); // Start the animation loop
}

function toggleAnimation1() {
  isRunning = !isRunning;
  continueText = isRunning ? "Continue" : "Stop";
  if (isRunning) {
    loop(); // Resume animation
  } else {
    noLoop(); // Pause animation
  }
}

function saveCanvasImage() {
  let img = get();
  savedImages.push(get()); // Save the current canvas as an image
}

let isPlayingMusic = false; // Track whether music is currently playing

function toggleMusic() {
  if (isPlayingMusic) {
    stopMusic();
    playButton.html('Play Music'); // Update button text
  } else {
    playmusic();
    playButton.html('Stop Music'); // Update button text
  }
  isPlayingMusic = !isPlayingMusic; // Toggle the state
}

function playmusic() {
  let img = get();
  savedImages.push(get());
  playSound(img);
}

function playSound(img) {
  isRunning = !isRunning;

  osc = new p5.Oscillator();
  osc.setType('sine');
  playMusicWithFade(img);
}


function playMusicWithFade(img) {
  let bpm = 120; // 每分钟节拍数
  let noteDuration = 0.25; // 音符持续时间（秒）
  let spacing = (60 / bpm) * noteDuration * 1000; // 音符之间的时间间隔（毫秒）

  interval = setInterval(function() {
    if (currentNoteIndex >= img.width) {
      stopMusic();
      return;
    }

    let imgX = floor(map(currentNoteIndex, 0, img.width, 0, img.width - 1));
    let pixelColor = img.get(imgX, floor(height / 2));
    
    let r = pixelColor[0];
    let g = pixelColor[1];
    let b = pixelColor[2];
    
    let freq = map((r + g + b) / 3, 0, 255, 200, 800); // 映射颜色到音调
    let noteIndex = floor(map(freq, 200, 800, 0, notes.length - 1));
    let amp = map(brightness(pixelColor), 0, 255, 0.1, 0.5); // 映射亮度到音量
    
    let note = notes[noteIndex];
    
    let rhythmPattern = (currentNoteIndex % 8 < 4) ? [0.125, 0.125, 0.125, 0.125] : [0.5, 0.5, 0.5, 0.5];
    let noteDuration = rhythmPattern[currentNoteIndex % rhythmPattern.length];
    
    playChordWithFadeInAndOut(note, amp, noteDuration * 0.9);
    
    currentNoteIndex++;
  }, spacing);
}

function playChordWithFadeInAndOut(rootNote, amp, duration) {
  let thirdNote = rootNote + 4; // 第三音程
  let fifthNote = rootNote + 7; // 第五音程
  
  playNoteWithFadeInAndOut(rootNote, amp, duration);
  playNoteWithFadeInAndOut(thirdNote, amp * 0.7, duration);
  playNoteWithFadeInAndOut(fifthNote, amp * 0.5, duration);
}

function playNoteWithFadeInAndOut(note, amp, duration) {
  osc.freq(midiToFreq(note));
  osc.amp(0); // 将音量设置为0，准备进行渐入效果
  osc.start();

  // 渐入效果
  let fadeInDuration = 0.1; // 渐入持续时间（秒）
  let fadeInInterval = 10; // 渐入的时间间隔（毫秒）
  let fadeInStep = amp / (fadeInDuration * 1000 / fadeInInterval);
  
  let fadeInIntervalId = setInterval(function() {
    if (osc.amp().value + fadeInStep < amp) {
      osc.amp(osc.amp().value + fadeInStep);
    } else {
      osc.amp(amp);
      clearInterval(fadeInIntervalId);
    }
  }, fadeInInterval);

  setTimeout(function() {
    // 渐出效果

    let fadeOutStep = amp / (fadeOutDuration * 1000 / fadeOutInterval);
    
    let fadeOutIntervalId = setInterval(function() {
      if (osc.amp().value - fadeOutStep > 0) {
        osc.amp(osc.amp().value - fadeOutStep);
      } else {
        osc.amp(0);
        osc.stop();
        clearInterval(fadeOutIntervalId);
      }
    }, fadeOutInterval);
  }, duration * 1000 - fadeOutDuration * 1000);
}

function stopMusic() {
  clearInterval(interval);
  currentNoteIndex = 0;
  if (osc) {
    osc.amp(0, fadeOutDuration); // Use fadeOutDuration for a smooth fade out
    setTimeout(() => {
      osc.stop();
    }, fadeOutDuration * 1000);
  }
}

function viewGallery() {
  const galleryWindow = window.open('', '_blank');
  galleryWindow.document.write('<html><head><title>Gallery</title></head><body>');
  
  // Add CSS and Back button to the gallery layout
  galleryWindow.document.write(`
    <style>
      .gallery {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .gallery img {
        max-width: 31vw;
        cursor: pointer;
        position: relative;
        top: -40;
        left: 10;
        border: 1px solid #999; 
        border-radius: 10px;
      }
      .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      .lightbox img {
        max-width: 80%;
        max-height: 80%;
      }
      .gallery-title {
        text-align: center;
        color: white;
        font-size: 30px;
        font-weight: bold;
        top: -40px;
        position: relative;
      }
      
      body{
        background: black;
      }
      
      .back-button {
        background-color: black;
        color: white;
        font-size: 16px;
        padding: 6px 12px;
        border: none;
        border-radius: 10px;
        text-transform: uppercase;
        font-weight: bold;
        overflow: hidden;
        z-index: 1;
        left: 20px;
        top: 10px;
      }
      
      .back-button:before {
        content: "";
        background: linear-gradient(90deg, #3bacc5, #e49f0b);
        position: absolute;
        top: 0;
        right: 0;
        width: 0%;
        height: 100%;
        z-index: -1;
        transition: all 0.3s ease-in-out;
      }
      
      .back-button:hover:before {
        width: 100%;
      }

    </style>
  `);

  galleryWindow.document.write(`
    <button class="back-button" onclick="switchToAnimation()">Back to Draw</button>
  `);

  
    // Back button to switch back to the animation view
    galleryWindow.document.write(`
    <h5 class="gallery-title">Emotion Gallery</h5>
  `);
  
  // Create the gallery container
  galleryWindow.document.write('<div class="gallery">');

  // Display saved images in the gallery
  for (let i = savedImages.length - 1; i >= 0; i--) {
    const imgData = savedImages[i].canvas.toDataURL();
    galleryWindow.document.write(`
      <img
        src="${imgData}"
        alt="Gallery Image ${i + 1}"
        onclick="showImage('${imgData}')"
      />
    `);
  }

  //galleryWindow.document.write('</div>');

  // Function to show an image in a lightbox
  galleryWindow.document.write(`
    <script>
      function showImage(imgSrc) {
        const lightbox = document.createElement('div');
        lightbox.classList.add('lightbox');
        
        const img = document.createElement('img');
        img.src = imgSrc;
        
        lightbox.appendChild(img);
        
        lightbox.addEventListener('click', () => {
          lightbox.remove();
        });
        
        document.body.appendChild(lightbox);
      }

      function switchToAnimation() {
        window.opener.switchToAnimation();
        window.close();
      }
    </script>
  `);

  galleryWindow.document.write('</body></html>');
}

function clearGallery() {
  savedImages.length = 0;
}

function toggleAnimation() {
  isRunning = !isRunning;
  continueText = isRunning ? "Continue" : "Stop";
  if (isRunning) {
    loop();
  } else {
    noLoop();
  }

  // Switch view when animation is paused
  if (!isRunning) {
    currentView = 'gallery';
    viewGallery();
  } else {
    currentView = 'animation';
    clearGallery();
  }
}

function switchToAnimation() {
  currentView = 'animation';
  isRunning = true;
  loop();
}

function clearCanvas() {
  isRunning = false;
  background(0); // Clear the canvas
}

