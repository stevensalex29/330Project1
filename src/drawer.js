	var app = app || {};
	//IFFY for drawer js
	app.drawer = (function(){
		// draw disco ball for visualizer
		function disco(drawCtx,canvasElement){
			drawCtx.save();
			app.helper.drawRectangle(drawCtx,canvasElement.width/2,40,10,30,"black");
			drawCtx.translate(canvasElement.width/2+5, 100); 
			var grad = drawCtx.createRadialGradient(0, 0, 5, 0, 0, 30);
	        grad.addColorStop(0, 'white');
	        grad.addColorStop(1, 'black');
			app.helper.drawCircle(drawCtx,0,0,30,grad,"black",0,0,Math.PI*2);  
			drawCtx.restore();
		}

		// draw lines for visualizer
		function lights(drawCtx,canvasElement,audioData,wav){
			drawCtx.save();
			let barWidth = 4;
			let barSpacing = 1;
			let barHeight = 100;
			let topSpacing = 50;
			drawCtx.globalAlpha = .6;
			// loop through the data and draw!
			for(let i=0; i<audioData.length; i+=15) { 
				// draw lines
				if(!wav) app.helper.drawLine(drawCtx,canvasElement.width/2+5,100,640 - i * (barWidth + barSpacing)+10,
					canvasElement.height/2 + audioData[i],"cyan",5); 
				else {
					app.helper.drawLine(drawCtx,canvasElement.width/2+5,100,640 - i * (barWidth + barSpacing),
					canvasElement.height/2 + audioData[i] -20,"cyan",5);
				}
			}
			drawCtx.restore();
		}

		// draw laser guns
		function laserGuns(drawCtx,audioData,laserRotation,fired,wav,canvasElement){
			drawCtx.save();
			let startX = 20;
			let spacing = canvasElement.width/6;
			//iterate and draw each laser
			for(let i=0; i < 6; i++){
				let endX = startX+50;
				let controlX = ((startX*2) + 80)/2;
				app.helper.drawArc(drawCtx,startX,canvasElement.height-20,endX,canvasElement.height-20,controlX,canvasElement.height-70,"cyan");
				drawCtx.save();
				drawCtx.translate(startX+5,canvasElement.height-35);
				drawCtx.rotate(laserRotation);
				app.helper.drawTriangle(drawCtx,15,0,35,0,35,-45,app.helper.randomColor());
				drawCtx.globalAlpha = .3;
				if(fired){
					if(audioData[i]==0){ // change laser orientation based upon audiodata and type of data 
						app.helper.drawLine(drawCtx,35,-45,300,-200,app.helper.randomColor());
					}else if(wav){
						app.helper.drawCubeBezier(drawCtx,35,-45,50,-100,(audioData[i]*.5),-100,300,-200,app.helper.randomColor());
					}else{
						app.helper.drawCubeBezier(drawCtx,35,-45,-50+(audioData[i]*.9),-100,50+(audioData[i]*.9),-200,300,-200,app.helper.randomColor());
					}
				}
				drawCtx.restore();
				startX+=spacing;
			}
			drawCtx.restore();
		}

		// draw peace sign and speakers
		function peace(drawCtx,playButton,audioData,speaker,speaker2,disc,canvasElement){
			drawCtx.save();
			drawCtx.drawImage(speaker, 10,60,150,100);
			drawCtx.drawImage(speaker2, canvasElement.width-165,60,150,100);
			let xPos = 400;
			let yPos = 400;
			for(let i = 0; i < 7; i++){ // draw symbols from speakers
				drawCtx.scale(.7,.7);
				if(i!=0 && i!=1&&playButton.dataset.playing == "yes"){
					let moveX1 = audioData[10];
					drawCtx.drawImage(disc, xPos, yPos,moveX1,moveX1);
					if(i==2)drawCtx.drawImage(disc, canvasElement.width+900, yPos,moveX1,moveX1);
					if(i==3)drawCtx.drawImage(disc, canvasElement.width+1800, yPos,moveX1,moveX1);
					if(i==4)drawCtx.drawImage(disc, canvasElement.width+3100, yPos,moveX1,moveX1);
					if(i==5)drawCtx.drawImage(disc, canvasElement.width+5000, yPos,moveX1,moveX1);
					if(i==6)drawCtx.drawImage(disc, canvasElement.width+7700, yPos,moveX1,moveX1);
				}
				xPos+=100;
				yPos+=150;

				
			}
			drawCtx.restore();
		}
		
		// MANIPULATE PIXELS
		function manipulatePixels(ctx,element,invert,noise,sepia,brightnessAmount){
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

			for(let i = 0; i < length; i+=4){
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
			ctx.putImageData(imageData, 0, 0);
		}
		// our "public interface"
		return{
			disco : disco,
			lights : lights,
			laserGuns : laserGuns,
			peace : peace,
			manipulatePixels : manipulatePixels
		};
	})();