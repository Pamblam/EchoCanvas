
/**
 * Create an animation timeline
 * @param EchoCanvas eCanvas - The EchoCanvas instance to animate
 * @returns EchoTimeline
 */
function EchoTimeline(eCanvas){
	this.eCanvas = eCanvas;
	this.totalMS = 0;
	this.animationStack = [];
	this.renderedFrames = [];
	this.FPS = 30;
	this.editCursor = 0;
}

/**
 * Compare Animations
 * @param Object startState - The state to begin with
 * @param {type} endState - The state to end with
 * @returns EchoTimeline - The current instance
 */
EchoTimeline.prototype.statesToAnimation = function(startState, endState){
	var startmap = this.eCanvas.mapState(startState);
	var endmap = this.eCanvas.mapState(endState);
	var animations = [];
	for(var id in startmap){
		if(!startmap.hasOwnProperty(id) || !endmap.hasOwnProperty(id)) continue;
		if(startmap[id].x > endmap[id].x) animations.push({id:id, moveLeft: startmap[id].x - endmap[id].x, starttime:this.editCursor});
		if(startmap[id].x < endmap[id].x) animations.push({id:id, moveRight: endmap[id].x - startmap[id].x, starttime:this.editCursor});
		if(startmap[id].y > endmap[id].y) animations.push({id:id, moveUp: startmap[id].y - endmap[id].y, starttime:this.editCursor});
		if(startmap[id].y < endmap[id].y) animations.push({id:id, moveDown: endmap[id].y - startmap[id].y, starttime:this.editCursor});
	}
	for(var i=0; i<animations.length; i++) this.animate(animations[i]);
	return this;
};

/**
 * Repeat the animation
 * @returns EchoTimeline - The current instance
 */
EchoTimeline.prototype.repeat = function(){
	this.eCanvas.saveState("_rpt");
	var _this = this;
	(function p(){
		_this.play(function(){
			p();
		});
	})();
	return this;
};

/**
 * Add an animation to the project
 * @param object options - animation options
 * @returns EchoTimeline - The current index
 */
EchoTimeline.prototype.animate = function(options){
	if(undefined === options.id) throw new Error("EchoTimeline.animate requires an id option");
	if(undefined === options.time) options.time = 5000;
	if(undefined === options.starttime) options.starttime = this.editCursor;
	if(options.time+options.starttime > this.editCursor) this.editCursor = options.time+options.starttime;
	this.animationStack.push(options);
	return this;
};

/**
 * Play the rendered frames
 * @param function playCbk - Callback to execute when animation is complete
 * @returns EchoTimeline - The current index
 */
EchoTimeline.prototype.play = function(playCbk){
	if("function" !== typeof playCbk) playCbk = function(){};
	var runTime = this.getTotalRuntime();
	
	// Total number of frames required
	var runTimeSeconds = runTime/1000;
	var totalFrames = this.FPS*runTimeSeconds;
	
	// How many milliseconds each frame will last
	var frameTime = runTime/totalFrames;
	
	var _this = this;
	var frameindex = -1;
	var canvasLocked = false;
	var int = setInterval(function(){
		frameindex++;
		try{
			if(canvasLocked) return;
			canvasLocked = true;
			var canvas = _this.eCanvas.canvas;
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(_this.renderedFrames[frameindex], 0, 0);
		}catch(e){
			clearInterval(int);
			playCbk();
		}
		canvasLocked = false;
	}, frameTime);
	return this;
};

/**
 * Get the total runtime of the rendered animation
 * @returns Number
 */
EchoTimeline.prototype.getTotalRuntime = function(){
	var runTime = 0;
	for(var i=this.animationStack.length; i--;){
		var time = this.animationStack[i].starttime + this.animationStack[i].time;
		if(time>runTime) runTime = time;
	}
	return runTime;
};

/**
 * Render each frame of the animation
 * @param function renderCbk - Function to call after the render has completed
 * @returns EchoTimeline
 */
EchoTimeline.prototype.render = function(renderCbk){
	this.renderedFrames = [];
	var runTime = this.getTotalRuntime();
	
	// Total number of frames required
	var runTimeSeconds = runTime/1000;
	var totalFrames = this.FPS*runTimeSeconds;
	
	// How many milliseconds each frame will last
	var frameTime = runTime/totalFrames;
	
	// create a rendering canvas
	var rCanvas = document.createElement("canvas");
	rCanvas.width = this.eCanvas.width;
	rCanvas.height = this.eCanvas.height;
	rCanvas.style.display = "none";
	document.body.appendChild(rCanvas);
	
	var _this = this;
	(function recurseFrames(time,done){
		if(time >= runTime){
			done();
			return;
		}
		
		(function recurseAnimationStack(asIndex, asDone){
			if(undefined === _this.animationStack[asIndex]){
				asDone();
				return;
			}
			var animation = _this.animationStack[asIndex];
			
			var started = animation.starttime <= time;
			var finishTime = animation.starttime+animation.time;
			var finished = finishTime < time;
			
			if(!started || finished){
				recurseAnimationStack(asIndex+1, asDone);
				return;
			}
			
			var aniArray = [];
			if(animation.moveLeft !== undefined) 
				aniArray.push({type:"moveLeft", ani: animation});
			if(animation.moveRight !== undefined) 
				aniArray.push({type:"moveRight", ani: animation});
			if(animation.moveUp !== undefined) 
				aniArray.push({type:"moveUp", ani: animation});
			if(animation.moveDown !== undefined) 
				aniArray.push({type:"moveDown", ani: animation});
			if(animation.rotate !== undefined) 
				aniArray.push({type:"rotateChildren", ani: animation});
			if(animation.rotateChildren !== undefined) 
				aniArray.push({type:"rotateChildren", ani: animation});
			
			// recurse thru each animation that applies to the current frame
			(function recurseAnimations(aIndex, aDone){
				if(undefined === aniArray[aIndex]){
					aDone();
					return;
				}
				
				var a = aniArray[aIndex];
				
				// Total number of frames required for THIS ANIMATION
				var aniRunTimeSeconds = a.ani.time/1000;
				var framesPerAnimation = _this.FPS*aniRunTimeSeconds;
				
				_this.eCanvas.getObjectById(a.ani.id, function(obj){
					if(false === obj){
						recurseAnimations(aIndex+1, aDone);
						return;
					}
					
					// do transformations
					switch(a.type){
						case "moveLeft":
							var pixelsToMove = a.ani.moveLeft/framesPerAnimation;
							obj.move("x", -(pixelsToMove));
							recurseAnimations(aIndex+1, aDone);
							return;
							break;
						case "moveRight":
							var pixelsToMove = a.ani.moveRight/framesPerAnimation;
							obj.move("x", pixelsToMove);
							recurseAnimations(aIndex+1, aDone);
							return;
							break;
						case "moveUp":
							var pixelsToMove = a.ani.moveUp/framesPerAnimation;
							obj.move("y", -(pixelsToMove));
							recurseAnimations(aIndex+1, aDone);
							return;
							break;
						case "moveDown":
							var pixelsToMove = a.ani.moveDown/framesPerAnimation;
							obj.move("y", pixelsToMove);
							recurseAnimations(aIndex+1, aDone);
							return;
							break;
						case "rotate":
							var degreesToMove = a.ani.rotate/framesPerAnimation;
							if(a.ani.direction === "ccw") degreesToMove = -(degreesToMove);
							obj.rotate(degreesToMove, function(){
								recurseAnimations(aIndex+1, aDone);
							});
							return;
							break;
						case "rotateChildren":
							var degreesToMove = a.ani.rotate/framesPerAnimation;
							if(a.ani.direction === "ccw") degreesToMove = -(degreesToMove);
							obj.rotateChildren(degreesToMove, function(){
								recurseAnimations(aIndex+1, aDone);
							});
							return;
							break;
					}
				});
				
			})(0, function(){
				recurseAnimationStack(asIndex+1,asDone);
			});
			
		})(0, function(){
			// draw the frame 
			_this.eCanvas.render(function(){
				var img = new Image();
				img.onload = function(){
					_this.renderedFrames.push(img);
					recurseFrames(time+frameTime,done);
				};
				img.src = rCanvas.toDataURL();
			}, rCanvas);
		});
		
	})(0, function(){
		rCanvas.parentNode.removeChild(rCanvas);
		renderCbk();
	});
	return this;
};
