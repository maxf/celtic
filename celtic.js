function CelticEdge() {
  Edge.call(this);
  this.leftCurveIsComputed = false; // The curve starting from the left side of this edge hasn't been computed yet
  this.rightCurveIsComputed = false;  // The curve starting from the right side of this edge hasn't been computed yet
};

// Prototype chain for inheritance
CelticEdge.prototype = new Edge();
CelticEdge.constructor = CelticEdge;
CelticEdge.superclass = Edge.prototype;

CelticEdge.prototype.endPoints = function(n1,n2)
{
  CelticEdge.superclass.endPoints.call(this,n1,n2);
};

CelticEdge.prototype.other_node = function(n)
{
  if (n==this.org()) return this.dest(); else return this.org();
};


//================================================================================

const CLOCKWISE=0;
const ANTICLOCKWISE=1;
const SQRT_3 = 1.73205080756887729352;
const PI = Math.PI;
const TWO_PI = 2*PI;

//================================================================================

const RGB = 0;
const HSB = 1;
var _colorMode = RGB; // one of RGB or HSB
var r = 0;
var g = 0;
var b = 0;

// return a number in [min, max[
// <http://processing.org/reference/random_.html>
function randomFloat(min,max)
{
  return Math.random()*(max-min) + min;
};

function randomInt(min,max)
{
  return Math.floor(Math.random()*(max-min) + min) | 0;
};

function colorMode(mode)
{
  _colorMode=mode;
};

function color(a,b,c)
{
  switch(this._colorMode) {
    case this.RGB: this.r=a; this.g=b; this.b=c; break;
  }
};

// <http://processing.org/reference/strokeWeight_.html>
function strokeWeight(weight)
{
  g_ctx.lineWidth = weight;
};

// <http://processing.org/reference/line_.html>
function line(x1,y1, x2,y2)
{
//  g_ctx.strokeStyle="rgb("+randomInt(0,255)+","+randomInt(0,255)+","+randomInt(0,255)+")";
//  print("tracing line from ("+x1+","+y1+" to ("+x2+","+y2+")");
  g_ctx.beginPath();
  g_ctx.moveTo(x1,y1);
  g_ctx.lineTo(x2,y2);
  g_ctx.closePath();
  g_ctx.stroke();
}


//======================================================================

/* Class Pattern
 * A set of closed curves that form a motif
 *
 * Parameters:
 * subdivision: a Subdivision to base the motif on
 * shape1, shape2: 2 numbers that control the form of the curves
 */
function Pattern(subdivision, shape1, shape2)
{
  this.splines = [];
  this.shape1=shape1;
  this.shape2=shape2;
  this.graph=subdivision;
  return this;
}

Pattern.prototype = {

  draw: function()
  {
    print(this.toString());
  },

  getSplines: function()
  {
    return splines;
  },

  toString: function()
  {
    var result="Pattern: { splines: [";
    for (var i=0;i<this.splines.length;i++) {
      result+=this.splines[i]+", ";
    }
    return result+"]}";
  },

  draw: function()
  {
    for (var i=0;i<this.splines.length;i++) {
      this.splines[i].draw();
    }
  },


  /*
   *  Add a cubic Bezier curve segment to a spline (s)
   */
  addBezierCurve: function(s, node, edge1, edge2, direction)
  {
    // Parameters:
    // - s: the spline to add the Bezier to
    // - node: a node
    // - edge1: an edge which must include 'node' as one of its nodes
    // - edge2: ditto
    // - direction: whether the bezier should go clockwise or anticlockwise around the node
    //
    //   *-----------------*--------------*
    //         edge1      node   edge2


    // The 4 control points are:
    // (x1,y1) the midpoint of edge1
    // (x2,y2) a complicated function of the pattern's shape parameters, the direction, and the angle between edge1 and edge2
    // (x3,y3) ditto.
    // (x4,y4) the midpoint of edge2

//    print("addBezierCurve(s :"+s+", node: "+node+", edge1: "+edge1+", edge2: "+edge2+", direction: "+direction);

    var x1=(edge1.org().x()+edge1.dest().x())/2.0;
    var y1=(edge1.org().y()+edge1.dest().y())/2.0;

    var x4=(edge2.org().x()+edge2.dest().x())/2.0;
    var y4=(edge2.org().y()+edge2.dest().y())/2.0;

    // angle formed by the edges: acos(scalar_product(edge1, edge2))
    var e1x = edge1.dest().x() - edge1.org().x();
    var e1y = edge1.dest().y() - edge1.org().y();
    var e1m = Math.sqrt(e1x*e1x+e1y*e1y);
    e1x/=e1m;
    e1y/=e1m;

    var e2x = edge2.dest().x() - edge2.org().x();
    var e2y = edge2.dest().y() - edge2.org().y();
    var e2m = Math.sqrt(e2x*e2x+e2y*e2y);
    e2x/=e2m;
    e2y/=e2m;

    var angle = Math.acos(e1x*e2x + e1y*e2y);

    print(angle);

    var alpha=angle*this.shape1;
    var beta=this.shape2;

    var i1x,i1y,i2x,i2y,x2,y2,x3,y3;

    switch(direction) {
    case ANTICLOCKWISE:
      // (i1x,i2x) must stick out to the left of NP1 and I2 to the right of NP4
      i1x =  alpha*(node.y()-y1)+x1;
      i1y = -alpha*(node.x()-x1)+y1;
      i2x = -alpha*(node.y()-y4)+x4;
      i2y =  alpha*(node.x()-x4)+y4;
      x2 =  beta*(y1-i1y) + i1x;
      y2 = -beta*(x1-i1x) + i1y;
      x3 = -beta*(y4-i2y) + i2x;
      y3 =  beta*(x4-i2x) + i2y;
      break;
    case CLOCKWISE:
      // I1 must stick out to the left of NP1 and I2 to the right of NP4
      i1x = -alpha*(node.y()-y1)+x1;
      i1y =  alpha*(node.x()-x1)+y1;
      i2x =  alpha*(node.y()-y4)+x4;
      i2y = -alpha*(node.x()-x4)+y4;
      x2 = -beta*(y1-i1y) + i1x;
      y2 =  beta*(x1-i1x) + i1y;
      x3 =  beta*(y4-i2y) + i2x;
      y3 = -beta*(x4-i2x) + i2y;
      break;
    default:
      print("Error in addBezierCurve: direction is neither CLOCKWISE nor ANTICLOCKWISE: "+direction);
    }
//    print("adding Bezier ("+x1+","+y1+" -- "+x2+","+y2+" -- "+x3+","+y3+" -- "+x4+","+y4+")");
    s.add_segment(x1,y1,x2,y2,x3,y3,x4,y4);
  },


  /*
   * Find a curve that hasn't been computed yet: go through each edge and check if its left and right curves have been done yet.
   * returns an object {edge: Edge, direction: int}
   */
  nextCurveToCompute: function()
  {
    var edges = this.graph.edgeList;
    for (var i=edges.length-1; i>=0; i--) {
      if (!edges[i].leftCurveIsComputed) return {edge: edges[i], direction: ANTICLOCKWISE};
      if (!edges[i].rightCurveIsComputed) return {edge: edges[i], direction: CLOCKWISE};
    }
    return null; // all the curves have been comnputed.
  },

  makeCurves: function()
  {
    var i=0;
    var current_edge, first_edge, next_edge;
    var current_node, first_node;
    var current_direction, first_direction;
    var s; //Spline
    var firstCurveOrigin;

    while ((firstCurveOrigin=this.nextCurveToCompute())!=null) {
      first_edge = firstCurveOrigin.edge;
      first_direction = firstCurveOrigin.direction;

      // start a new loop
      s=new Spline(randomInt(100,255), randomInt(100,255), randomInt(100,255));

      current_edge = first_edge;
      current_direction = first_direction;
      current_node=first_node=current_edge.org();

      do {

        // add a new segment (cubic Bezier) to the loop
        // a segment is defined by current_node, current_edge, next_edge, current_direction
        //                     ^         _____segment_____
        //  current_direction  |        /                 \
        //                     |       /                   \
        //                +----current_edge------+-----------next_edge--------+
        //                                    current_node


        if (current_direction == ANTICLOCKWISE) {
          current_edge.leftCurveIsComputed = true;
        } else {
          current_edge.rightCurveIsComputed = true;
        }

        next_edge = this.graph.nextEdgeAround(current_node,current_edge,current_direction);

        // add the spline segment to the spline
        this.addBezierCurve(s,current_node, current_edge, next_edge, current_direction);

        // cross the edge
        current_edge = next_edge;
        current_node = next_edge.other_node(current_node);
        current_direction = 1-current_direction;

      } while (current_node!=first_node ||
               current_edge != first_edge ||
               current_direction != first_direction); // until we're back at the start
      if (s.segments().length>2) // spline is just one point: remove it
        this.splines.push(s);
    }
    return this;
  }
};

//================================================================================

function Point(new_x, new_y)
{
  var x=new_x, y=new_y;

  //Accessors
  this.x = function() { return x; };
  this.y = function() { return y; };

  this.toString = function() { return "Point: {x="+x+", y="+y+"}";};
}

//================================================================================

function PointIndex(new_x,new_y,new_i) {
  // Typically one point of a spline and the segment index of the spline that
  // the point is on


  var x=new_x, y=new_y, i=new_i;
  var p=new Point(x,y);

  this.getPoint = function() { return p; };
  this.toString = function() { return "PointIndex {point: "+p+", index: "+i+"}"; };
}

//================================================================================

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

//================================================================================

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

    /*
    G2D.circle(this._x1, this._y1, 2.0);
    G2D.circle(this._x2, this._y2, 2.0);
    G2D.circle(this._x3, this._y3, 2.0);
    G2D.circle(this._x4, this._y4, 2.0);
    G2D.line(this._x1,this._y1, this._x2,this._y2);
    G2D.line(this._x2,this._y2, this._x3,this._y3);
    G2D.line(this._x3,this._y3, this._x4,this._y4);
     */

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

//===========================================================================


function print(text)
{
  if (navigator.userAgent.indexOf("Opera")!=-1) opera.postError(text);
  else if (navigator.userAgent.indexOf("Mozilla")!=-1) console.log(text);
}
