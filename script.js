const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;
// canvas settings
var viewWidth = 768,
  viewHeight = 768,
  viewCenterX = viewWidth * 0.5,
  viewCenterY = viewHeight * 0.5,
  drawingCanvas = document.getElementById("canvas"),
  ctx,
  timeStep = (1 / 60),
  time = 0;

var ppm = 24, // pixels per meter
  physicsWidth = viewWidth / ppm,
  physicsHeight = viewHeight / ppm,
  physicsCenterX = physicsWidth * 0.5,
  physicsCenterY = physicsHeight * 0.5;

var world;

var wheel,
  arrow,
  blocker,
  mouseBody,
  mouseConstraint;

var arrowMaterial,
  pinMaterial,
  contactMaterial;

var wheelSpinning = false,
  wheelStopped = true;

var particles = [];

var statusLabel = document.getElementById('status_label');

window.onload = function() {
  initDrawingCanvas();
  initPhysics();

  requestAnimationFrame(loop);

  statusLabel.innerHTML = 'Give it a good spin!';
};

function initDrawingCanvas() {
  drawingCanvas.width = viewWidth;
  drawingCanvas.height = viewHeight;
  ctx = drawingCanvas.getContext('2d');

  drawingCanvas.addEventListener('mousemove', updateMouseBodyPosition);
  drawingCanvas.addEventListener('mousedown', checkStartDrag);
  drawingCanvas.addEventListener('mouseup', checkEndDrag);
  drawingCanvas.addEventListener('mouseout', checkEndDrag);

  drawingCanvas.addEventListener('touchmove', updateMouseBodyPosition);
  drawingCanvas.addEventListener('touchstart', checkStartDrag);
  drawingCanvas.addEventListener('touchend', checkEndDrag);
  drawingCanvas.addEventListener('touchleave', checkEndDrag);
}

function updateMouseBodyPosition(e) {
  var p = getPhysicsCoord(e);
  mouseBody.position[0] = p.x;
  mouseBody.position[1] = p.y;
}

function checkStartDrag(e) {
  if (world.hitTest(mouseBody.position, [wheel.body])[0]) {

    mouseConstraint = new p2.RevoluteConstraint(mouseBody, wheel.body, {
      worldPivot: mouseBody.position,
      collideConnected: false
    });

    world.addConstraint(mouseConstraint);
  }

  if (wheelSpinning === true) {
    wheelSpinning = false;
    wheelStopped = true;
    statusLabel.innerHTML = "Impatience will not be rewarded.";
  }
}

function checkEndDrag(e) {
  if (mouseConstraint) {
    world.removeConstraint(mouseConstraint);
    mouseConstraint = null;

    if (wheelSpinning === false && wheelStopped === true) {
      if (Math.abs(wheel.body.angularVelocity) > 7.5) {
        wheelSpinning = true;
        wheelStopped = false;
        console.log('good spin');
        statusLabel.innerHTML = '...clack clack clack clack clack clack...'
      } else {
        console.log('sissy');
        statusLabel.innerHTML = 'Come on, you can spin harder than that.'
      }
    }
  }
}

function getPhysicsCoord(e) {
  var rect = drawingCanvas.getBoundingClientRect(),
    x = (e.clientX - rect.left) / ppm,
    y = physicsHeight - (e.clientY - rect.top) / ppm;

  return {
    x: x,
    y: y
  };
}

function initPhysics() {
  world = new p2.World();
  world.solver.iterations = 100;
  world.solver.tolerance = 0;

  arrowMaterial = new p2.Material();
  pinMaterial = new p2.Material();
  contactMaterial = new p2.ContactMaterial(arrowMaterial, pinMaterial, {
    friction: 0.0,
    restitution: 0.1
  });
  world.addContactMaterial(contactMaterial);

  var wheelRadius = 8,
    wheelX = physicsCenterX,
    wheelY = wheelRadius + 4,
    arrowX = wheelX,
    arrowY = wheelY + wheelRadius + 0.625;

  wheel = new Wheel(wheelX, wheelY, wheelRadius, 32, 0.25, 7.5);
  wheel.body.angle = (Math.PI / 32.5);
  wheel.body.angularVelocity = 0;
  arrow = new Arrow(arrowX, arrowY, 0.5, 1.5);
  mouseBody = new p2.Body();

  world.addBody(mouseBody);

}

function spawnPartices() {
  for (var i = 0; i < 200; i++) {
    var p0 = new Point(viewCenterX, viewCenterY - 64);
    var p1 = new Point(viewCenterX, 0);
    var p2 = new Point(Math.random() * viewWidth, Math.random() * viewCenterY);
    var p3 = new Point(Math.random() * viewWidth, viewHeight + 64);

    particles.push(new Particle(p0, p1, p2, p3));
  }
}

function update() {
  particles.forEach(function(p) {
    p.update();
    if (p.complete) {
      particles.splice(particles.indexOf(p), 1);
    }
  });

  // p2 does not support continuous collision detection :(
  // but stepping twice seems to help
  // considering there are only a few bodies, this is ok for now.
  world.step(timeStep * 0.5);
  world.step(timeStep * 0.5);

  if (wheelSpinning === true && wheelStopped === false &&
    wheel.body.angularVelocity < 1 && arrow.hasStopped()) {

    var win = wheel.gotLucky();

    wheelStopped = true;
    wheelSpinning = false;

    wheel.body.angularVelocity = 0;

    if (win) {
      spawnPartices();
      statusLabel.innerHTML = 'Woop woop!'
    } else {
      statusLabel.innerHTML = 'Too bad! Invite a Facebook friend to try again!';
    }
  }
}

function draw() {
  // ctx.fillStyle = '#fff';
  ctx.clearRect(0, 0, viewWidth, viewHeight);

  wheel.draw();
  arrow.draw();

  particles.forEach(function(p) {
    p.draw();
  });
}

function loop() {
  update();
  draw();

  requestAnimationFrame(loop);
}