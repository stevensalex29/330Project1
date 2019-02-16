"use strict";

window.onload = init;

// SCRIPT SCOPED VARIABLES

// 1- here we are faking an enumeration - we'll look at another way to do this soon 
const SOUND_PATH = Object.freeze({
	sound1: "media/New Adventure Theme.mp3",
	sound2: "media/Peanuts Theme.mp3",
	sound3: "media/The Picard Song.mp3"
});

let brightnessAmount = 0;
let laserRotation = 0;
let invert = false, tintRed = false, noise = false, sepia = false, wav = false;
let delayNode;
let img, disc;
let ang = 0;

// 2 - elements on the page
let audioElement, canvasElement;

// UI
let playButton;

// 3 - our canvas drawing context
let drawCtx;

// 4 - our WebAudio context
let audioCtx;

// 5 - nodes that are part of our WebAudio audio routing graph
let sourceNode, analyserNode, gainNode;

// 6 - a typed array to hold the audio frequency data
const NUM_SAMPLES = 256;
// create a new array of 8-bit integers (0-255)
let audioData = new Uint8Array(NUM_SAMPLES / 2);


// FUNCTIONS
function init() {
	setupWebaudio();
	setupCanvas();
	setupGUI();
	update();
}

function setupWebaudio() {
	// 1 - The || is because WebAudio has not been standardized across browsers yet
	const AudioContext = window.AudioContext || window.webkitAudioContext;
	audioCtx = new AudioContext();

	// 2 - get a reference to the <audio> element on the page
	audioElement = document.querySelector("audio");
	audioElement.src = SOUND_PATH.sound3;

	// 3 - create an a source node that points at the <audio> element
	sourceNode = audioCtx.createMediaElementSource(audioElement);

	// 4 - create an analyser node
	analyserNode = audioCtx.createAnalyser();

	/*
	We will request NUM_SAMPLES number of samples or "bins" spaced equally 
	across the sound spectrum.
	
	If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
	the third is 344Hz. Each bin contains a number between 0-255 representing 
	the amplitude of that frequency.
	*/

	// create delay node
	delayNode = audioCtx.createDelay();

	// fft stands for Fast Fourier Transform
	analyserNode.fftSize = NUM_SAMPLES;

	// 5 - create a gain (volume) node
	gainNode = audioCtx.createGain();
	gainNode.gain.value = 1;

	// 6 - connect the nodes - we now have an audio graph
	sourceNode.connect(audioCtx.destination);
	sourceNode.connect(delayNode);
	delayNode.connect(analyserNode);
	analyserNode.connect(gainNode);
	gainNode.connect(audioCtx.destination);
}

function setupCanvas() {
	canvasElement = document.querySelector('canvas');
	drawCtx = canvasElement.getContext("2d");
	img = document.querySelector("#background");
	disc = document.querySelector("#disco");
}

var FizzyText = function () {
	//this.message = 'dat.gui';
	this.speed = 0.8;
	//this.displayOutline = false;
	this.play = function () {
		console.log(`audioCtx.state = ${audioCtx.state}`);

		// check if context is in suspended state (autoplay policy)
		if (audioCtx.state == "suspended") {
			audioCtx.resume();
		}

		if (target.dataset.playing == "no") {
			audioElement.play();
			target.dataset.playing = "yes";
			// if track is playing pause it
		} else if (target.dataset.playing == "yes") {
			audioElement.pause();
			target.dataset.playing = "no";
		}
	};
};

var setupGUI = function () {
	var text = new FizzyText();
	var gui = new dat.GUI();
	gui.add(text, 'play');
	gui.add(text, 'speed', -5, 5);
	//gui.add(text, 'displayOutline');
	//gui.add(text, 'explode');
}

function setupUI() {

	playButton = document.querySelector("#playButton");
	playButton.onclick = e => {
		console.log(`audioCtx.state = ${audioCtx.state}`);

		// check if context is in suspended state (autoplay policy)
		if (audioCtx.state == "suspended") {
			audioCtx.resume();
		}

		if (e.target.dataset.playing == "no") {
			audioElement.play();
			e.target.dataset.playing = "yes";
			// if track is playing pause it
		} else if (e.target.dataset.playing == "yes") {
			audioElement.pause();
			e.target.dataset.playing = "no";
		}
	};

	let volumeSlider = document.querySelector("#volumeSlider");
	volumeSlider.oninput = e => {
		gainNode.gain.value = e.target.value;
		volumeLabel.innerHTML = Math.round((e.target.value / 2 * 100));
	};
	volumeSlider.dispatchEvent(new InputEvent("input"));


	document.querySelector("#trackSelect").onchange = e => {
		audioElement.src = e.target.value;
		// pause the current track if it is playing
		playButton.dispatchEvent(new MouseEvent("click"));
	};


	// if track ends
	audioElement.onended = _ => {
		playButton.dataset.playing = "no";
	};

	document.querySelector("#fsButton").onclick = _ => {
		requestFullscreen(canvasElement);
	};

	// set initial value of sliders
	document.querySelector("#bI").innerHTML = "0";
	document.querySelector("#dI").innerHTML = "0";
	document.querySelector("#LI").innerHTML = "0";

}

function update() {
	// this schedules a call to the update() method in 1/60 seconds
	requestAnimationFrame(update);

	/*
		Nyquist Theorem
		http://whatis.techtarget.com/definition/Nyquist-Theorem
		The array of data we get back is 1/2 the size of the sample rate 
	*/

	// populate the audioData with the frequency data
	// notice these arrays are passed "by reference" 
	let mode = document.querySelector("#modeSelect").value;
	if (mode == "frequency") {
		analyserNode.getByteFrequencyData(audioData); // frequency data
		wav = false;
	}
	else {
		analyserNode.getByteTimeDomainData(audioData); // waveform data
		wav = true;
	}


	// slider code
	let slider2 = document.querySelector("#myRange2");
	let delaySlider = document.querySelector("#delaySlider");
	let slider3 = document.querySelector("#myRange3");
	let output1 = document.querySelector("#laser");
	let output2 = document.querySelector("#bright");
	let output3 = document.querySelector("#demo2");

	slider2.oninput = function () {
		document.querySelector("#bI").innerHTML = "";
		brightnessAmount = parseInt(this.value);
		if (brightnessAmount < 0) output2.innerHTML = this.value;
		else if (brightnessAmount == 0) output2.innerHTML = this.value;
		else output2.innerHTML = "+" + this.value;
	}

	delaySlider.oninput = function () {
		document.querySelector("#dI").innerHTML = "";
		output3.innerHTML = this.value;
		delayNode.delayTime.value = parseFloat(this.value);
	}

	slider3.oninput = function () {
		document.querySelector("#LI").innerHTML = "";
		laserRotation = parseInt(this.value);
		if (laserRotation < 0) output1.innerHTML = this.value;
		else if (laserRotation == 0) output1.innerHTML = this.value;
		else output1.innerHTML = "+" + this.value;
	}

	// update track time
	document.querySelector("#trackTime").innerHTML = "Track Time: " + secondsDisplay(audioElement.currentTime) +
		" / " + secondsDisplay(audioElement.duration);


	// filter code
	let tint = document.querySelector("#tint"), inv = document.querySelector("#invert"), nois = document.querySelector("#noise"), sep = document.querySelector("#sepia");
	tint.checked == true ? tintRed = true : tintRed = false;
	inv.checked == true ? invert = true : invert = false;
	nois.checked == true ? noise = true : noise = false;
	sep.checked == true ? sepia = true : sepia = false;


	// DRAW!
	// clear canvas
	drawCtx.clearRect(0, 0, 800, 600);
	// draw base image
	drawCtx.drawImage(img, 0, 0);
	// draw stage lights
	lights();
	// draw disco ball
	disco();
	// draw laser guns
	laserGuns();
	// To Do triangle lasers that rotate and shoot arc lasers by clicking button
	// manipulate pixels for visualizer
	manipulatePixels(drawCtx, canvasElement);
}

// draw disco ball for visualizer
function disco() {
	drawCtx.save();
	drawRectangle(drawCtx, canvasElement.width / 2, 40, 10, 30, "black");
	drawCtx.translate(canvasElement.width / 2 + 5, 100);
	var grad = drawCtx.createRadialGradient(0, 0, 5, 0, 0, 30);
	grad.addColorStop(0, 'white');
	grad.addColorStop(1, 'black');
	drawCircle(drawCtx, 0, 0, 30, grad, "black", 0, 0, Math.PI * 2);
	drawCtx.restore();
}

// draw lines for visualizer
function lights() {
	drawCtx.save();
	let barWidth = 4;
	let barSpacing = 1;
	let barHeight = 100;
	let topSpacing = 50;

	// loop through the data and draw!
	for (let i = 0; i < audioData.length; i += 15) {
		// draw lines
		if (!wav) drawLine(drawCtx, canvasElement.width / 2 + 5, 100, 640 - i * (barWidth + barSpacing) + getRandom(5, 20),
			canvasElement.height / 2 + audioData[i], randomColor(), 5);
		else {
			drawLine(drawCtx, canvasElement.width / 2 + 5, 100, 640 - i * (barWidth + barSpacing),
				canvasElement.height / 2 + audioData[i] - 20, randomColor(), 5);
		}
	}
	drawCtx.restore();
}

// draw laser guns
function laserGuns() {
	drawCtx.save();
	let startX = 20;
	for (let i = 0; i < 6; i++) {
		let endX = startX + 50;
		let controlX = ((startX * 2) + 80) / 2;
		drawArc(drawCtx, startX, 390, endX, 390, controlX, 350, "cyan");
		drawCtx.save();
		drawCtx.translate(startX, 375);
		//drawCtx.rotate()
		drawTriangle(drawCtx, 20, 0, 40, 0, 40, -45, randomColor());
		//drawTriangle(drawCtx,startX+20,375,endX-10,375,controlX,335,randomColor());
		drawCtx.restore();
		startX += 100;
	}
	drawCtx.restore();
}

// MANIPULATE PIXELS
function manipulatePixels(ctx, element) {
	// i) Get all of the rgba pixel data of the canvas by grabbing the
	// ImageData Object
	// https://developer.mozilla.org/en-US/docs/Web/API/ImageData
	let imageData = ctx.getImageData(0, 0, element.width, element.height);

	// ii) imageData.data is an 8-bit typed array - values range from 0-255
	// imageData.data contains 4 values per pixel: 4 x canvas.width x
	// canvas.height = 1024000 values!
	// we're looping through this 60 FPS - wow!
	let data = imageData.data;
	let length = data.length;
	let width = imageData.width;

	// iii) Iterate through each pixel
	// we step by 4 so taht we can manipulate 1 pixel per iteration
	// data[i] is the red value
	// data[i+1] is the green value
	// data[i+2] is the blue value
	// data[i+3] is the alpha value

	for (let i = 0; i < length; i += 4) {
		// iv) increase red value only
		if (tintRed) {
			// just the red channel this time
			data[i] = data[i] + 100;
		}
		// v) invert every color channel
		if (invert) {
			let red = data[i], green = data[i + 1], blue = data[i + 2];
			data[i] = 255 - red; // set red value
			data[i + 1] = 255 - green; // set blue value
			data[i + 2] = 255 - blue; // set green value
			// data[i+3] is the alpha but we're leaving that alone
		}
		// vi) noise
		if (noise && Math.random() < .10) {
			data[i] = data[i + 1] = data[i + 2] = 128; // gray noise
			//data[i+3] = 255 // see noise on undrawn areas
			//data[i] = data[i+1] = data[i+2] = 255; // or white noise
			//data[i] = data[i+1] = data[i+2] = 0;  // or black noise
		}
		// vii) sepia
		if (sepia) {
			data[i] = (data[i] * .393) + (data[i + 1] * .769) + (data[i + 2] * .189);
			data[i + 1] = (data[i] * .349) + (data[i + 1] * .686) + (data[i + 2] * .168);
			data[i + 2] = (data[i] * .272) + (data[i + 1] * .534) + (data[i + 2] * .131);

			if (data[i] > 255) data[i] = 255;
			if (data[i + 1] > 255) data[i + 1] = 255;
			if (data[i + 2] > 255) data[i + 2] = 255;
		}

		// adjust brightness
		data[i] += brightnessAmount;
		data[i + 1] += brightnessAmount;
		data[i + 2] += brightnessAmount;
	}

	// put the modified data back on the canvas
	ctx.putImageData(imageData, 0, 0);
}

function requestFullscreen(element) {
	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if (element.mozRequestFullscreen) {
		element.mozRequestFullscreen();
	} else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	}
	// .. and do nothing if the method is not supported
};