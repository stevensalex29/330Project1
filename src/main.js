
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
	let img, disc, speaker, speaker2, gif;
	let ang = 0;
	let display;
	let gifML, gifMT, gifH,gifW, cH,cW;

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
			gif.style.marginLeft = gifML;
			gif.style.marginTop = gifMT;
			gif.style.width = gifW;
			gif.style.height = gifH;
			canvasElement.style.height = cH;
			canvasElement.style.width = cW;
		} else { // if full screen, enlarge gif and canvas to full size, keep track of old sizes
			full = true;
			gifML = gif.style.marginLeft;
			gifMT = gif.style.marginTop;
			gifH = gif.style.height;
			gifW = gif.style.width;
			cH = canvasElement.style.height;
			cW = canvasElement.style.width;
			canvasElement.style.height = "100%";
			canvasElement.style.width = "100%";
			gif.style.marginLeft = "25%";
			gif.style.marginTop = "20%";
			gif.style.height = "50%";
			gif.style.width = "25%";
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
		img = document.querySelector("#backgroundImg");
		disc = document.querySelector("#discoImg");
		speaker = document.querySelector("#speakerImg");
		speaker2 = document.querySelector("#speaker2Img");
		gif = document.querySelector("#gif1");
		document.querySelector("#gif2").style.display="none";
		document.querySelector("#gif3").style.display="none";
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
			// change gif based off song
			if(e.target.value == "media/ThatsTheWay.mp3"){
				document.querySelector("#gif2").style.display="inline-block"; // swap to gif 2
				gif = document.querySelector("#gif2");
				document.querySelector("#gif1").style.display="none";
				document.querySelector("#gif3").style.display="none";
			}else if(e.target.value == "media/StayinAlive.mp3"){ // swap to gif 3
				document.querySelector("#gif3").style.display="inline-block";
				gif = document.querySelector("#gif3");
				document.querySelector("#gif1").style.display="none";
				document.querySelector("#gif2").style.display="none";
			}else{ // swap to gif 1
				document.querySelector("#gif1").style.display="inline-block";
				gif = document.querySelector("#gif1");
				document.querySelector("#gif2").style.display="none";
				document.querySelector("#gif3").style.display="none";
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
		document.querySelector("#trackTime").innerHTML = "Track Time: " + app.helper.secondsDisplay(audioElement.currentTime) +
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
		drawCtx.drawImage(img, 0, 0,canvasElement.width,canvasElement.height);
		// draw dancer
		//drawCtx.drawImage(gif, 120, 200);
		// draw peace sign
		app.drawer.peace(drawCtx, playButton, audioData, speaker, speaker2, disc,canvasElement);
		// draw stage lights
		app.drawer.lights(drawCtx, canvasElement, audioData, wav);
		// draw disco ball
		app.drawer.disco(drawCtx, canvasElement);
		// draw laser guns
		app.drawer.laserGuns(drawCtx, audioData, laserRotation, fired, wav,canvasElement);
		// To Do triangle lasers that rotate and shoot arc lasers by clicking button
		// manipulate pixels for visualizer
		app.drawer.manipulatePixels(drawCtx, canvasElement, invert, noise, sepia, brightnessAmount);
	}
	// our "public interface"
	return {
		init: init
	};
})();