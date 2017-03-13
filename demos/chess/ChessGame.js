function ChessGame(pieces){
	this.pieces = pieces;
	this.turn = "Black";
	this.selectedPiece = false;
	this.captured = [];
};

ChessGame.prototype.iteratePieces = function(cb){
	for(var color in this.pieces){
		if(!this.pieces.hasOwnProperty(color)) continue;
		for(var name in this.pieces[color]){
			if(!this.pieces[color].hasOwnProperty(name)) continue;
			cb(this.pieces[color][name], color, name);
		}
	}
	return this;
};

ChessGame.prototype.autoMove = function(){
	var moves = this.getAllMoves();
	var max = 5;
	if(!moves.length) console.log("Game over");
	if(moves.length < max) max = moves.length-1;
	var i = Math.floor(Math.random() * (max + 1));
	var move = moves[i];
	this.pickUp(move.piece.posit);
	var _this = this;
	setTimeout(function(){
		console.log(move);
		_this.move(move.move.posit);
	}, 500);
};

ChessGame.prototype.getAllMoves = function(){
	var allMoves = [];
	var _this = this;
	this.iteratePieces(function(p, color){
		if(_this.turn !== color) return;
		var mvs = _this.getMoves(p);
		for(var i =mvs.length; i--;) {
			if("abcdefgh".split("").indexOf(mvs[i].posit[0]) < 0) continue;
			allMoves.push({piece:p, move:mvs[i]});
		}
	});
	for(var i=allMoves.length; i--;){
		allMoves[i].rating=0;
		if(allMoves[i].piece.class !== "Pawn") 
			allMoves[i].rating += 1;
		if(allMoves[i].move.capture){
			allMoves[i].rating += 1;
			var p = _this.getPieceAtPosit(allMoves[i].move.posit);
			if(p.class !== "Pawn") 
				allMoves[i].rating += 1;
			if(p.class === "Queen") 
				allMoves[i].rating += 3;
			if(p.class === "King") 
				allMoves[i].rating += 6;
		}
	}
	allMoves.sort(function(a,b){
		if(a.rating > b.rating) return -1;
		if(a.rating < b.rating) return +1;
		return 0;
	});
	return allMoves;
};

ChessGame.prototype.resetBoard = function(){
	var _this = this;
	this.iteratePieces(function(piece, color, name){
		var posit = ["a", 8];
		switch(name){
			case "Castle 1": posit = ["a", color==="White"?8:1]; break;
			case "Castle 2": posit = ["h", color==="White"?8:1]; break;
			case "Knight 1": posit = ["b", color==="White"?8:1]; break;
			case "Knight 2": posit = ["g", color==="White"?8:1]; break;
			case "Bishop 1": posit = ["c", color==="White"?8:1]; break;
			case "Bishop 2": posit = ["f", color==="White"?8:1]; break;
			case "King": posit = [color==="White"?"d":"e", color==="White"?8:1]; break;
			case "Queen": posit = [color==="White"?"e":"d", color==="White"?8:1]; break;
			case "Pawn 1": posit = ["a", color==="White"?7:2]; break;
			case "Pawn 2": posit = ["b", color==="White"?7:2]; break;
			case "Pawn 3": posit = ["c", color==="White"?7:2]; break;
			case "Pawn 4": posit = ["d", color==="White"?7:2]; break;
			case "Pawn 5": posit = ["e", color==="White"?7:2]; break;
			case "Pawn 6": posit = ["f", color==="White"?7:2]; break;
			case "Pawn 7": posit = ["g", color==="White"?7:2]; break;
			case "Pawn 8": posit = ["h", color==="White"?7:2]; break;
		}
		_this.move(posit, piece, false);
	});
	echo.render();
	return this;
};

ChessGame.prototype.positToCoords = function(posit){
	var xmap = ["a","b","c","d","e","f","g","h"];
	return [
		xmap.indexOf(posit[0])*50,
		(8-posit[1])*50
	];
};

ChessGame.prototype.move = function(posit, piece, render){
	var _this = this;
	(function(cb){
		if(piece !== undefined) return cb();
		var moves = _this.getMoves(_this.selectedPiece);
		for(var i=moves.length; i--;)
			if(moves[i].posit[0]===posit[0] && moves[i].posit[1]===posit[1])
				return cb(moves[i]);
		console.log("Invalid Move");
	})(function(move){
		_this.removeHighlights(function(){
			(function(done){
				if(undefined === move || !move.capture) return done();
				var capPiece = _this.getPieceAtPosit(move.posit);
				done(capPiece.object.id);
			})(function(remId){
				if(undefined === render) render = true;
				if(undefined === piece){
					piece = _this.selectedPiece;
					_this.turn = _this.turn==="Black"?"White":"Black";
					_this.selectedPiece = false;
				}
				if(piece === false) return;
				var o = _this.positToCoords(piece.posit);
				var d = _this.positToCoords(posit);
				piece.object.move("x", d[0]-o[0]);
				piece.object.move("y", d[1]-o[1]);
				piece.posit = posit;
				if(remId){
					echo.removeObjectById(remId, function(capPiece){
						_this.captured.push(capPiece);
						if(render) echo.render();
					});
				}else if(render) echo.render();
			});
		});
	});
};

ChessGame.prototype.getMoves = function(piece){
	var map = "abcdefgh".split("");
	if(undefined === piece.posit) console.log(piece);
	var x = map.indexOf(piece.posit[0]);
	var y = piece.posit[1];
	var moves = [];
	var inBounds = function(p){ return p[0] >= 0 && p[0] < 9 && p[1] > 0 && p[1] < 9};
	switch(piece.class){
		case "Pawn":
			var isHome = piece.color === "Black" ? (y === 2) : (y === 7);
			var forwardOne = [x, piece.color === "Black" ? y+1 : y-1];
			if(inBounds(forwardOne) && !this.getPieceAtPosit(forwardOne)) moves.push({posit:forwardOne,capture:false});
			if(isHome){
				var forwardTwo = [x, piece.color === "Black" ? y+2 : y-2];
				if(inBounds(forwardTwo) && !this.getPieceAtPosit(forwardTwo)) moves.push({posit:forwardTwo,capture:false});
			}
			var diagLeft = [x+1, piece.color === "Black" ? y+1 : y-1];
			if(inBounds(diagLeft)){
				var p = this.getPieceAtPosit(diagLeft);
				if(p && p.color !== piece.color) moves.push({posit:diagLeft,capture:true});
			}
			var diagRight = [x-1, piece.color === "Black" ? y+1 : y-1];
			if(inBounds(diagRight)){
				var p = this.getPieceAtPosit(diagRight);
				if(p && p.color !== piece.color) moves.push({posit:diagRight,capture:true});
			}
			break;
		case "Castle":
			// forward
			var i = 1;
			while(true){
				var forwardOne = [x, piece.color === "Black" ? y+i : y-i];
				if(!inBounds(forwardOne)) break;
				var p = this.getPieceAtPosit(forwardOne);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:forwardOne,capture:true});
					}
					break;
				}else moves.push({posit:forwardOne,capture:false});
				i++;
			}
			// backward
			i = 1;
			while(true){
				var forwardOne = [x, piece.color === "Black" ? y-i : y+i];
				if(!inBounds(forwardOne)) break;
				var p = this.getPieceAtPosit(forwardOne);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:forwardOne,capture:true});
					}
					break;
				}else moves.push({posit:forwardOne,capture:false});
				i++;
			}
			// right
			i = 1;
			while(true){
				var forwardOne = [piece.color === "Black" ? x+i : x-i, y];
				if(!inBounds(forwardOne)) break;
				var p = this.getPieceAtPosit(forwardOne);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:forwardOne,capture:true});
					}
					break;
				}else moves.push({posit:forwardOne,capture:false});
				i++;
			}
			// left
			i = 1;
			while(true){
				var forwardOne = [piece.color === "Black" ? x-i : x+i, y];
				if(!inBounds(forwardOne)) break;
				var p = this.getPieceAtPosit(forwardOne);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:forwardOne,capture:true});
					}
					break;
				}else moves.push({posit:forwardOne,capture:false});
				i++;
			}
			break;
		case "Knight":
			var poMoves = [];
			poMoves.push([x+2, y+1]);
			poMoves.push([x-2, y+1]);
			poMoves.push([x+2, y-1]);
			poMoves.push([x-2, y-1]);
			poMoves.push([x+1, y+2]);
			poMoves.push([x-1, y+2]);
			poMoves.push([x+1, y-2]);
			poMoves.push([x-1, y-2]);
			for(var i = poMoves.length; i--;){
				if(!inBounds(poMoves[i])) continue;
				var p = this.getPieceAtPosit(poMoves[i]);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:poMoves[i],capture:true});
					}else continue;
				}else moves.push({posit:poMoves[i],capture:false});
			}
			break;
		case "Bishop":
			var i=1,n=1;
			while(true){
				var move = [x+i,y+n];
				if(!inBounds(move)) break;
				var p = this.getPieceAtPosit(move);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:move,capture:true});
					}
					break;
				}else moves.push({posit:move,capture:false});
				n++;
				i++;
			}
			i=1,n=1;
			while(true){
				var move = [x-i,y+n];
				if(!inBounds(move)) break;
				var p = this.getPieceAtPosit(move);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:move,capture:true});
					}
					break;
				}else moves.push({posit:move,capture:false});
				n++;
				i++;
			}
			i=1,n=1;
			while(true){
				var move = [x+i,y-n];
				if(!inBounds(move)) break;
				var p = this.getPieceAtPosit(move);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:move,capture:true});
					}
					break;
				}else moves.push({posit:move,capture:false});
				n++;
				i++;
			}
			i=1,n=1;
			while(true){
				var move = [x-i,y-n];
				if(!inBounds(move)) break;
				var p = this.getPieceAtPosit(move);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:move,capture:true});
					}
					break;
				}else moves.push({posit:move,capture:false});
				n++;
				i++;
			}
			break;
		case "King":
			console.log("to do: check castling");
			var poMoves = [];
			poMoves.push([x+1,y]);
			poMoves.push([x-1,y]);
			poMoves.push([x,y-1]);
			poMoves.push([x,y+1]);
			poMoves.push([x-1,y-1]);
			poMoves.push([x+1,y+1]);
			poMoves.push([x+1,y-1]);
			poMoves.push([x-1,y+1]);
			for(var i = poMoves.length; i--;){
				if(!inBounds(poMoves[i])) continue;
				var p = this.getPieceAtPosit(poMoves[i]);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:poMoves[i],capture:true});
					}else continue;
				}else moves.push({posit:poMoves[i],capture:false});
			}
			break;
		case "Queen":
			var i=1,n=1;
			while(true){
				var move = [x+i,y+n];
				if(!inBounds(move)) break;
				var p = this.getPieceAtPosit(move);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:move,capture:true});
					}
					break;
				}else moves.push({posit:move,capture:false});
				n++;
				i++;
			}
			i=1,n=1;
			while(true){
				var move = [x-i,y+n];
				if(!inBounds(move)) break;
				var p = this.getPieceAtPosit(move);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:move,capture:true});
					}
					break;
				}else moves.push({posit:move,capture:false});
				n++;
				i++;
			}
			i=1,n=1;
			while(true){
				var move = [x+i,y-n];
				if(!inBounds(move)) break;
				var p = this.getPieceAtPosit(move);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:move,capture:true});
					}
					break;
				}else moves.push({posit:move,capture:false});
				n++;
				i++;
			}
			i=1,n=1;
			while(true){
				var move = [x-i,y-n];
				if(!inBounds(move)) break;
				var p = this.getPieceAtPosit(move);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:move,capture:true});
					}
					break;
				}else moves.push({posit:move,capture:false});
				n++;
				i++;
			}
			// forward
			i = 1;
			while(true){
				var forwardOne = [x, piece.color === "Black" ? y+i : y-i];
				if(!inBounds(forwardOne)) break;
				var p = this.getPieceAtPosit(forwardOne);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:forwardOne,capture:true});
					}
					break;
				}else moves.push({posit:forwardOne,capture:false});
				i++;
			}
			// backward
			i = 1;
			while(true){
				var forwardOne = [x, piece.color === "Black" ? y-i : y+i];
				if(!inBounds(forwardOne)) break;
				var p = this.getPieceAtPosit(forwardOne);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:forwardOne,capture:true});
					}
					break;
				}else moves.push({posit:forwardOne,capture:false});
				i++;
			}
			// right
			i = 1;
			while(true){
				var forwardOne = [piece.color === "Black" ? x+i : x-i, y];
				if(!inBounds(forwardOne)) break;
				var p = this.getPieceAtPosit(forwardOne);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:forwardOne,capture:true});
					}
					break;
				}else moves.push({posit:forwardOne,capture:false});
				i++;
			}
			// left
			i = 1;
			while(true){
				var forwardOne = [piece.color === "Black" ? x-i : x+i, y];
				if(!inBounds(forwardOne)) break;
				var p = this.getPieceAtPosit(forwardOne);
				if(p){
					if(p.color !== piece.color){
						moves.push({posit:forwardOne,capture:true});
					}
					break;
				}else moves.push({posit:forwardOne,capture:false});
				i++;
			}
			break;
	}
	for(var i=moves.length; i--;){
		if(undefined!==map[moves[i].posit[0]]) 
			moves[i].posit[0] = map[moves[i].posit[0]];
	}
	return moves;
};

ChessGame.prototype.removeHighlights = function(callback){ 
	var v = "abcdefgh";
	for(var i=0; i<v.length; i++){		
		for(var n=1; n<=8; n++)(function(id){
			echo.getObjectById(id, function(obj){
				if(obj && obj.highlighted){
					obj.borderColor=obj.fillColor;
					obj.borderWidth=1;
					obj.highlighted = false;
					obj.update();
				}
				if(id==="h8"){
					callback();
				}
			});
		})(v[i]+n);
	}
};

ChessGame.prototype.pickUp = function(posit){
	var piece = this.getPieceAtPosit(posit);
	if(piece && piece.color === this.turn){
		var _this = this;
		this.removeHighlights(function(){
			_this.selectedPiece=piece;
			var moves = _this.getMoves(piece), oname;
			(function recurse(i, done){
				if(undefined === moves[i]) return done();
				var id = moves[i].posit[0]+moves[i].posit[1];
				echo.getObjectById(id, function(obj){
					if(obj){
						var color = moves[i].capture?"#FF0000":"#0000FF";
						obj.borderColor=color;
						obj.borderWidth=3;
						obj.update();
						obj.highlighted = true;
					}
					recurse(i+1, done);
				});
			})(0, function(){
				var id = posit[0]+posit[1];
				echo.getObjectById(id, function(obj){
					if(obj){
						var color = "#00FF00";
						obj.borderColor=color;
						obj.borderWidth=3;
						obj.update();
						obj.highlighted = true;
					}
					echo.render();
				});
			});
		});
	}else{
		console.log("Nothing there.");
	}
};

ChessGame.prototype.getPieceAtPosit = function(posit){
	var a  = "abcdefgh".split(''), tr = a.indexOf(posit[0]) < 0; 
	if(tr) posit[0] = a[posit[0]];
	var ret  = false;
	this.iteratePieces(function(piece, color, name){
		if(piece.posit[0] === posit[0] && piece.posit[1] === posit[1]){
			ret = piece;
		}
	});
	if(tr) posit[0] = a.indexOf(posit[0]);
	return ret;
};

ChessGame.prototype.setGame = function(moves){
	var i=0;
	var _this = this;
	var int = setInterval(function(){
		if(undefined === moves[i]){
			console.log("Ready...");
			clearInterval(int);
			return;
		}
		_this[moves[i][0]]([moves[i][1], moves[i][2]])
		i++;
	},500);
};