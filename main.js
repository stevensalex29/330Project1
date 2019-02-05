		"use strict";
		
		window.onload = init;
		
		// SCRIPT SCOPED VARIABLES
				
		// 1- here we are faking an enumeration - we'll look at another way to do this soon 
		const SOUND_PATH = Object.freeze({
			sound1: "media/New Adventure Theme.mp3",
			sound2: "media/Peanuts Theme.mp3",
			sound3:  "media/The Picard Song.mp3"
		});
		let maxRadius = 200;
		let brightnessAmount = 0;
		let invert = false, tintRed = false, noise = false, sepia = false;
		let delayNode;
		
		// 2 - elements on the page
		let audioElement,canvasElement;
		
		// UI
		let playButton;
		
		// 3 - our canvas drawing context
		let drawCtx
		
		// 4 - our WebAudio context
		let audioCtx;
		
		// 5 - nodes that are part of our WebAudio audio routing graph
		let sourceNode, analyserNode, gainNode;
		
		// 6 - a typed array to hold the audio frequency data
		const NUM_SAMPLES = 256;
		// create a new array of 8-bit integers (0-255)
		let audioData = new Uint8Array(NUM_SAMPLES/2); 
		
		
		// FUNCTIONS
		function init(){
			setupWebaudio();
			setupCanvas();
			setupUI();
			update();
		}
		
		function setupWebaudio(){
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
		
		function setupCanvas(){
			canvasElement = document.querySelector('canvas');
			drawCtx = canvasElement.getContext("2d");
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
			// set initial value of sliders
			document.querySelector("#cI").innerHTML = "200";
			document.querySelector("#bI").innerHTML = "0";
			document.querySelector("#dI").innerHTML = "0";
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
				requestFullscreen(canvasElement);
			};
			
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
			analyserNode.getByteFrequencyData(audioData);
		
			// OR
			//analyserNode.getByteTimeDomainData(audioData); // waveform data

			// slider code
			let slider = document.querySelector("#myRange");
			let slider2 = document.querySelector("#myRange2");
			let delaySlider = document.querySelector("#delaySlider");
			let output = document.querySelector("#demo");
			let output2 = document.querySelector("#bright");
			let output3 = document.querySelector("#demo2");



			// set value on change
			slider.oninput = function(){
				document.querySelector("#cI").innerHTML = "";
				output.innerHTML= this.value;
				maxRadius= parseInt(this.value);
			}

			slider2.oninput = function(){
				document.querySelector("#bI").innerHTML = "";
				brightnessAmount = parseInt(this.value);
				if(brightnessAmount < 0) output2.innerHTML= this.value;
				else output2.innerHTML= "+" + this.value;
			}

			delaySlider.oninput = function(){
				document.querySelector("#dI").innerHTML = "";
				output3.innerHTML=this.value;
				delayNode.delayTime.value = parseFloat(this.value);
			}


			

			// filter code
			let tint = document.querySelector("#tint"), inv = document.querySelector("#invert"), nois = document.querySelector("#noise"), sep = document.querySelector("#sepia");
			tint.checked == true ? tintRed=true : tintRed = false;
			inv.checked == true ? invert=true : invert = false;
			nois.checked == true ? noise=true : noise = false;
			sep.checked == true ? sepia=true : sepia = false;

			
			// DRAW!
			drawCtx.clearRect(0,0,800,600);  
			let barWidth = 4;
			let barSpacing = 1;
			let barHeight = 100;
			let topSpacing = 50;
			
			// loop through the data and draw!
			for(let i=0; i<audioData.length; i++) { 
				//drawCtx.fillStyle = 'rgba(0,255,0,0.6)'; 
				
				// the higher the amplitude of the sample (bin) the taller the bar
				// remember we have to draw our bars left-to-right and top-down
				// drawCtx.fillRect(i * (barWidth + barSpacing),topSpacing + 256-audioData[i],barWidth,barHeight); 

				// add circle effects
				// red-ish circles
				let percent = audioData[i] / 255;
				let circleRadius = percent * maxRadius;
				drawCtx.beginPath();
				drawCtx.fillStyle = makeColor(255, 111, 111, .34 - percent/3.0);
				drawCtx.arc(canvasElement.width/2, canvasElement.height/2, circleRadius, 0, 2 * Math.PI, false);
				drawCtx.fill();
				drawCtx.closePath();

				// blue-ish circles, bigger, more transparent
				drawCtx.beginPath();
				drawCtx.fillStyle = makeColor(0, 0, 255, .10 - percent/10.0);
				drawCtx.arc(canvasElement.width/2, canvasElement.height/2, circleRadius * 1.5, 0, 2 * Math.PI, false);
				drawCtx.fill();
				drawCtx.closePath();

				// yellow-ish circles, smaller
				drawCtx.save();
				drawCtx.beginPath();
				drawCtx.fillStyle = makeColor(200, 200, 0, .5 - percent/5.0);
				drawCtx.arc(canvasElement.width/2, canvasElement.height/2, circleRadius * .50, 0, 2 * Math.PI, false);
				drawCtx.fill();
				drawCtx.closePath();
				drawCtx.restore();


				// draw lines
				drawCtx.strokeStyle = 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
				drawCtx.beginPath();
				drawCtx.moveTo(canvasElement.width/2, 0);
				drawCtx.lineTo(640 - i * (barWidth + barSpacing),canvasElement.height/2 + audioData[i] -20);
				drawCtx.stroke();
				drawCtx.closePath();

				drawCtx.strokeStyle = 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
				drawCtx.beginPath();
				drawCtx.moveTo(canvasElement.width/2, canvasElement.height);
				drawCtx.lineTo(i * (barWidth + barSpacing),canvasElement.height/2 + audioData[i] + 50);
				drawCtx.stroke();
				drawCtx.closePath();
			}

			manipulatePixels();	 
		} 
		
		// MANIPULATE PIXELS
		function manipulatePixels(){
			// i) Get all of the rgba pixel data of the canvas by grabbing the
			// ImageData Object
			// https://developer.mozilla.org/en-US/docs/Web/API/ImageData
			let imageData = drawCtx.getImageData(0, 0, canvasElement.width, canvasElement.height);

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

			for(let i = 0; i < length; i+=4){
				// iv) increase red value only
				if(tintRed){
					// just the red channel this time
					data[i] = data[i] + 100;
				}
				// v) invert every color channel
				if(invert){
					let red = data[i], green = data[i+1], blue = data[i+2];
					data[i] = 255 - red; // set red value
					data[i+1] = 255 - green; // set blue value
					data[i+2] = 255 - blue; // set green value
					// data[i+3] is the alpha but we're leaving that alone
				}
				// vi) noise
				if(noise && Math.random() <.10){
					data[i] = data[i+1] = data[i+2] = 128; // gray noise
					//data[i+3] = 255 // see noise on undrawn areas
					//data[i] = data[i+1] = data[i+2] = 255; // or white noise
					//data[i] = data[i+1] = data[i+2] = 0;  // or black noise
				}
				// vii) sepia
				if(sepia){
					data[i] = (data[i] * .393) + (data[i+1] * .769) + (data[i+2] * .189);
					data[i+1] = (data[i] * .349) + (data[i+1] * .686) + (data[i+2] * .168);
					data[i+2] = (data[i] * .272) + (data[i+1] * .534) + (data[i+2] * .131);

					if(data[i] > 255) data[i] = 255;
					if(data[i+1] > 255) data[i+1] = 255;
					if(data[i+2] > 255) data[i+2] = 255;
				}

				// adjust brightness
				data[i] += brightnessAmount;
				data[i+1] += brightnessAmount;
				data[i+2] += brightnessAmount;
			}

			// put the modified data back on the canvas
			drawCtx.putImageData(imageData, 0, 0);
		}

		// HELPER FUNCTIONS
		function makeColor(red, green, blue, alpha){
   			var color='rgba('+red+','+green+','+blue+', '+alpha+')';
   			return color;
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