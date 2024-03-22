/// <reference lib="webworker" />

class Position {
  constructor(public x: number, public y: number) { }
}

function calcAngle(cx, cy, ex, ey) {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
}

function calculateNextPoints(position: Position, offsets: Position[], width: number, height: number,) {
  const rand = Math.floor(Math.random() * offsets.length);
  const possibleX = position.x + offsets[rand].x;
  const possibleY = position.y + offsets[rand].y;
  const overEdgeX = possibleX == -1 || possibleX == width;
  const overEdgeY = possibleY == -1 || possibleY == height;
  const newX = overEdgeX ? position.x : possibleX;
  const newY = overEdgeY ? position.y : possibleY;

  const angle = calcAngle(newX, newY, position.x, position.y);
  return { newX, newY, angle };
}

addEventListener('message', ({ data }) => {
  const { position, offsets, width, height } = data;
  const calculatedPoints = calculateNextPoints(position, offsets, width, height);
  postMessage(calculatedPoints);
});




// self.onmessage = function (event) {
//   const { position, offsets, width, height } = event.data;
//   const calculatedPoints = calculateNextPoints(position, offsets, width, height);
//   self.postMessage(calculatedPoints);
// };

