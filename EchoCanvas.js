
/**
 * Create a new EchoCanvas
 * @param String canvasID - The id of the canvas to draw on
 * @param Number w - (Optional) Canvas width
 * @param Number h - (Optional) Canvas height
 * @returns EchoCanvas
 */
function EchoCanvas(canvasID,w,h){
	this.canvasID = canvasID;
	this.canvas = document.getElementById(canvasID);
	this.width = w || this.canvas.width;
	this.height = h || this.canvas.height;
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.children = [];
	this.states = {};
	this.rendering = false;
	this.borders = false;
	this.joints = false;
	this.skeleton = false;
}

/**
 * Save the current state of the canvas
 * @param string stateID - namespace for the current state
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.saveState = function(stateID){
	this.states[stateID] = {
		width: this.width,
		height: this.height,
		children: []
	};
	this.states[stateID].children = JSON.parse(JSON.stringify(this.children, 
		["id","x","y","width","height","uri","joints","children","rotation",
		"eoType","fillColor","borderColor","borderWidth","anchor"]));
	return this;
};

/**
 * Get the object representation of the requested state
 * @param string stateID - The ID of the state to retreive
 * @returns object - The requested state
 */
EchoCanvas.prototype.getState = function(stateID){
	return this.states[stateID];
};

/**
 * Revert to a prior state
 * @param string stateID - The ID of the state to revert to
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.setState = function(stateID){
	this.loadState(this.states[stateID]);
	return this;
};

/**
 * Remove an object and pass it into teh callback 
 * @param String id - The ID of the object to remove
 * @param Function callback - Callbackto be called after object is removed
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.removeObjectById = function(id, callback){
	var _this = this;
	this.getObjectById(id, function(obj){
		if(obj === false) return callback(false);
		_this.saveState("Removing_"+obj.id);
		_this.loadState(_this.states["Removing_"+obj.id], [obj.id]);
		callback(obj);
	});
	return this;
};

/**
 * Load a state from an object
 * @param object state - an object representing a canvas state
 * @param except - An array of object IDs to omit while loading
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.loadState = function(state, except){
	if(typeof except !== "object" || !Array.isArray(except)) except = [];
	this.width = state.width;
	this.height = state.height;
	this.children = (function loadChildren(children){
		if(!children.length) return children;
		var ch = [];
		for(var i=0; i<children.length; i++)(function(child){
			if(except.indexOf(child.id) > -1) return;
			var c;
			switch(child.eoType){
				case "EchoRectObject":
					c = EchoRectObject(child.id,child.width,child.height,
						child.fillColor,child.borderColor,child.borderWidth,
						child.x,child.y);
					break;
				case "EchoObject":
					c = new EchoObject(child.id,child.uri,child.x,child.y,
						child.width,child.height);
					break;
				default: throw new Error("Invalid object type");
			}
			c.rotation = child.rotation;
			c.joints = child.joints;
			c.children = loadChildren(child.children);
			for(var n=0; n<c.children.length; n++) c.children[n].parent = c;
			ch.push(c);
		})(children[i]);
		return ch;
	})(state.children);
	for(var n=0; n<this.children.length; n++) this.children[n].parent = this;
	return this;
};

/**
 * Get a flat object containing info about all objects
 * @param Object state - A State object
 * @param Array except - Array of objects sto skip
 * @returns Object - A flat object containing info about all objects on the canvas
 */
EchoCanvas.prototype.mapState = function(state, except){
	if(typeof except !== "object" || !Array.isArray(except)) except = [];
	var map = {};
	(function mapChildren(children){
		if(!children.length) return;
		var ch = [];
		for(var i=0; i<children.length; i++)(function(child){
			if(except.indexOf(child.id) > -1) return;
			map[child.id] = child;
			mapChildren(child.children);
		})(children[i]);
		return ch;
	})(state.children);
	return map;
};

/**
 * Get the element with the given id
 * @param String id - ID of an object on the canvas
 * @param Function goCbk - The function to be called when object is found or not
 * @returns EchoCanvas - Thecurrent instance
 */
EchoCanvas.prototype.getObjectById = function(id, goCbk){
	var object = false;
	this.recurseObjects(function(obj,done){
		if(obj.id === id) object = obj;
		done();
	},function(){
		goCbk(object);
	});
	return this;
};

/**
 * Add an object to the canvas
 * @param EchoObject obj - The object to add to the canvas
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.addObject = function(obj){
	obj.parent = this;
	this.children.push(obj);
	return this;
};

/**
 * Draw each object on the canvas
 * @param Function renderCallback - Function to call when render has completed
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.render = function(renderCallback, canvas){	
	if("function" !== typeof renderCallback) renderCallback = function(){};
	if(this.rendering) return renderCallback();
	this.rendering = true;
	var _this = this;
	var b=false, j=false, s=false;
	var cb = function(){ 
		if(_this.borders && !b){
			_this.showBorders(function(){
				b=true; cb();
			});
			return;
		}
		if(_this.joints && !j){
			_this.showJoints(function(){
				j=true; cb();
			});
			return;
		}
		if(_this.skeleton && !s){
			_this.showSkeleton(function(){
				s=true; cb();
			});
			return;
		}
		_this.rendering=false; 
		renderCallback(); 
	};
	var ctx = (undefined === canvas ? this.canvas : canvas).getContext('2d');
	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.recurseObjects(function(obj,done){
		obj.onload(function(){
			ctx.save(); 
			var imageCenter = {x: obj.x+(obj.width/2), y: obj.y+(obj.height/2)};
			ctx.translate(imageCenter.x, imageCenter.y);
			ctx.rotate(obj.rotation * Math.PI / 180);
			ctx.drawImage(obj.img, -(obj.width/2), -(obj.height/2), obj.width,  obj.height);
			ctx.restore(); 
			done();
		});
	}, cb);
	return this;
};

/**
 * Show the joints on the canvas
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.showJoints = function(cb){
	var ctx = this.canvas.getContext('2d');
	this.recurseObjects(function(obj,done){
		obj.onload(function(){
			var corners = (obj.id+(['TopLeft','TopRight','BottomLeft','BottomRight'].join(","+obj.id))).split(",");
			for(var i=0; i<obj.joints.length; i++){
				if(corners.indexOf(obj.joints[i].id) > -1) continue;
				var centerX = obj.joints[i].x;
				var centerY = obj.joints[i].y;
				var radius = 3;
				ctx.beginPath();
				ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
				ctx.lineWidth = 2;
				ctx.strokeStyle = 'red';
				ctx.stroke();
			}
			done();
		});
	}, cb);
	return this;
};

/**
 * Show skelton on the canvas
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.showSkeleton = function(cb){
	var ctx = this.canvas.getContext('2d');
	this.recurseObjects(function(obj,done){
		obj.onload(function(){
			var corners = (obj.id+(['TopLeft','TopRight','BottomLeft','BottomRight'].join(","+obj.id))).split(",");
			for(var i=0; i<obj.joints.length; i++){
				if(corners.indexOf(obj.joints[i].id) > -1) continue;
				// draw a line from every joint to every other joint
				for(var n=obj.joints.length; n--;){
					if(i===n || corners.indexOf(obj.joints[n].id) > -1) continue;
					ctx.beginPath();
					ctx.moveTo(obj.joints[n].x, obj.joints[n].y);
					ctx.lineTo(obj.joints[i].x, obj.joints[i].y);
					ctx.lineWidth = 2;
					ctx.strokeStyle = 'green';
					ctx.stroke();
				}
			}
			done();
		});
	},cb);
	return this;
};

/**
 * Get the object that is at the given coordinates
 * @param Number x - The x ordinate
 * @param Number y - The y ordinate
 * @returns {undefined}
 */
EchoCanvas.prototype.getObjectAt = function(x, y, callback){
	var retObj = false;
	this.recurseObjects(function(obj, done){
		obj.onload(function(){
			var betweenH = x > obj.x && x < obj.x+obj.width;
			var betweenV = y > obj.y && y < obj.y+obj.height;
			if(betweenH && betweenV) retObj = obj;
			done();
		});
	}, function(){
		callback(retObj);
	});
};

/**
 * Show each objects boundary
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.showBorders = function(cb){
	var ctx = this.canvas.getContext('2d');
	this.recurseObjects(function(obj,done){
		obj.onload(function(){
			ctx.beginPath();
			var tl = obj.joints[obj.getJointIndexById(obj.id+"TopLeft")];
			var tr = obj.joints[obj.getJointIndexById(obj.id+"TopRight")];
			var bl = obj.joints[obj.getJointIndexById(obj.id+"BottomLeft")];
			var br = obj.joints[obj.getJointIndexById(obj.id+"BottomRight")];
			ctx.moveTo(tl.x, tl.y);
			ctx.lineTo(tr.x, tr.y);
			ctx.lineTo(br.x, br.y);
			ctx.lineTo(bl.x, bl.y);
			ctx.lineTo(tl.x, tl.y);
			ctx.lineWidth = 2;
			ctx.strokeStyle = 'blue';
			ctx.stroke();
			done();
		});
	}, cb);
	return this;
};

/**
 * Recurse through all objects on the canvas
 * @param Funtion funct - The function to be called on each object, it is passed 
 *		the object and a function to be called when recursion may continue 
 * @param Function roCbk - (Optional) A function to be called when the recursion is complete
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.recurseObjects = function(funct, roCbk){
	if("function" !== typeof funct) funct = function(){};
	if("function" !== typeof roCbk) roCbk = function(){};
	(function recurse(objs, index, rCbk){
		if(objs[index] === undefined){
			rCbk();
			return;
		}
		funct(objs[index], function(){
			recurse(objs[index].children,0,function(){
				recurse(objs, index+1, rCbk);
			});
		});		
	})(this.children, 0, roCbk);
	return this;
};

/**
 * Get a unique ID to use for an object
 * @param String|Function idOrCallback - Either an ID to check against or the 
 *		function to be called when the ID is checked/generated
 * @param Function callback - Only used if an ID is passeed as the first paramter,
 *		the callback function to be called when the unique ID is generated
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.getUniqueId = function(idOrCallback, callback){
	var id = "string" === typeof idOrCallback ? idOrCallback : "eo_";
	var cb = "function" === typeof idOrCallback ? idOrCallback : function(){};
	if(typeof callback === "function") cb = callback;
	var ids = [];
	this.recurseObjects(function(obj, done){
		ids.push(obj.id);
		done();
	},function(){
		var uid = id, counter = 0;
		while(ids.indexOf(uid) > -1){
			uid = id+counter;
			counter++;
		}
		cb(uid);
	});
	return this;
};