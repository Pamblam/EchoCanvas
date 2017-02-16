
/**
 * Create an object to be drawn to canvas
 * @param String id - Canvas Unique Object ID
 * @param String uri - The URI of the image to draw
 * @param Number x - (Optional) The X Position of the element on the canvas
 * @param Number y - (Optional) The Y posisiton of the element n the canvas
 * @param Number w - (Optional) The width of the image to draw
 * @param Number h - (Optional) The height of the image to draw
 * @returns EchoObject
 */
function EchoObject(id,uri,x,y,w,h){
	this.id = id;
	this.x = x || 0;
	this.y = y || 0;
	this.width = w || false;
	this.height = h || false;
	this.uri = uri;
	this.img = false;
	this.joints = [];
	this.loadCallbackStack = [];
	this.children = [];
	this.parent = null;
	this.rotation = 0;
	this.eoType = "EchoObject";
	
	// Load the image
	var img = new Image();
	var obj = this;
	img.onload = function(){
		obj.img = img;
		if(!obj.width) obj.width = this.width;
		if(!obj.height) obj.height = this.height;
		
		// set joints on the corners
		obj.setJoint(obj.id+"TopLeft", obj.x, obj.y);
		obj.setJoint(obj.id+"TopRight", obj.x+obj.width, obj.y);
		obj.setJoint(obj.id+"BottomRight", obj.x+obj.width, obj.y+obj.height);
		obj.setJoint(obj.id+"BottomLeft", obj.x, obj.y+obj.height);
		
		while(obj.loadCallbackStack.length) 
			obj.loadCallbackStack.shift()();
	};
	img.src = this.uri;
}

/**
 * Rotate the object and all it's children
 * @param Number degrees - Degrees to rotate
 * @param Function rcCbk - A function to call when rotation is complete
 * @returns EchoObject - The current EchoObject instance
 */
EchoObject.prototype.rotateChildren = function(degrees, rcCbk){
	if("function" !== typeof rcCbk) rcCbk = function(){};
	this.rotate(degrees);
	EchoCanvas.prototype.recurseObjects.call(this, function(obj, done){
		obj.rotate(degrees, done);
	},rcCbk);
	return this;
};

/**
 * Rotate the object
 * @param Number degrees - Degrees to rotate
 * @param Function rotateCallback - A function to call when rotation is complete
 * @returns EchoObject - The current EchoObject instance
 */
EchoObject.prototype.rotate = function(degrees, rotateCallback){
	if("function" !== typeof rotateCallback) rotateCallback = function(){};
	var _this = this;
	this.onload(function(){
		_this.rotation += degrees;
		// adjust joint positions
		for(var i=0; i<_this.joints.length; i++){
			var x = _this.joints[i].x;
			var y = _this.joints[i].y;
			var cx = (_this.width/2)+_this.x;
			var cy = (_this.height/2)+_this.y;
			var tempX = x - cx;
			var tempY = y - cy;
			var rotatedX = tempX*Math.cos(degrees*Math.PI/180) - tempY*Math.sin(degrees*Math.PI/180);
			var rotatedY = tempX*Math.sin(degrees*Math.PI/180) + tempY*Math.cos(degrees*Math.PI/180);
			_this.joints[i].x = rotatedX + cx;
			_this.joints[i].y = rotatedY + cy;
		}
		_this.anchorChildren();
		if(typeof _this.parent.anchorChildren === "function") _this.parent.anchorChildren(); 
		rotateCallback();
	});
	return this;
};

/**
 * Register a function to be called when the object loads
 * @param function oCbk - A function to call when the object loads
 * @returns EchoObject - The current EchoObject instance
 */
EchoObject.prototype.onload = function(oCbk){
	if("function" !== typeof oCbk) oCbk = function(){};
	this.loadCallbackStack.push(oCbk);
	if(this.img !== false)
		while(this.loadCallbackStack.length) 
			this.loadCallbackStack.shift()();
	return this;
};

/**
 * Set an existing or new joint
 * @param String - Object unique Joint ID
 * @param Number x - The X position on the canvas to initiate the joint 
 * @param Number y - The Y position on the canvas to initiate the joint
 * @returns EchoObject - The current EchoObject instance
 */
EchoObject.prototype.setJoint = function(id,x,y){
	var index = this.getJointIndexById(id) || this.joints.length;
	this.joints[index] = {id:id, x:x, y:y, anchor:false};
	return this;
};

EchoObject.prototype.removeAnchor = function(){
	for(var i=this.joints.length; i--;) 
		this.joints[i].anchor = false;
	return this;
};

/**
 * Set a joint that is anchored to another joint
 * @param String - Object unique Joint ID
 * @param String anchorID - The ID of a joint on a parent object to anchor to
 * @returns EchoObject - The current EchoObject instance
 */
EchoObject.prototype.setAnchor = function(id,anchorID){
	// Only one anchor allowed per object
	this.removeAnchor();
	var index = this.getJointIndexById(id);
	var x,y;
	if(false !== index){
		x = this.joints[index].x;
		y = this.joints[index].y;
	}else{
		index = this.joints.length;
		x=0; y=0;
	}
	this.joints[index] = {id:id, x:x, y:y, anchor:anchorID};
	return this;
};

/**
 * Add a child object
 * @param EchoObject object
 * @returns EchoObject - The current EchoObject instance
 */
EchoObject.prototype.appendChild = function(object){
	object.parent = this;
	this.children.push(object);
	this.anchorChildren();
	return this;
};

/**
 * Loop through child elements and align any that are anchored to this element
 * @returns EchoObject
 */
EchoObject.prototype.anchorChildren = function(){
	var _this = this;
	for(var n=this.children.length; n--;) (function(object){
		// check for joints on child object that are anchored to joints on this object
		for(var i=object.joints.length; i--;){
			if(object.joints[i].anchor !== false){
				var anchorToIndex = _this.getJointIndexById(object.joints[i].anchor);
				var anchoringIndex = object.getJointIndexById(object.joints[i].id);
				if(anchorToIndex !== false && anchoringIndex !== false){
					// calculate difference and move object accordingly
					var xDiff = _this.joints[anchorToIndex].x - object.joints[anchoringIndex].x;
					var yDiff = _this.joints[anchorToIndex].y - object.joints[anchoringIndex].y;
					object.move("x",xDiff);
					object.move("y",yDiff);
				}
				break;
			}
		}
	})(this.children[n]);
	return this;
};

/**
 * 
 * @param String axis - The axis to move along, either x or y
 * @param Number distance - How far to move
 * @returns EchoObject - Thecurrent instance
 */
EchoObject.prototype.move = function(axis,distance){
	this[axis] += distance;
	for(var i=this.joints.length; i--;) 
		this.joints[i][axis] += distance;
	for(var i=this.children.length; i--;)
		this.children[i].move(axis,distance);
	return this;
};

/**
 * Get the index of a joint by it's Joint ID
 * @param String id - The Joint ID of the joint to get the index of
 * @returns Number|Boolean - The Index of the joint with the given index or FALSE
 */
EchoObject.prototype.getJointIndexById = function(id){
	for(var i=this.joints.length; i--;) 
		if(this.joints[i].id === id) return i;
	return false;
};
