function ChessGame(pieces){
	this.pieces = pieces;
	this.turn = "White";
	this.selectedPiece = false;
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
		_this.move(piece, posit);
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

ChessGame.prototype.move = function(piece, posit){
	var o = this.positToCoords(piece.posit);
	var d = this.positToCoords(posit);
	piece.object.move("x", d[0]-o[0]);
	piece.object.move("y", d[1]-o[1]);
	piece.posit = posit;
};

ChessGame.prototype.pickUp = function(posit){
	var piece = this.getPieceAtPosit(posit);
	if(piece){
		this.selectedPiece=piece;
		var c = this.positToCoords(this.selectedPiece.posit);
		var sel = new EchoRectObject("SELECTED", 50, 50, undefined, "#00FF00", 3, c[0], c[1]);
		echo.addObject(sel);
		echo.render();
	}else{
		console.log("Nothing there.");
	}
};

ChessGame.prototype.getPieceAtPosit = function(posit){
	var ret  = false;
	this.iteratePieces(function(piece, color, name){
		if(piece.posit[0] === posit[0] && piece.posit[1] === posit[1]){
			ret = piece;
		}
	});
	return ret;
};