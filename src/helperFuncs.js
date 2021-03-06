	var app = app || {};
	//IFFY for helper js
	app.helper = (function(){
		// get random number between max and min
		function getRandom(min, max) {
	  		return Math.random() * (max - min) + min;
		}
		
		// draws a rectangle
		function drawRectangle(ctx,x=0,y=0,width=25,height=25,fillStyle="red",strokeStyle="black",lineWidth=0){
			ctx.save();                
			ctx.beginPath();            
			ctx.rect(x,y,width,height);   
			ctx.closePath(); 
			ctx.fillStyle = fillStyle;
			ctx.strokeStyle = strokeStyle;    
			ctx.lineWidth = lineWidth;  
			ctx.fill();              
			ctx.stroke();                            
			ctx.restore();             
		}
		
		// draws a circle
		function drawCircle(ctx,x=0,y=0,radius=10, fillStyle="red",strokeStyle="black",lineWidth=0,startAngle=0,endAngle=Math.PI*2){
			ctx.save();
			ctx.beginPath();
			ctx.arc(x,y,radius,startAngle,endAngle,false);
			ctx.closePath();
			ctx.fillStyle = fillStyle;
			ctx.strokeStyle = strokeStyle;    
			ctx.lineWidth = lineWidth;
			ctx.fill();
			ctx.stroke();  
			ctx.restore();
		}
		
		// draws a line
		function drawLine(ctx,x1=0,y1=0,x2=100,y2=0,strokeStyle="black",lineWidth=5){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			ctx.lineTo(x2,y2);
			ctx.closePath();
			ctx.strokeStyle = strokeStyle;    
			ctx.lineWidth = lineWidth;
			ctx.stroke();  
			ctx.restore();
		}
		
		// draws a triangle
		function drawTriangle(ctx,x1=0,y1=0,x2=50,y2=50,x3=-50,y3=50,fillStyle="red",strokeStyle="black",lineWidth=5){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1,y2);
			ctx.lineTo(x2,y2);
			ctx.lineTo(x3,y3);
			ctx.closePath();
			ctx.fillStyle = fillStyle;
			ctx.strokeStyle = strokeStyle;    
			ctx.lineWidth = lineWidth;
			ctx.fill();
			ctx.stroke();  
			ctx.restore();
		}
		
		// draws an arc
		function drawArc(ctx,x1=0,y1=0,x2=300,y2=0,cpX=150,cpY=75,fillStyle="red",strokeStyle="black",lineWidth=5){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.quadraticCurveTo(cpX, cpY, x2, y2);
			ctx.closePath();
			ctx.fillStyle = fillStyle;
			ctx.strokeStyle = strokeStyle;    
			ctx.lineWidth = lineWidth;
			ctx.fill();
			ctx.stroke();  
			ctx.restore();
		}

		// draws an arc
		function drawCubeBezier(ctx,startX=0,startY=0,cp1X=300,cp1Y=0,cp2X=150,cp2Y=75,endX,endY,strokeStyle="black",lineWidth=5){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.bezierCurveTo(cp1X,cp1Y,cp2X,cp2Y,endX,endY);
			ctx.closePath();
			ctx.strokeStyle = strokeStyle;    
			ctx.lineWidth = lineWidth;
			ctx.fill();
			ctx.stroke();  
			ctx.restore();
		}

		// makes given color
		function makeColor(red, green, blue, alpha){
			let color='rgba('+red+','+green+','+blue+', '+alpha+')';
			return color;
		}

		// return random rgb color
		function randomColor(){
			return 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
		}

		// return string of current hour min sec from seconds input
		function secondsDisplay(sec) {
			// calculate hours seconds and minutes
	    	sec = Number(sec);
		    let hours = Math.floor(sec / 3600);
		    let minutes = Math.floor(sec % 3600 / 60);
		    let seconds = Math.floor(sec % 3600 % 60);

		    // display after calculation
		    let hDisplay = hours > 0 ? hours + (hours == 1 ? " hr, " : " hrs, ") : "";
		    let mDisplay = minutes > 0 ? minutes + (minutes == 1 ? " min, " : " mins, ") : "";
		    let sDisplay = seconds > 0 ? seconds + (seconds == 1 ? " sec" : " secs") : "";
		    if(hours == 0 && seconds == 0 && minutes == 0) return "0 secs";
		    else return hDisplay + mDisplay + sDisplay; 
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
		// our "public interface"
		return{
			getRandom : getRandom,
			drawRectangle : drawRectangle,
			drawTriangle : drawTriangle,
			drawCircle : drawCircle,
			drawLine : drawLine,
			drawArc : drawArc,
			drawCubeBezier : drawCubeBezier,
			makeColor : makeColor,
			randomColor : randomColor,
			secondsDisplay : secondsDisplay,
			requestFullscreen : requestFullscreen
		};
	})();