//MarsRover Project - multiple vehicles version with scene in HTML
//Tomasz Walasek
//November 2019
//
//Features:
//  1. Configurable number of vehicles (1..8)
//  2. Resizable rectangular scene
//  3. Log of commands and positions at the vehicle level
//  4. Central log of events for the whole group of vehicles - deprecated
//  5. Collision types detected
//        - boundaries
//        - obstacles
//        - other vehicles
//  6. Collision handling
//        - animate icon
//        - turn right automatically
 
//Array of rovers (id = 1..8)
let roverTeam = [];

//The central log of all actions
let teamLog = [];

//The scene is a rectangular matrix. Values allowed in each cell:
//0 - free
//9 - obstacle
//1..8 - occupied by the rover N 
let scene = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,9,0,0,0,0,0,0],
    [0,0,0,9,9,0,0,0,0,0],
    [0,0,0,9,9,9,0,0,0,0],
    [0,0,0,9,9,9,9,0,0,0],
    [0,0,0,0,0,9,9,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
];

//Map boundaries
const xMin = 0, xMax = scene.length - 1, yMin = 0, yMax = scene[0].length - 1;

//Add a new rover to the team and place it in an initial position
//Return rover id if successful, otherwise: false

function roverSetup(x, y, dir, color, cmds) {
  if (scene[x][y] != 0) return false;    //collision
  if ("NEWS".indexOf(dir) === -1) return false;   //invalid direction
  newId = roverTeam.length + 1;
  roverTeam.push({id:newId,                   //rover id      
                  x:x, y:y, direction:dir,    //position
                  icon:"",
                  color:color,
                  travelLog:[],               //rover log (array) - will grow
                  commands:cmds.split("")}    //commands (array) - will shrink
                );
  switch (dir) {
    case "N":
      roverTeam[newId-1].icon = "arrow_upward";
      break;
    case "E":
      roverTeam[newId-1].icon = "arrow_forward";
      break;
    case "S":
      roverTeam[newId-1].icon = "arrow_downward";
      break;
    case "W":
      roverTeam[newId-1].icon = "arrow_back";
      break;
    default:  //invalid rover direction. Do nothing
  }
  roverTeam[newId-1].travelLog.push("-");
  roverTeam[newId-1].travelLog.push(`${x},${y},${dir}`);
  teamLog.push(newId);
  teamLog.push("-");
  teamLog.push(`${x},${y},${dir}`);  
  scene[x][y] = newId;
  return newId;
}

//Create HTML table from JS array
function sceneSetup() {
  for (x = 0; x <= xMax; x++) {
    newRow = document.createElement("tr");  
    for (y = 0; y <= yMax; y++) {
      newCell = newRow.insertCell(-1);
      itag = newCell.appendChild(document.createElement("i"));
      itag.className = "material-icons";
      itag.id = `${x}${y}`;
      if (scene[x][y] === 9) itag.innerHTML = "cancel";
      else if (scene[x][y] === 0) itag.innerHTML = "radio_button_unchecked";
      else {
        itag.style.color = roverTeam[scene[x][y]-1].color;
        itag.innerHTML = roverTeam[scene[x][y]-1].icon;  //arrow_downward,  _upward, _forward, _back
      }
    }
    document.getElementById("scene").appendChild(newRow);
  }
}

//Move rover to a position x,y or detect a collision
function moveTo(rover, x, y) {
  
  let col = detectCollision(x,y);
  if (col) {  //Collision. Do not move. Update logs. Animate icon and turn right
    rover.travelLog.push(col);
    rover.travelLog.push("R");  
    teamLog.push(col);
    teamLog.push(rover.id);
    teamLog.push("R");
    document.getElementById(`${rover.x}${rover.y}`).classList.add("shaking-icon");
    setTimeout(turnRight, 1000, rover);
  }
  else {     //Free way. Move vehicle and update logs and the scene
    scene[rover.x][rover.y] = 0;
    document.getElementById(`${rover.x}${rover.y}`).innerHTML = "radio_button_unchecked";
    document.getElementById(`${rover.x}${rover.y}`).style.color = "black";
    document.getElementById(`${rover.x}${rover.y}`).classList.remove("shaking-icon");  
    scene[x][y] = rover.id;
    document.getElementById(`${x}${y}`).innerHTML = rover.icon;   
    document.getElementById(`${x}${y}`).style.color = rover.color;   
    rover.x = x;
    rover.y = y;
    rover.travelLog.push(`${rover.x},${rover.y},${rover.direction}`);
    teamLog.push(`${rover.x},${rover.y},${rover.direction}`);
  }
}

//Collision detection
function detectCollision(x, y) {
  if (x < xMin || x > xMax || y < yMin || y > yMax) 
    return "Boundary!";
  else if (scene[x][y] === 9) 
    return "Obstacle!";
  else if (scene[x][y] != 0) 
    return `Rover ${scene[x][y]} ahead!`;
  else
    return false;
}

//Run all rovers by processing their command strings
//Processing order: round-robin
function runTeam() {
  const rvrCount = roverTeam.length;
  let cmdCount = 0, c ="";
  for (i = 0; i < rvrCount; i++) {
    cmdCount = cmdCount + roverTeam[i].commands.length;
  }
  while (cmdCount > 0) {
    for (i = 0; i < rvrCount; i++) {
      rover = roverTeam[i];
      if (rover.commands.length > 0) {
        c = rover.commands.shift();
        processCommand(rover, c);      
        cmdCount = cmdCount - 1;        
      }
    }
  }
}

//Run all rovers by processing a command for each one
function runCycle() {
  const rvrCount = roverTeam.length;
  let cmdCount = 0, c ="";

  document.getElementById("iterate-btn").style.display = "none";
  setTimeout(function enableButton() {document.getElementById("iterate-btn").style.display = "block"}, 1700);


  for (i = 0; i < rvrCount; i++) {
    cmdCount = cmdCount + roverTeam[i].commands.length;
  }
  if (cmdCount > 0) {
    for (i = 0; i < rvrCount; i++) {
      rover = roverTeam[i];
      if (rover.commands.length > 0) {
        c = rover.commands.shift();
        processCommand(rover, c);      
        cmdCount = cmdCount - 1;        
      }
    }
  }
  else {
    for (j=0; j < roverTeam.length; j++) printRoute(roverTeam[j]);
    printScene("Final Scene");
    window.alert("End of jurney");
  }
}

//Process a single command on a rover
function processCommand(rover, c) {
  rover.travelLog.push(c);    
  teamLog.push(rover.id);
  teamLog.push(c);
  switch (c) {
    case "l":
      turnLeft(rover);
      break;
    case "r":
      turnRight(rover);
      break;
    case "f":
      moveForward(rover);
      break;
    case "b":
      moveBackward(rover);
      break;
    default: 
      rover.travelLog.push("Invalid cmd!");   
      //teamLog.push(rover.id);
      //teamLog.push(c);
      break;
  } 
}

// Turning left and right
function turnLeft(rover) {
  switch (rover.direction) {
    case "N":
      rover.direction = "W";
      rover.icon = "arrow_back";
      break;
    case "E":
      rover.direction = "N";
      rover.icon = "arrow_upward";
      break;
    case "S":
      rover.direction = "E";
      rover.icon = "arrow_forward";
      break;
    case "W":
      rover.direction = "S";
      rover.icon = "arrow_downward";
      break;
    default:  //invalid rover direction. Do nothing
  }
  rover.travelLog.push(`${rover.x},${rover.y},${rover.direction}`);
  teamLog.push(`${rover.x},${rover.y},${rover.direction}`);
  document.getElementById(`${rover.x}${rover.y}`).innerHTML = rover.icon;   
}

function turnRight(rover) {
  switch (rover.direction) {
    case "N":
      rover.direction = "E";
      rover.icon = "arrow_forward";
      break;
    case "E":
      rover.direction = "S";
      rover.icon = "arrow_downward";
      break;
    case "S":
      rover.direction = "W";
      rover.icon = "arrow_back";
      break;
    case "W":
      rover.direction = "N";
      rover.icon = "arrow_upward";
      break;
    default:  //invalid rover direction. Do nothing
  }
  rover.travelLog.push(`${rover.x},${rover.y},${rover.direction}`);
  teamLog.push(`${rover.x},${rover.y},${rover.direction}`);
  document.getElementById(`${rover.x}${rover.y}`).innerHTML = rover.icon;   
  document.getElementById(`${rover.x}${rover.y}`).classList.remove("shaking-icon");  
}

// Moving forward and backward
function moveForward(rover) {
  let newX = rover.x;
  let newY = rover.y;
  switch (rover.direction) {
    case "N":
      newX = rover.x - 1;
      break;
    case "E":
      newY = rover.y + 1;
      break;
    case "S":
      newX = rover.x + 1;
      break;
    case "W":
      newY = rover.y - 1;
      break;
    default:  //invalid rover direction. Do nothing
  }
  moveTo (rover, newX, newY);
}

function moveBackward(rover) {
  let newX = rover.x;
  let newY = rover.y;
  switch (rover.direction) {
    case "N":
      newX = rover.x + 1;
      break;
    case "E":
      newY = rover.y - 1;
      break;
    case "S":
      newX = rover.x - 1;
      break;
    case "W":
      newY = rover.y + 1;
      break;
    default:  
  } //invalid rover direction. Do nothing
  moveTo (rover, newX, newY);
}

function printScene(header) {
  let str = "", len = scene.length;
  console.log(header);
  for (i = 0; i < len; i++)
    str = str + scene[i] + "\n ";
  console.log(str);
}

function printRoute(rover) {
  let str = "", len = rover.travelLog.length;
  console.log(`Rover ${rover.id} route:`);
  for (i = 0; i < len; i += 2)
    str = str + rover.travelLog[i] + ": " + rover.travelLog[i+1] + "\n ";
  console.log(str);
}

function printLog(header) {
  let len = teamLog.length , str = "";
  console.log(header);
  for (i = 0; i < len; i += 3)
    str = str + teamLog[i] + ": " + teamLog[i+1] + ": " + teamLog[i+2] + "\n ";
  console.log(str);
}

//************** TEST *******************

//Set up vehicles and scenes
roverSetup(0, 0, "S", "red", "ffffffff");
roverSetup(0, 1, "S", "green", "fffffffffffffffffff");
roverSetup(0, 2, "S", "blue", "fffffffffffffffff");
roverSetup(0, 3, "S", "brown", "fffffffff");
roverSetup(0, 4, "S", "magenta", "fffffffffffffffff");
roverSetup(0, 5, "S", "cyan", "fffffffffffffffff");
roverSetup(0, 6, "S", "orange", "fffffffffffffffff");
sceneSetup();
printScene("Initial Scene");

//Start
//runTeam();

