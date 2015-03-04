window.onload = function() {
  initSegments();
  initDrawingCanvas();
  initPhysics();
  initNavigation();
  requestAnimationFrame(loop);

  var menuButton = document.getElementById("menu_button");

  menuButton.addEventListener('click', function(evt) {
    document.getElementById('menu').classList.toggle('active');
  });
};

function initNavigation() {
  
}

function initSegments() {
  segments = [];
  for (var i = 0; i < 3; i++) {
    for (var planet of planets) {
      segments.push({
        label: planet.shortName,
        color: planet.color
      })
    }
  }
}

function initPhysics() {
  world = new p2.World();
  world.solver.iterations = 100;
  world.solver.tolerance = 0;

  var wheelRadius = 8,
    wheelX = physicsCenterX,
    wheelY = wheelRadius + 4,
    arrowX = wheelX + wheelRadius + 1.3,
    arrowY = wheelY;

  wheel = new Wheel(wheelX, wheelY, wheelRadius, segments, 0.25, 7.5);
  wheel.body.angle = 0;
  wheel.body.angularVelocity = 0;
  wheel.initAssets();
  arrow = new Arrow(arrowX, arrowY, 1.5, 0.5);
  mouseBody = new p2.Body();

  world.addBody(mouseBody);
}

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
    wheel.sound.pause();
  }
}

function checkEndDrag(e) {
  if (mouseConstraint) {
    world.removeConstraint(mouseConstraint);
    mouseConstraint = null;

    if (wheelSpinning === false && wheelStopped === true) {

      if (Math.abs(wheel.body.angularVelocity) > 5) {

        //adapt angularVelocity to tend toward 16
        var targetSpeed = 16;

        targetSpeed = wheel.body.angularVelocity > 0 ? targetSpeed : -targetSpeed;
        var velocity = wheel.body.angularVelocity;
        var diff = targetSpeed - velocity;
        wheel.body.angularVelocity = velocity + diff / 1.5;
        console.log('initial velocity : ' + velocity + ' adapted to ' + wheel.body.angularVelocity);

        wheelSpinning = true;
        wheelStopped = false;
        statusLabel.innerHTML = '...clack clack clack clack clack clack...';
        wheel.sound.currentTime = 0;
        wheel.sound.play();
      } else {
        statusLabel.innerHTML = 'Come on, you can spin harder than that.'
        wheel.sound.pause();
      }
    }
  }
}

function getPhysicsCoord(e) {
  var rect = drawingCanvas.getBoundingClientRect(),
    clientX = e.clientX || e.touches[0].clientX,
    clientY = e.clientY || e.touches[0].clientY,
    x = (clientX - rect.left) / ppm,
    y = physicsHeight - (clientY - rect.top) / ppm;

  return {
    x: x,
    y: y
  };
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


  //world.step(timeStep * 0.5);
  world.step(timeStep * 0.5);

  if (wheelSpinning === true && wheelStopped === false && Math.abs(wheel.body.angularVelocity) < 0.05) {

    var win = wheel.getScore();
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