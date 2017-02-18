
/**
 * This class manages mouse events on the canvas
 * @param {EchoCanvas} echoCanvas
 * @returns {EchoMouse}
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
	this.mouseSnapOffset = false;
	this.pendingSnap = false;
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
				var newx = pos.x-_this.mouseImageOffset.x;
				var newy = pos.y-_this.mouseImageOffset.y;
				var movex = newx - _this.activeObject.x;
				var movey = newy - _this.activeObject.y;
				_this.activeObject.move("x", movex);
				_this.activeObject.move("y", movey);
				
				_this.hoverECanvas.borders = _this.eCanvas.borders;
				_this.hoverECanvas.joints = _this.eCanvas.joints;
				_this.hoverECanvas.skeleton = _this.eCanvas.skeleton;
				_this.hoverECanvas.render();
				break;
			case "SNAPJOINTS":
				
				if(_this.activeObject === false) return;
				
				// check for points within 10 px
				var all = [];
				
				var filterjoints = function(j){
					var c = [];
					for(var i in j){
						if(!j.hasOwnProperty(i)) continue;
						for(var n = 0; n<j[i].joints.length; n++){
							c.push({
								oid: i,
								jid: j[i].joints[n].id,
								x: j[i].joints[n].x,
								y: j[i].joints[n].y
							});
						}
					}
					return c;
				};
				_this.eCanvas.saveState("snapjoints");
				var canvasJoints = _this.eCanvas.getState("snapjoints");
				canvasJoints = _this.eCanvas.mapState(canvasJoints);
				canvasJoints = filterjoints(canvasJoints);
				
				_this.hoverECanvas.saveState("snapjoints");
				var objectJoints = _this.hoverECanvas.getState("snapjoints");
				objectJoints = _this.hoverECanvas.mapState(objectJoints);
				objectJoints = filterjoints(objectJoints);
				
				// check for another joint within 10 px
				var match = false;
				for(var i=objectJoints.length; i--;){
					for(var n=canvasJoints.length; n--;){
						var a = objectJoints[i].x - canvasJoints[n].x;
						var b = objectJoints[i].y - canvasJoints[n].y;
						var dist = Math.sqrt(a*a + b*b);
						if(dist < 10){
							match = [canvasJoints[n],objectJoints[i]];
							break;
						}
					}
					if(match !== false) break;
				}
				
				var newx = pos.x-_this.mouseImageOffset.x;
				var newy = pos.y-_this.mouseImageOffset.y;
				var movex = newx - _this.activeObject.x;
				var movey = newy - _this.activeObject.y;
				
				if(match !== false){
					if(_this.mouseSnapOffset === false) _this.mouseSnapOffset = pos;
					var movejx = pos.x-_this.mouseSnapOffset.x;
					var movejy = pos.y-_this.mouseSnapOffset.y;
					var newjx = match[1].x + movejx;
					var newjy = match[1].y + movejy;
					var z = parseFloat(newjx) - parseFloat(match[0].x);
					var c = parseFloat(newjy) - parseFloat(match[0].y);
					var dist = Math.sqrt(z*z + c*c);					
					if(dist > 10){
						_this.mouseSnapOffset = false;
						match = false;
						_this.pendingSnap = false;
					}else{
						_this.pendingSnap = match;
					}
				}
				
				if(match === false){
					_this.activeObject.move("x", movex);
					_this.activeObject.move("y", movey);
					_this.hoverECanvas.borders = _this.eCanvas.borders;
					_this.hoverECanvas.joints = _this.eCanvas.joints;
					_this.hoverECanvas.skeleton = _this.eCanvas.skeleton;
					_this.hoverECanvas.render();
				}
				break;
			case "SETJOINT": break;
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
				
			case "SNAPJOINTS":
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
				
			case "SETJOINT": break;
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
			case "SNAPJOINTS":
				if(_this.activeObject === false) return;
				_this.hoverECanvas.removeObjectById(_this.activeObject.id, function(o){
					if(o!==false){
						if(_this.pendingSnap !== false){
							_this.eCanvas.getObjectById(_this.pendingSnap[0].oid, function(parent){
								if(parent !== false){
									o.setAnchor(_this.pendingSnap[1].jid,_this.pendingSnap[0].jid);
									parent.appendChild(o);
									_this.eCanvas.render();
								}
								_this.pendingSnap = false;
							});
						}else{
							o.removeAnchor();
							_this.eCanvas.addObject(o);
							_this.eCanvas.render();
						}
					}
					_this.hoverECanvas.canvas.parentNode.removeChild(_this.hoverECanvas.canvas);
					_this.activeObject = false;
					_this.mouseImageOffset = {x:0,y:0};
					_this.hoverECanvas = false;
				});
				break;
			case "SETJOINT": 
				_this.eCanvas.getObjectAt(pos.x, pos.y, function(obj){
					if(obj === false) return;
					var jid = obj.id+"_EMjoint"+obj.joints.length;
					obj.setJoint(jid, pos.x, pos.y);
					_this.eCanvas.render();
				});
				break;
		}
	});
}

/**
 * Set the mouse mode:
 *		"move" for click and drag
 * @param {String} mode - The mode to set the mose to
 * @returns {EchoMouse} - The current instance
 */
EchoMouse.prototype.setMouseMode = function(mode){
	this.mode = mode.toUpperCase();
	return this;
};

/**
 * Add a callback to be called when the mouse is mved on the canvas
 * @param {Function} omcb - A function to be called
 * @returns {EchoMouse} - The current instance
 */
EchoMouse.prototype.onMove = function(omcb){
	this.mouseMoveStack.push(omcb);
	return this;
};

/**
 * Add a callback to be called when the mouse button is pressed
 * @param {Function} omcb - A function to be called
 * @returns {EchoMouse} - The current instance
 */
EchoMouse.prototype.onDown = function(omcb){
	this.mouseDownStack.push(omcb);
	return this;
};

/**
 * Add a callback to be called when the mouse button is released
 * @param {Function} omcb - A function to be called
 * @returns {EchoMouse} - The current instance
 */
EchoMouse.prototype.onUp = function(omcb){
	this.mouseUpStack.push(omcb);
	return this;
};

/**
 * Helper function to bind an event
 * @param {DOMElement} el - An HTML element to bind an event to
 * @param {String} ev - The type of event to bind (minus the "on")
 * @param {Funtion} fn - The function to be calledwhen the event is fired
 *		This function is passed the Event object.
 * @returns {EchoMouse} - The current instance
 */
EchoMouse.prototype.bind = function(el, ev, fn){
	if(window.addEventListener){ // modern browsers including IE9+
		el.addEventListener(ev, fn, false);
	} else if(window.attachEvent) { // IE8 and below
		el.attachEvent('on' + ev, fn);
	} else {
		el['on' + ev] = fn;
	}
	return this;
};

/**
 * Helper function to get the mouse position on the canvas
 * http://stackoverflow.com/a/10450761/1444609
 * @param {Event} evt - Theevent that is passed to the callback function
 * @returns {Object} - Object with x & y coords
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