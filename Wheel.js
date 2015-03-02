/////////////////////////////
// wheel of fortune
/////////////////////////////
function Wheel(x, y, radius, segments) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.segments = segments;

  this.pX = this.x * ppm;
  this.pY = (physicsHeight - this.y) * ppm;
  this.pRadius = this.radius * ppm;

  this.deltaPI = TWO_PI / this.segments;

  this.createBody();
}
Wheel.prototype = {
  createBody: function() {
    this.body = new p2.Body({
      mass: 1,
      position: [this.x, this.y]
    });
    this.body.angularDamping = 0.05;
    this.body.addShape(new p2.Circle(this.radius));
    this.body.shapes[0].sensor = true; //TODO use collision bits instead

    var axis = new p2.Body({
      position: [this.x, this.y]
    });
    var constraint = new p2.LockConstraint(this.body, axis);
    constraint.collideConnected = false;

    world.addBody(this.body);
    world.addBody(axis);
    world.addConstraint(constraint);
  },
  gotLucky: function() {
    var currentRotation = wheel.body.angle % TWO_PI,
      currentSegment = Math.floor(currentRotation / this.deltaPI);

    return (currentSegment % 2 === 0);
  },
  draw: function() {
    // TODO this should be cached in a canvas, and drawn as an image
    // also, more doodads
    ctx.save();
    ctx.translate(this.pX, this.pY);

    ctx.beginPath();
    ctx.fillStyle = '#DB9E36';
    ctx.arc(0, 0, this.pRadius + 24, 0, TWO_PI);
    ctx.fill();

    ctx.rotate(-this.body.angle);

    for (var i = 0; i < this.segments; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#BD4932' : '#FFFAD5';
      ctx.beginPath();
      ctx.arc(0, 0, this.pRadius, i * this.deltaPI, (i + 1) * this.deltaPI);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#401911';

    ctx.restore();
  }
};