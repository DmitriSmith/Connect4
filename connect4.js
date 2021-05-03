let game_canvas;
let board_context;
let output_area;
let reset_btn;

const num_rows = 6
const num_cols = 7

let unit_height = 0;
let unit_width = 0;

let colors = ['#FFFFFF','#FFFF00', '#FF0000']; // Empty (0) - White, Player 1 - Yellow, Player 2 - Red

const EMPTY_SPACE = 0;

let model = {
	board: [],
	next: 1,
	enable: true,
}

// Taken from: https://stackoverflow.com/questions/18163234/declare-an-empty-two-dimensional-array-in-javascript
function resetModel() {
	model.board = [];
	model.board = new Array(num_cols).fill(0).map(() => new Array(num_rows).fill(EMPTY_SPACE));
	model.next = 1;
	model.enable = true;
}

function tick() {
	window.requestAnimationFrame(render);
}


function render() {
	board_context.clearRect(0,0,game_canvas.width,game_canvas.height)
	board_context.beginPath();
	board_context.rect(0,0,game_canvas.width, game_canvas.height);
	board_context.fillStyle = ('#6699FF');
	board_context.fill();
	
	let circle,x,y,r;
	let s_angle = 0;
	let e_angle = Math.PI * 2;
	
	//Fill each space with a circle, then composite out the space it takes
	
	for(let i=0;i<num_cols;i++) {
		for(let j=0;j<num_rows;j++) {
			board_context.beginPath();
			x = unit_width/2 + i * unit_width;
			y = unit_height/2 + j*unit_height;
			r = Math.min(unit_height,unit_width) * 0.4; 
			//board_context.globalCompositeOperation = 'destination-out';
			
			board_context.arc(x,y,r,s_angle,e_angle);
			// Get the value at the i,j board location and fill it with the corresponding color
			board_context.fillStyle = colors[model.board[i][j]];
			board_context.fill();
		}
	}
	
	let output_txt;
	if (model.enable) {
		writeOutput("Player " + model.next + "'s turn"); 
	} else {
		writeOutput("Player " + model.next + " won!");
	}
	/*
	// Draw lines between the slots
	for(let i = 0;i < num_rows - 1;i++) {
		drawLine(0, unit_height + i * unit_height,game_canvas.width, unit_height + i * unit_height);
		drawLine(unit_width + i * unit_width, 0, unit_width + i * unit_width, game_canvas.height);
	}
	//Add the last missing vertical line
	drawLine(num_rows * unit_width, 0, num_rows * unit_width, game_canvas.height);
    */
	tick();
}

// Looks kinda trashy but I don't have time to write a better one
function writeOutput(txt) {
	output_area.value = txt;
	
}

function drawLine(start_x,start_y,end_x,end_y) {
	board_context.beginPath();
	board_context.moveTo(start_x, start_y);
	board_context.lineTo(end_x, end_y);
	board_context.strokeStyle = 'black';
	board_context.lineWidth = 1;
	board_context.stroke();
}


document.addEventListener("DOMContentLoaded", () => { 
	game_canvas = document.querySelector("#connect4Canvas");
	console.log("Canvas loaded");
	board_context = game_canvas.getContext("2d");
	unit_height = game_canvas.height/num_rows;
	unit_width = game_canvas.width/num_cols;
	resetModel();
	output_area = document.getElementById("outputArea");
	render();
})

/* Check if the given player has won, starting from the upper left diagonal and going around
 * counterclockwise to the upper right diagonal. Originates from the column and row passed into
 * the parameters. Note that a pattern for checking straight up is included only to simplify 
 * the for loop - checking up is pointless with how the code is currently set up
 */

function checkIfWon(player, col, row) {
	next_space_patterns = [
		(col, row) => {return [col-1,row-1]},	// Up and left
		(col, row) => {return [col-1,row  ]},	// Left
		(col, row) => {return [col-1,row+1]},	// Down and left
		(col, row) => {return [col  ,row+1]},	// Down
		(col, row) => {return [col+1,row+1]},	// Down and right
		(col, row) => {return [col+1,row  ]},	// Right
		(col, row) => {return [col+1,row-1]},	// Up and right
		(col, row) => {return [col  ,row-1]}	// Up, checking this is meaningless but having it makes other things easier
	]
	
	for (i=0;i<4;i++) {
		// Need to check both directions simultaneously
		count = checkForWinner(player,[col,row],next_space_patterns[i])+checkForWinner(player,[col,row],next_space_patterns[i+4])-1;
		if (count > 3) {
			return true;
		}
	}
	return false;
}

/* Recursive function to check if the player who just moved has won
 * Args:
 * player - the player to check 
 * pair - coordinate pair of current space to check; format [col,row]
 * next - function to determine next space to check
 *
 * Returns:
 * 0 if off board/wrong player & stops
 * 1 if on board & correct player; continues recursing
 *
 * Stop condition: Off board or wrong player
 */
function checkForWinner(player, pair, next) {
	if (pair[0] < 0 || pair[0] > num_cols - 1) return 0;
	if (pair[1] < 0 || pair[1] > num_rows - 1) return 0;
	if (model.board[pair[0]][pair[1]] != player) return 0;
	return 1 + checkForWinner(player, next(pair[0],pair[1]), next);
}

function checkPlacement(col,row) {
	if (col < 0 || col > num_cols - 1) return false;
	if (row < 0 || row > num_rows - 1) return false;
	if (model.board[col][row] != 0) return false;
	if (row + 1 != num_rows && model.board[col][row + 1] == 0) {
		return false;
	}
	return true;
}

//Note: Can't map this to both x and y because the board is not perfectly square
//      nad doing so causes weird offset issues in the last few columns
function findNearestColumn(x){ return Math.ceil((x)/unit_width - 1)}
function findNearestRow(y)   { return Math.ceil((y)/unit_height -1)}

/* Recursive function to find the bottom-most available slot in a column and return it
 * Note: Should only be called if we know the initial row/column combo is available
 * Args: 
 * col - column to snap in
 * row - lowest available row
 * 
 * Returns: 
 * next row if available
 * current row if not
 *
 * Stop condition:
 * runs off board or next slot already taken
 */
function snapToLowestSlot(col, row) {
	if (col < 0 || col >= num_cols) {return row}
	if (row + 1 == num_rows) {
		return row;
	}
	if (model.board[col][row + 1] != 0) {
		return row;
	}
	return snapToLowestSlot(col, row + 1);
}

document.addEventListener("click", e => {
	if (!model.enable) { return }
	let x = findNearestColumn(e.x);
	let y = findNearestRow(e.y);
	console.log([x,y]);
	// Snap to fill the bottom-most slot in the column
	y = snapToLowestSlot(x,y);
	
	if (checkPlacement(x,y)) {
		model.board[x][y] = model.next;
		if (checkIfWon(model.next,x,y)) {
			model.enable = false;
			console.log("Player " + model.next + " won");
		}
		else if (model.next == 1) {
			model.next = 2
		} else if (model.next == 2) {
			model.next = 1
		}
	}
  
})

document.getElementById("reset_btn").addEventListener("click", e => {
	resetModel();
	console.log("Board reset");
})
