
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
}

/**
 * Get the element with the given id
 * @param String id - ID of an object on the canvas
 * @param Function callback - The function to be called when object is found or not
 * @returns EchoCanvas - Thecurrent instance
 */
EchoCanvas.prototype.getObjectById = function(id, callback){
	var object = false;
	this.recurseObjects(function(obj,done){
		if(obj.id === id) object = obj;
		done();
	},function(){
		callback(object);
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
 * @param Function callback - Function to call when render has completed
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.render = function(callback, canvas){	
	var ctx = (canvas || this.canvas).getContext('2d');
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
	}, callback);
	return this;
};

/**
 * Show the joints on the canvas
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.showJoints = function(){
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
	});
	return this;
};

/**
 * Show skelton on the canvas
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.showSkeleton = function(){
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
	});
	return this;
};

/**
 * Show each objects boundary
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.showBorders = function(){
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
	});
	return this;
};

/**
 * Recurse through all objects on the canvas
 * @param Funtion funct - The function to be called on each object, it is passed 
 *		the object and a function to be called when recursion may continue
 * @param Function callback - (Optional) A function to be called when the recursion is complete
 * @returns EchoCanvas - The current instance
 */
EchoCanvas.prototype.recurseObjects = function(funct, callback){
	if("function" !== typeof funct) funct = function(){};
	if("function" !== typeof callback) callback = function(){};
	(function recurse(objs, index, callback){
		if(objs[index] === undefined){
			callback();
			return;
		}
		funct(objs[index], function(){
			recurse(objs[index].children,0,function(){
				recurse(objs, index+1, callback);
			});
		});		
	})(this.children, 0, callback);
	return this;
};