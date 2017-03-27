var game;
var echo = new EchoCanvas("echo", 400, 400);
var squares = {};

var v = "abcdefgh";
var black = true;
var x=0, y=0;
for(var i=0; i<v.length; i++){
	for(var n=8; n>0; n--){
		var id = v[i]+n;
		var color = black ? "#000000" : "#FFFFFF";
		squares[id] = new EchoRectObject(id, 50, 50, color, color, 1, x, y);
		echo.addObject(squares[id]);
		black = !black;
		y+=50;
	};
	black = !black;
	y=0;
	x+=50;
};

var sprites = new EchoSpritesheet("imgs/pieces.png");
var pieces = {White:{}, Black:{}}, x=0, y=0;
var color = "White";
var piece_types = ["King","Queen","Bishop","Knight","Castle","Pawn"];
function makeSprite(color, name, type, x, y, cls){
	sprites.makeSprite(name, x, y, 65, 65);
	pieces[color][type]={object: sprites.sprites[name]};
	pieces[color][type].class = cls;
	pieces[color][type].object.width = 50;
	pieces[color][type].object.height = 50;
	pieces[color][type].posit = ['a', 8];
	pieces[color][type].color = color;
	echo.addObject(pieces[color][type].object);
}
sprites.onload(function(){
	for(var n=0; n<2; n++){
		for(var i=0; i<6; i++){
			var name = color+" "+piece_types[i];						
			switch(piece_types[i]){
				case "King": case "Queen":
					makeSprite(color, name, piece_types[i], x, y, piece_types[i]);
					break;
				case "Bishop": case "Knight": case "Castle":
					makeSprite(color, name+" 1", piece_types[i]+" 1", x, y, piece_types[i]);
					makeSprite(color, name+" 2", piece_types[i]+" 2", x, y, piece_types[i]);
					break;
				case "Pawn":
					for(var xx=1; xx<=8; xx++)
						makeSprite(color, name+" "+xx, piece_types[i]+" "+xx, x, y, piece_types[i]);
					break;
			}
			x += 65;
		}
		color = "Black";
		y+=65; x=0;
	}
	game = new ChessGame(pieces);
	game.resetBoard();
	echo.render();
});	

$("#terminal").Terminal({
	hostname: " ",
	username: " ",
	io: function(input, output, d){
		var c = window.console.log;
		window.console.log = output;
		var done = function(){
			window.console.log = c;
			d();
		};
		input = input.trim().toLowerCase().split(" ");
		switch(input[0]){
			case "help":
				output("\nConsole Chess is a simple chess game that uses a console interface to interact with a chess board. You are the black pieces, the white pieces are AI. The goal is to beat the computer by taking it's king. To use the console interface, simply type the command and press enter.\n\nTo pick up a piece, use the pickup command, and pass it the column and row of the pice to pick up, like this:\n $ pickup b2\n\nTo move a piece, first,  pick up a piece using the pickup command, then use the move command to tell it where to move, like this:\n $ move a5\n");
				done();
				break;
			case "pickup":
				if(game.winner){
					output("Game is over. Use reload command to star over.");
					done();
					return;
				}
				var p=input[1].split('');
				p[1]=parseInt(p[1]);
				game.pickUp(p);
				setTimeout(done, 1000);
				break;
			case "move":
				if(game.winner){
					output("Game is over. Use reload command to star over.");
					done();
					return;
				}
				var turn = game.turn;
				var p=input[1].split('');
				p[1]=parseInt(p[1]);
				game.move(p);
				setTimeout(function(){
					if(game.turn !== turn && !game.winner){
						output("White player's turn...");
						game.autoMove();
						setTimeout(done, 1000);
					}else done();
				}, 1000);
				break;
			case "reload":
				location.reload();
				break;
			case "automove":
				game.autoMove();
				setTimeout(function(){
					if(game.turn !== turn && !game.winner){
						output("White player's turn...");
						game.autoMove();
						setTimeout(done, 1000);
					}else done();
				}, 1000);
				break;
			case "autoplay":
				game.autoPlay();
				break;
			default:
				output("Invalid command");
				done();
		}
	}
});