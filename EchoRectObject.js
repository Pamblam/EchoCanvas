
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
	this.width = w || 100;
	this.height = h || 100;
	this.x = x;
	this.y = y;
	this.id = id;
	this.update();
}

EchoRectObject.prototype = Object.create(EchoObject.prototype);
EchoRectObject.prototype.constructor = EchoRectObject;

EchoRectObject.prototype.update = function(){
	var rCanvas = document.createElement("canvas");
	rCanvas.width = this.width;
	rCanvas.height = this.height;
	rCanvas.style.display = "none";
	document.body.appendChild(rCanvas);
	var ctx = rCanvas.getContext("2d");
	
	ctx.lineWidth = this.borderWidth;
	if(this.fillColor) ctx.fillStyle = this.fillColor;
	if(this.fillColor) ctx.rect(this.borderWidth, this.borderWidth, this.width-(this.borderWidth*2), this.height-(this.borderWidth*2));
	if(this.fillColor) ctx.fill("evenodd");
	if(this.borderColor) ctx.strokeStyle = this.borderColor;
	if(this.borderColor) ctx.strokeRect(this.borderWidth, this.borderWidth, this.width-(this.borderWidth*2), this.height-(this.borderWidth*2));

	var uri = rCanvas.toDataURL();
	rCanvas.parentNode.removeChild(rCanvas);
	EchoObject.apply(this, [this.id,uri,this.x,this.y,this.width,this.height]);
	this.eoType = "EchoRectObject";
};