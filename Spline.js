
/*
 * A spline of bezier segments
 */
function Spline(red,green,blue) {
  this._segments = [];
  this._red=red;
  this._green=green;
  this._blue=blue;

//    var cssColorString="rgb("+red+","+green+","+blue+")";
//    print("new Spline: "+cssColorString)
//    g_ctx.strokeStyle=cssColorString;

  // accessors
  this.segments = function() { return this._segments; };
  this.red = function() { return this._red; };
  this.green = function() { return this._green; };
  this.blue = function() { return this._blue; };

  this.add_segment = function(x1, y1, x2, y2, x3, y3, x4, y4)
  {
    var bezier = new CubicBezierCurve(x1,y1,x2,y2,x3,y3,x4,y4);
//    print("adding: "+bezier);
    this._segments.push(bezier);
  };

  this.value_at = function(t)
  {
    var si = Math.floor(t*this._segments.length);
    var tt;
    var ss;
    if (si==this._segments.length) si--;
//    print("out: "+si+", "+segments.length+", "+t+"\n");
    tt = t*this._segments.length - si;
    ss=this._segments[si];
//    print("ss: "+ss);
    var pi=new PointIndex(ss.x1()*(1-tt)*(1-tt)*(1-tt)+3*ss.x2()*tt*(1-tt)*(1-tt)+3*ss.x3()*tt*tt*(1-tt)+ss.x4()*tt*tt*tt,
                          ss.y1()*(1-tt)*(1-tt)*(1-tt)+3*ss.y2()*tt*(1-tt)*(1-tt)+3*ss.y3()*tt*tt*(1-tt)+ss.y4()*tt*tt*tt,
                          si);
//    print(pi);
    return pi;
  };

  this.draw = function() {
    for (var i=0;i<this._segments.length;i++) {
      var s=this._segments[i];
      s.draw();
    }
  };

  this.toString = function() {
    return "Spline: { "+this._segments.length+" segments }";
  };
};

