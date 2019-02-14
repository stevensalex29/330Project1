		
	var app = app || {};
	//IFFY for main js
	app.main = (function(){
		"use strict";
		
		// SCRIPT SCOPED VARIABLES		
		// add sound files
		const SOUND_PATH = Object.freeze({
			sound1: "media/ThatsTheWay.mp3",
			sound2: "media/StayinAlive.mp3",
			sound3:  "media/LoveTrain.mp3"
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

		// elements on the page
		let audioElement,canvasElement;
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
		let audioData = new Uint8Array(NUM_SAMPLES/2); 
		
		// update elements when entering and exiting fullscreen
		document.addEventListener("fullscreenchange", function() {
			if(full){
				full = false;
				canvasElement.style.height = "400px";
				canvasElement.style.width = "640px";
				gif.style.marginLeft = "210px";
				gif.style.marginTop = "150px";
				gif.style.height = "200px";
				gif.style.width = "200px";
			}else{
				full = true;
				canvasElement.style.height = "100%";
				canvasElement.style.width = "100%";
				gif.style.marginLeft = "35%";
				gif.style.marginTop = "20%";
				gif.style.height = "50%";
				gif.style.width = "25%";
			}
		});

		// FUNCTIONS
		function init(){
			setupWebaudio();
			setupCanvas();
			setupUI();
			update();
		}
		
		function setupWebaudio(){
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
		
		function setupCanvas(){
			// initialize elements for canvas
			canvasElement = document.querySelector('canvas');
			display = document.querySelector("#display");
			drawCtx = canvasElement.getContext("2d");
			img = document.querySelector("#background");
			disc = document.querySelector("#disco");
			speaker = document.querySelector("#speaker");
			speaker2 = document.querySelector("#speaker2");
			gif = document.querySelector("#gif");
		}
		
		function setupUI(){
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
				volumeLabel.innerHTML = Math.round((e.target.value/2 * 100));
			};
			volumeSlider.dispatchEvent(new InputEvent("input"));
			
			
			document.querySelector("#trackSelect").onchange = e =>{
				audioElement.src = e.target.value;
				// pause the current track if it is playing
				playButton.dispatchEvent(new MouseEvent("click"));
			};
			
			
			// if track ends
			audioElement.onended =  _ => {
				playButton.dataset.playing = "no";
			};
			
			document.querySelector("#fsButton").onclick = _ =>{
				app.helper.requestFullscreen(display);
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
			let mode = document.querySelector("#mode1");
			if(mode.checked){
				analyserNode.getByteFrequencyData(audioData); // frequency data
				wav = false;
			}
			else{
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

			slider2.oninput = function(){
				document.querySelector("#bI").innerHTML = "";
				brightnessAmount = parseInt(this.value);
				if(brightnessAmount < 0) output2.innerHTML= this.value;
				else if(brightnessAmount ==0) output2.innerHTML=this.value;
				else output2.innerHTML= "+" + this.value;
			}

			delaySlider.oninput = function(){
				document.querySelector("#dI").innerHTML = "";
				output3.innerHTML=this.value;
				delayNode.delayTime.value = parseFloat(this.value);
			}

			slider3.oninput = function(){
				document.querySelector("#LI").innerHTML = "";
				let s = -.2;
				laserRotation = s + (.1*this.value);
				output1.innerHTML = this.value;
			}

			// update track time
			document.querySelector("#trackTime").innerHTML = "Track Time: " + app.helper.secondsDisplay(audioElement.currentTime) +
			 " / " + app.helper.secondsDisplay(audioElement.duration);


			// filter code
			let inv = document.querySelector("#invert"), nois = document.querySelector("#noise"), sep = document.querySelector("#sepia"), fire = document.querySelector("#laser");
			inv.checked == true ? invert=true : invert = false;
			nois.checked == true ? noise=true : noise = false;
			sep.checked == true ? sepia=true : sepia = false;
			fire.checked == true ? fired=true : fired = false;

			
			// DRAW!
			// clear canvas
			drawCtx.clearRect(0,0,800,600); 
			// draw base image
			drawCtx.drawImage(img,  0, 0);
			// draw dancer
			//drawCtx.drawImage(gif, 120, 200);
			// draw peace sign
			app.drawer.peace(drawCtx,canvasElement,playButton);
			// draw stage lights
			app.drawer.lights(drawCtx,canvasElement,audioData,wav); 
			// draw disco ball
			app.drawer.disco(drawCtx,canvasElement);
			// draw laser guns
			app.drawer.laserGuns(drawCtx,audioData,laserRotation,fired,wav);
			// To Do triangle lasers that rotate and shoot arc lasers by clicking button
			// manipulate pixels for visualizer
			app.drawer.manipulatePixels(drawCtx,canvasElement,invert,noise,sepia,brightnessAmount);	 
		}
		// our "public interface"
		return{
			init : init
		};
	})();