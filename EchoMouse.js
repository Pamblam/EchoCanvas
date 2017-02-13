
/**
 * This class manages mouse events on the canvas
 * @param EchoCanvas echoCanvas
 * @returns EchoMouse
 */
function EchoMouse(echoCanvas){
	this.eCanvas = echoCanvas;
	this.mode = null;
	this.mouseMoveStack = [];
	this.mouseDownStack = [];
	this.mouseUpStack = [];
	this.mouseMode = null;
	this.activeObject = false;
	this.mouseImageOffset = {x:0,y:0};
	this.hoverECanvas = false;
	var _this = this;
	
	// Register mouse events
	this.bind(this.eCanvas.canvas, "mousemove", function(e){
		for(var i=0; i<_this.mouseMoveStack.length; i++)
			_this.mouseMoveStack[i](e);
	});
	this.bind(this.eCanvas.canvas, "mouseup", function(e){
		for(var i=0; i<_this.mouseUpStack.length; i++)
			_this.mouseUpStack[i](e);
	});
	this.bind(this.eCanvas.canvas, "mousedown", function(e){
		for(var i=0; i<_this.mouseDownStack.length; i++)
			_this.mouseDownStack[i](e);
	});
	
	// Register mousemode events
	this.onMove(function(e){
		var pos = _this.getPos(e);
		switch(_this.mode){
			case "MOVE":
				if(_this.activeObject === false) return;
				_this.activeObject.x = pos.x-_this.mouseImageOffset.x;
				_this.activeObject.y = pos.y-_this.mouseImageOffset.y;
				_this.hoverECanvas.render();
				break;
		}
	});
	this.onDown(function(e){
		var pos = _this.getPos(e);
		switch(_this.mode){
			case "MOVE":
				_this.eCanvas.getObjectAt(pos.x, pos.y, function(o){
					if(o === false) return;
					_this.eCanvas.removeObjectById(o.id, function(obj){
						if(obj === false) return;
						_this.activeObject = obj;
						_this.mouseImageOffset.x = pos.x - obj.x;
						_this.mouseImageOffset.y = pos.y - obj.y;
						_this.eCanvas.render();
						// Draw a canvas on top of the other canvas
						
						var element = _this.eCanvas.canvas;
						var top = 0, left = 0;
						do {
							top += element.offsetTop  || 0;
							left += element.offsetLeft || 0;
							element = element.offsetParent;
						} while(element);

						var rect = {
							top: top,
							left: left
						};
						
						var cs = getComputedStyle(_this.eCanvas.canvas,null);
						var w = cs.getPropertyValue('width');
						var h = cs.getPropertyValue('height');
						
						var newCanvas = document.createElement("canvas");
						var _cid = _this.eCanvas.canvasID+"_hover";
						newCanvas.setAttribute("id", _cid);
						newCanvas.setAttribute("style", "position:absolute; top:"+rect.top+"px; left:"+rect.left+"px; width:"+(w || "")+"; height: "+(h || "")+";");
						document.body.appendChild(newCanvas);
						_this.hoverECanvas = new EchoCanvas(_cid, _this.eCanvas.width, _this.eCanvas.height);
						_this.hoverECanvas.addObject(obj);
						_this.hoverECanvas.render();
						_this.bind(_this.hoverECanvas.canvas, "mousemove", function(e){
							for(var i=0; i<_this.mouseMoveStack.length; i++)
								_this.mouseMoveStack[i](e);
						});
						_this.bind(_this.hoverECanvas.canvas, "mouseup", function(e){
							for(var i=0; i<_this.mouseUpStack.length; i++)
								_this.mouseUpStack[i](e);
						});
						_this.bind(_this.hoverECanvas.canvas, "mousedown", function(e){
							for(var i=0; i<_this.mouseDownStack.length; i++)
								_this.mouseDownStack[i](e);
						});
					});
				});
				break;
		}
	});
	this.onUp(function(e){
		var pos = _this.getPos(e);
		switch(_this.mode){
			case "MOVE":
				if(_this.activeObject === false) return;
				_this.hoverECanvas.removeObjectById(_this.activeObject.id, function(o){
					if(o!==false){
						_this.eCanvas.addObject(o);
						_this.eCanvas.render();
					}
					_this.hoverECanvas.canvas.parentNode.removeChild(_this.hoverECanvas.canvas);
					_this.activeObject = false;
					_this.mouseImageOffset = {x:0,y:0};
					_this.hoverECanvas = false;
				});
				break;
		}
	});
}

/**
 * Set the mouse mode:
 *		"move" for click and drag
 * @param String mode - The mode to set the mose to
 * @returns EchoMouse - The current instance
 */
EchoMouse.prototype.setMouseMode = function(mode){
	this.mode = mode.toUpperCase();
	return this;
};

/**
 * Add a callback to be called when the mouse is mved on the canvas
 * @param Function omcb - A function to be called
 * @returns EchoMouse - The current instance
 */
EchoMouse.prototype.onMove = function(omcb){
	this.mouseMoveStack.push(omcb);
	return this;
};

/**
 * Add a callback to be called when the mouse button is pressed
 * @param Function omcb - A function to be called
 * @returns EchoMouse - The current instance
 */
EchoMouse.prototype.onDown = function(omcb){
	this.mouseDownStack.push(omcb);
	return this;
};

/**
 * Add a callback to be called when the mouse button is released
 * @param Function omcb - A function to be called
 * @returns EchoMouse - The current instance
 */
EchoMouse.prototype.onUp = function(omcb){
	this.mouseUpStack.push(omcb);
	return this;
};

/**
 * Helper function to bind an event
 * @param DOMElement el
 * @param String ev
 * @param Funtion fn
 * @returns undefined
 */
EchoMouse.prototype.bind = function(el, ev, fn){
	if(window.addEventListener){ // modern browsers including IE9+
		el.addEventListener(ev, fn, false);
	} else if(window.attachEvent) { // IE8 and below
		el.attachEvent('on' + ev, fn);
	} else {
		el['on' + ev] = fn;
	}
};

/**
 * Helper function to get the mouse position on the canvas
 * http://stackoverflow.com/a/10450761/1444609
 * @param Event evt
 * @returns Object - Object with x & y coords
 */
EchoMouse.prototype.getPos = function(evt) {
	var rect = this.eCanvas.canvas.getBoundingClientRect();
	var cs = getComputedStyle(this.eCanvas.canvas,null);
	var borderWidth = parseFloat(cs.getPropertyValue('border-left-width'))+
			parseFloat(cs.getPropertyValue('border-right-width'));
	var borderHeight = parseFloat(cs.getPropertyValue('border-top-width'))+
			parseFloat(cs.getPropertyValue('border-bottom-width'));
	var scaledWidth = this.eCanvas.canvas.clientWidth+borderWidth;
	var scaledHeight = this.eCanvas.canvas.clientHeight+borderHeight;
    var X = (evt.clientX - rect.left) / (scaledWidth / this.eCanvas.canvas.width);
    var Y = (evt.clientY - rect.top) / (scaledHeight / this.eCanvas.canvas.height);
    X = Math.ceil(X);
    Y = Math.ceil(Y);
    return {
        x: X,
        y: Y
    };
};