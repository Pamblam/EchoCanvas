

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
	
	var stack = this.eAnimation.getStack();
	var time = this.eAnimation.getTotalRuntime();
	var mspp = time / this.width; // ms per pixel
	
	if(time === 0) return;
	
	var maxy=0, m = {};
	for(var i=0; i<stack.length; i++){
		if(stack[i].moveLeft !== undefined){
			stack[i].color = "rgba(255,0,0,0.7)";
			stack[i].type = "Move Left";
		}
		if(stack[i].moveRight !== undefined){
			stack[i].color = "rgba(255,116,0,0.7)";
			stack[i].type = "Move Right";
		}
		if(stack[i].moveUp !== undefined){
			stack[i].color = "rgba(0,153,153,0.7)";
			stack[i].type = "Move Up";
		}
		if(stack[i].moveDown !== undefined){
			stack[i].color = "rgba(0,204,0,0.7)";
			stack[i].type = "Move Down";
		}
		if(stack[i].rotate !== undefined){
			stack[i].color = "rgba(156,169,48,0.7)";
			stack[i].type = "Rotate";
		}
		if(stack[i].rotateChildren !== undefined){
			stack[i].color = "rgba(248,90,70,0.7)";
			stack[i].type = "Rotate Children";
		}
		if(undefined === m[stack[i].id]) m[stack[i].id] = {};
		if(undefined === m[stack[i].id][stack[i].type]) m[stack[i].id][stack[i].type] = 0;
	}
	
	for(var id in m){
		if(!m.hasOwnProperty(id)) continue;
		for(var a in m[id]){
			if(!m[id].hasOwnProperty(a)) continue;
			m[id][a] = maxy;
			maxy+=10;
		}
	}
	
	this.height = maxy;
	this.canvas.height = maxy;
	
	var ctx=this.canvas.getContext("2d");
	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
	for(var i=0; i<stack.length; i++){
		var x = stack[i].starttime === 0 ? 0 : stack[i].starttime / mspp;
		var w = stack[i].time / mspp;
		var y = m[stack[i].id][stack[i].type];
		ctx.save();
		ctx.fillStyle = stack[i].color;
		ctx.fillRect(x,y,w,10);
		ctx.strokeStyle = "rgba(0,0,0,0.7)";
		ctx.lineWidth = 1;
		ctx.strokeRect(x,y,w,10);
		ctx.restore();
	}
	
	for(var s=0; s<=time; s+=1000){
		var x = s / mspp;
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(x,0);
		ctx.lineTo(x,maxy);
		ctx.strokeStyle = s%5000===0?"rgba(0,0,0,0.7)":"rgba(0,0,255,0.2)";
		ctx.stroke();
		ctx.restore();
	}
	
	var x = this.eAnimation.cursor / mspp;
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x,0);
	ctx.lineTo(x,maxy);
	ctx.lineWidth = 3;
	ctx.strokeStyle = "rgba(0,0,0,1)";
	ctx.stroke();
	
	ctx.beginPath();
	ctx.arc(x, 0, 5, 0, 2 * Math.PI, false);
	ctx.fillStyle = "rgba(0,0,0,1)";
	ctx.fill();
	ctx.restore();
	
	if(this.eAnimation.state === "rendering"){
		ctx.save();
		ctx.fillStyle = "rgba(0,0,255,0.2)";
		ctx.fillRect(0,0,x,maxy);
		ctx.restore();
	}
	
	if(this.eAnimation.state === "playing"){
		ctx.save();
		ctx.fillStyle = "rgba(0,255,0,0.2)";
		ctx.fillRect(0,0,x,maxy);
		ctx.restore();
	}
};