
var app = app || {};
//IFFY for main js
app.main = (function () {
	"use strict";

	// SCRIPT SCOPED VARIABLES		
	// add sound files
	const SOUND_PATH = Object.freeze({
		sound1: "media/ThatsTheWay.mp3",
		sound2: "media/StayinAlive.mp3",
		sound3: "media/LoveTrain.mp3"
	});

	// image variables
	let brightnessAmount = 0;
	let laserRotation = -.2;
	let fired = false;
	let invert = false, noise = false, sepia = false, wav = false, full = false;
	let delayNode;
	let bgImg, discoImg, speakerImg, speaker2Img, currentGif, gif1, gif2, gif3;
	let ang = 0;
	let display;
	let gifML, gifMT, gifH, gifW, cH, cW;

	// elements on the page
	let audioElement, canvasElement;
	// UI
	let playButton;
	// canvas drawing context
	let drawCtx;
	// WebAudio context
	let audioCtx;
	// nodes that are part of our WebAudio audio routing graph
	let sourceNode, analyserNode, gainNode;
	// typed array to hold the audio frequency data
	const NUM_SAMPLES = 256;
	// new array of 8-bit integers (0-255)
	let audioData = new Uint8Array(NUM_SAMPLES / 2);

	// update elements when entering and exiting fullscreen
	document.addEventListener("fullscreenchange", function () {
		// otherwise, decrease size of gif and canvas to the size they were before using saved values
		if (full) {
			full = false;
			currentGif.style.marginLeft = gifML;
			currentGif.style.marginTop = gifMT;
			currentGif.style.width = gifW;
			currentGif.style.height = gifH;
			canvasElement.style.height = cH;
			canvasElement.style.width = cW;
		} else { // if full screen, enlarge gif and canvas to full size, keep track of old sizes
			full = true;
			gifML = currentGif.style.marginLeft;
			gifMT = currentGif.style.marginTop;
			gifH = currentGif.style.height;
			gifW = currentGif.style.width;
			cH = canvasElement.style.height;
			cW = canvasElement.style.width;
			canvasElement.style.height = "100%";
			canvasElement.style.width = "100%";
			currentGif.style.marginLeft = "25%";
			currentGif.style.marginTop = "20%";
			currentGif.style.height = "50%";
			currentGif.style.width = "25%";
		}
	});

	// FUNCTIONS
	function init() {
		setupWebaudio();
		setupCanvas();
		setupUI();
		update();
	}

	function setupWebaudio() {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		audioCtx = new AudioContext();

		// reference to the <audio> element on the page
		audioElement = document.querySelector("audio");
		audioElement.src = SOUND_PATH.sound3;

		// a source node that points at the <audio> element
		sourceNode = audioCtx.createMediaElementSource(audioElement);

		// an analyser node
		analyserNode = audioCtx.createAnalyser();

		// delay node
		delayNode = audioCtx.createDelay();

		// Fast Fourier Transform
		analyserNode.fftSize = NUM_SAMPLES;

		// gain (volume) node
		gainNode = audioCtx.createGain();
		gainNode.gain.value = 1;

		// connect the nodes
		sourceNode.connect(audioCtx.destination);
		sourceNode.connect(delayNode);
		delayNode.connect(analyserNode);
		analyserNode.connect(gainNode);
		gainNode.connect(audioCtx.destination);
	}

	function setupCanvas() {
		// initialize elements for canvas
		canvasElement = document.querySelector('canvas');
		display = document.querySelector("#display");
		drawCtx = canvasElement.getContext("2d");
		
		bgImg = document.querySelector("#backgroundImg");
		discoImg = document.querySelector("#discoImg");
		speakerImg = document.querySelector("#speakerImg");
		speaker2Img = document.querySelector("#speaker2Img");
		
		gif1 = document.querySelector("#gif1");
		gif2 = document.querySelector("#gif2");
		gif3 = document.querySelector("#gif3");

		gif1.style.display = "inline-block";
		currentGif = gif1;
		gif2.style.display = "none";
		gif3.style.display = "none";
	}

	function setupUI() {
		playButton = document.querySelector("#playButton");
		playButton.onclick = e => {

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
			// change gif based off song
			if (e.target.value == "media/ThatsTheWay.mp3") {
				gif2.style.display = "inline-block"; // swap to gif 2
				currentGif = gif2;
				gif1.style.display = "none";
				gif3.style.display = "none";
			} else if (e.target.value == "media/StayinAlive.mp3") { // swap to gif 3
				gif3.style.display = "inline-block";
				currentGif = gif3;
				gif1.style.display = "none";
				gif2.style.display = "none";
			} else { // swap to gif 1
				gif1.style.display = "inline-block";
				currentGif = gif1;
				gif2.style.display = "none";
				gif3.style.display = "none";
			}
		};


		// if track ends
		audioElement.onended = _ => {
			playButton.dataset.playing = "no";
		};

		document.querySelector("#fsButton").onclick = _ => {
			app.helper.requestFullscreen(display);
		};

		// set initial value of sliders
		document.querySelector("#brightnessLabel").innerHTML = "0";
		document.querySelector("#delayLabel").innerHTML = "0";
		document.querySelector("#laserLabel").innerHTML = "0";
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
		let mode = document.querySelector("#frequencyMode");

		if (mode.checked) {
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
		let output1 = document.querySelector("#laserLabel");
		let output2 = document.querySelector("#brightnessLabel");
		let output3 = document.querySelector("#delayLabel");

		// change brightness
		slider2.oninput = function () {
			brightnessAmount = parseInt(this.value);
			if (brightnessAmount < 0) output2.innerHTML = this.value;
			else if (brightnessAmount == 0) output2.innerHTML = this.value;
			else output2.innerHTML = "+" + this.value;
		}

		// change delay
		delaySlider.oninput = function () {
			output3.innerHTML = this.value;
			delayNode.delayTime.value = parseFloat(this.value);
		}

		// change laser rotation
		slider3.oninput = function () {
			let s = -.2;
			laserRotation = s + (.1 * this.value);
			output1.innerHTML = this.value;
		}

		// update track time
		document.querySelector("#trackTimeLabel").innerHTML = app.helper.secondsDisplay(audioElement.currentTime) +
			" / " + app.helper.secondsDisplay(audioElement.duration);


		// filter code
		let inv = document.querySelector("#invertBox"), nois = document.querySelector("#noiseBox"), sep = document.querySelector("#sepiaBox"), fire = document.querySelector("#laserBox");
		inv.checked == true ? invert = true : invert = false;
		nois.checked == true ? noise = true : noise = false;
		sep.checked == true ? sepia = true : sepia = false;
		fire.checked == true ? fired = true : fired = false;


		// DRAW!
		// clear canvas
		drawCtx.clearRect(0, 0, 800, 600);
		// draw base image
		drawCtx.drawImage(bgImg, 0, 0, canvasElement.width, canvasElement.height);
		// draw dancer
		//drawCtx.drawImage(currentGif, 120, 200);
		// draw peace sign
		app.drawer.peace(drawCtx, playButton, audioData, speakerImg, speaker2Img, discoImg, canvasElement);
		// draw stage lights
		app.drawer.lights(drawCtx, canvasElement, audioData, wav);
		// draw disco ball
		app.drawer.disco(drawCtx, canvasElement);
		// draw laser guns
		app.drawer.laserGuns(drawCtx, audioData, laserRotation, fired, wav, canvasElement);
		// To Do triangle lasers that rotate and shoot arc lasers by clicking button
		// manipulate pixels for visualizer
		app.drawer.manipulatePixels(drawCtx, canvasElement, invert, noise, sepia, brightnessAmount);
	}
	// our "public interface"
	return {
		init: init
	};
})();