

function EchoTimeline(canvasID,eAnimation,w){
	this.canvasID = canvasID;
	this.canvas = document.getElementById(canvasID);
	var cs = getComputedStyle(this.canvas,null);
	var width = parseFloat(cs.getPropertyValue('width'))
	this.width = w || width;
	this.height = 0;
	this.canvas.width = this.width;
	this.canvas.height = 10;
	this.eAnimation = eAnimation;
}

EchoTimeline.prototype.render = function(){
	// draw seconds
	var stack = this.eAnimation.getStack();
	var hgt = stack.length * 10;
	this.height = hgt;
	this.canvas.height = hgt;
	var time = this.eAnimation.getTotalRuntime();
	var mspp = time / this.width; // ms per pixel
	
	if(time === 0) return;
	
	var ctx=this.canvas.getContext("2d");
	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
	var y = 0;
	for(var i=0; i<stack.length; i++){
		var x = stack[i].starttime === 0 ? 0 : stack[i].starttime / mspp;
		var w = stack[i].time / mspp;
		ctx.save();
		if(stack[i].moveLeft !== undefined) ctx.fillStyle = "rgba(255,0,0,0.7)";
		if(stack[i].moveRight !== undefined) ctx.fillStyle = "rgba(255,116,0,0.7)";
		if(stack[i].moveUp !== undefined) ctx.fillStyle = "rgba(0,153,153,0.7)";
		if(stack[i].moveDown !== undefined) ctx.fillStyle = "rgba(0,204,0,0.7)";
		if(stack[i].rotate !== undefined) ctx.fillStyle = "rgba(156,169,48,0.7)";
		if(stack[i].rotateChildren !== undefined) ctx.fillStyle = "rgba(248,90,70,0.7)";
		ctx.fillRect(x,y,w,10);
		ctx.strokeStyle = "rgba(0,0,0,0.7)";
		ctx.lineWidth = 1;
		ctx.strokeRect(x,y,w,10);
		ctx.restore();
		y+=10;
	}
	
	for(var s=0; s<=time; s+=1000){
		var x = s / mspp;
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(x,0);
		ctx.lineTo(x,hgt);
		ctx.strokeStyle = s%5000===0?"rgba(0,0,0,0.7)":"rgba(0,0,255,0.2)";
		ctx.stroke();
		ctx.restore();
	}
	
	var x = this.eAnimation.cursor / mspp;
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x,0);
	ctx.lineTo(x,hgt);
	ctx.lineWidth = 3;
	ctx.strokeStyle = "rgba(0,0,0,1)";
	ctx.stroke();
	ctx.restore();
	
	if(this.eAnimation.state === "rendering"){
		ctx.save();
		ctx.fillStyle = "rgba(0,0,255,0.2)";
		ctx.fillRect(0,0,x,hgt);
		ctx.restore();
	}
	
	if(this.eAnimation.state === "playing"){
		ctx.save();
		ctx.fillStyle = "rgba(0,255,0,0.2)";
		ctx.fillRect(0,0,x,hgt);
		ctx.restore();
	}
};