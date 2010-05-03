/*
 * A Bezier spline segment: with 4 control points
 */
function CubicBezierCurve(new_x1, new_y1, new_x2, new_y2, new_x3, new_y3, new_x4, new_y4)
    {
  this._x1=new_x1; this._y1=new_y1;
  this._x2=new_x2; this._y2=new_y2;
  this._x3=new_x3; this._y3=new_y3;
  this._x4=new_x4; this._y4=new_y4;

  // Accessors
  this.x1 = function() { return this._x1; };
  this.y1 = function() { return this._y1; };
  this.x2 = function() { return this._x2; };
  this.y2 = function() { return this._y2; };
  this.x3 = function() { return this._x3; };
  this.y3 = function() { return this._y3; };
  this.x4 = function() { return this._x4; };
  this.y4 = function() { return this._y4; };

  this._bernstein3 = function(t) {
    var a = (1-t)*(1-t)*(1-t);
    var b = 3*(1-t)*(1-t)*t;
    var c = 3*(1-t)*t*t;
    var d = t*t*t;
    var x = a*this._x1 + b*this._x2 + c*this._x3 + d*this._x4;
    var y = a*this._y1 + b*this._y2 + c*this._y3 + d*this._y4;
    return {x:x,y:y};
  };



  this.draw = function() {
    // Control polygon

    G2D.circle(this._x1, this._y1, 2.0);
    G2D.circle(this._x2, this._y2, 2.0);
    G2D.circle(this._x3, this._y3, 2.0);
    G2D.circle(this._x4, this._y4, 2.0);
    G2D.line(this._x1,this._y1, this._x2,this._y2);
    G2D.line(this._x2,this._y2, this._x3,this._y3);
    G2D.line(this._x3,this._y3, this._x4,this._y4);


    var step=0.05, t=step, p1 = this._bernstein3(0), p2;

    while (t<=1.0+step) {
      p2 = this._bernstein3(t);
      G2D.line(p1.x, p1.y, p2.x,p2.y);
      p1 = p2;
      t+=step;
    }
  };

  this.toString = function() {
    return "CubicBezierCurve { "+this._x1+","+this._y1+" = "+this._x2+","+this._y2+" = "+this._x3+","+this._y3+" = "+this._x4+","+this._y4+"}";
  };
}

