
/**
 * Create an object object that is a simple rectangle
 * @extends {EchoObject}
 * @param {String} id - Canvas Unique Object ID
 * @param {Number} w - (Optional) The width of the image to draw
 * @param {Number} h - (Optional) The height of the image to draw
 * @param {String} fillColor - (Optional) Color to fill the canvas
 * @param {String} borderColor - (Optional) Color to draw the border
 * @param {String} borderWidth - (Optional) The width of the border
 * @param {Number} x - (Optional) The X Position of the element on the canvas
 * @param {Number} y - (Optional) The Y posisiton of the element n the canvas
 * @returns {EchoRectObject}
 */
function EchoRectObject(id,w,h,fillColor,borderColor,borderWidth,x,y){
	this.fillColor = fillColor;
	this.borderColor = borderColor;
	this.borderWidth = borderWidth || 1;
	
	var rCanvas = document.createElement("canvas");
	rCanvas.width = w || 100;
	rCanvas.height = h || 50;
	rCanvas.style.display = "none";
	document.body.appendChild(rCanvas);
	var ctx = rCanvas.getContext("2d");
	
	var rect = this.fillColor ? "fillRect" : "rect";
	if(this.fillColor) ctx.fillStyle = this.fillColor;
	if(this.borderColor) ctx.strokeStyle = this.borderColor;
	if(this.borderWidth) ctx.lineWidth = this.borderWidth;
	
	if(this.borderWidth > 0){
		w = w - (this.borderWidth*2);
		h = h - (this.borderWidth*2);
	}
	ctx.rect(0,0,w,h);
	if(this.borderColor) ctx.stroke();
	var uri = rCanvas.toDataURL();
	rCanvas.parentNode.removeChild(rCanvas);
	
	EchoObject.apply(this, [id,uri,x,y,w,h]);
	this.eoType = "EchoRectObject";
}

EchoRectObject.prototype = Object.create(EchoObject.prototype);
EchoRectObject.prototype.constructor = EchoRectObject;