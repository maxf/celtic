var G2D = window.G2D || {};

G2D.init = function(ctx,width, height)
{
  this.ctx = ctx;
  this.width=width;
  this.height=width;
  this.ctx.strokeStyle = "rgb(100,100,100)";
};

G2D.circle = function(cx,cy,radius)
{
  var originalWidth = this.ctx.lineWidth;
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.arc(cx,cy,radius,0,Math.TWO_PI,false);
  this.ctx.closePath();
  this.ctx.stroke();
  this.ctx.lineWidth = originalWidth;
};


G2D.line = function(x1,y1, x2,y2)
{
  this.ctx.beginPath();
  this.ctx.moveTo(x1,y1);
  this.ctx.lineTo(x2,y2);
  this.ctx.closePath();
  this.ctx.stroke();
};

G2D.clear = function(r,g,b) {
  this.ctx.fillStyle="rgb("+r+","+g+","+g+")";
  this.ctx.fillRect(0,0,this.width,this.height);
};