
/**
 * Create an EchoObjects from spritesheets
 * @param {EchoCanvas} eCanvas - The EchoCanvas instance to animate
 * @returns {EchoAnimation}
 */
function EchoSpritesheet(url){
	this.url = url;
	this.loadCallbackStack = [];
	this.sprites = {};
	
	this.img = false;
	var i = new Image();
	var _this = this;
	i.onload = function(){
		_this.img = i;
		while(_this.loadCallbackStack.length) 
			_this.loadCallbackStack.shift()();
	};
	i.src = this.url;
}

/**
 * Register a function to be called when the spritesheet loads
 * @param {Function} oCbk - A function to call when the spritesheet loads
 * @returns {EchoSpritesheet} - The current EchoSpritesheet instance
 */
EchoSpritesheet.prototype.onload = function(oCbk){
	if("function" !== typeof oCbk) oCbk = function(){};
	this.loadCallbackStack.push(oCbk);
	if(this.img !== false)
		while(this.loadCallbackStack.length) 
			this.loadCallbackStack.shift()();
	return this;
};

/**
 * Make a sprite
 * @param {Number} x - X ordinate to begin crop
 * @param {Number} y - Y ordinate to begin crop
 * @param {Number} w - Width of sprite
 * @param {Number} h - Height of sprite
 * @returns {EchoSpritesheet}
 */
EchoSpritesheet.prototype.makeSprite = function(id, x, y, w, h){
	var c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	var ctx = c.getContext("2d");
	var _this = this;
	this.onload(function(){
		ctx.drawImage(_this.img, x, y, w, h, 0, 0, w, h);
		_this.sprites[id] = new EchoObject(id, c.toDataURL());
	});
	return this;
};

