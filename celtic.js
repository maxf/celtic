function CelticEdge() {
  Edge.call(this);
};

// Prototype chain for inheritance
CelticEdge.prototype = new Edge();
CelticEdge.constructor = CelticEdge;
CelticEdge.superclass = Edge.prototype;

CelticEdge.prototype.endPoints = function(n1,n2)
{
  CelticEdge.superclass.endPoints.call(this,n1,n2);

  var n2x=this.dest().x(), n2y=this.dest().y();
  var n1x=this.org().x(), n1y=this.org().y();
  this.angle1=Math.atan2(n2y - n1y, n2x - n1x);
  if (this.angle1 < 0) this.angle1+=TWO_PI;
  this.angle2=Math.atan2(n1y - n2y, n1x - n2x);
  if (this.angle2 < 0) this.angle2+=TWO_PI;
};

CelticEdge.prototype.angle = function(n)
{
  // return the angle of the edge at Node n
  if (n==this.org()) return this.angle1; else return this.angle2;
};

CelticEdge.prototype.other_node = function(n)
{
  if (n==this.org()) return this.dest(); else return this.org();
};

CelticEdge.prototype.angle_to = function(e2, node, direction)
{
  /* returns the absolute angle from this edge to "edge2" around
   "node" following "direction" */
  var a;

  if (direction===CLOCKWISE)
    a=this.angle(node) - e2.angle(node);
  else
    a=e2.angle(node) - this.angle(node);

  if (a<0) return a+2*PI; else return a;
};

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function Params()
{
  var step=0.01; // parameter increment for progressive rendering
  var delay;        /* controls curve drawing speed (step delay in microsecs) */

  var curve_width; //float
  var shape1, shape2; //float
  var margin; //float
  var type; // int. one of Graph.TYPE_*
  var edge_size;
  var cluster_size; /* only used if type is kennicott */
  var nsteps; /* only if triangle: number of subdivisions along the side */
  var nb_orbits;          /* only used if type is polar */
  var nb_nodes_per_orbit; /* only used if type is polar */
  var angle; /* angle of rotation of the graph around the centre */
  var shadow_offset;

  this.getShape1 = function() { return shape1; };
  this.getShape2 = function() { return shape2; };
  this.getStep = function() { return step; };
  this.getDelay = function() { return delay; };
  this.getAngle = function() { return angle; };
  this.setAngle = function(newAngle) { angle=newAngle; };
  this.getShadowOffset = function() { return getShadowOffset; };
  this.setShadowOffset = function(newOffset) { shadow_offset=newOffset; };
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


//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function EdgeCouple(nb_edges)
{
  var size = nb_edges;
  var array = new Array(size);

  // Accessors
  this.getSize = function() { return size;  };
  this.getArray = function() { return array;  };

  // constructor
  for (var i=0;i<size;i++) {
    array[i] = new Array(2);
    array[i][CLOCKWISE] = 0;
    array[i][ANTICLOCKWISE] = 0;
  }
}


//======================================================================

function EdgeDirection (edge,direction)
{
  var e=edge; // Edge
  var d=direction; // int

  this.getEdge = function() { return e; };
  this.setEdge = function(edge) { e = edge; };
  this.getDirection = function() { return d; };
  this.setDirection = function(direction) { d = direction; };
  this.toString = function() { return "EdgeDirection {e: "+e+", d:"+(direction===0?"CLOCKWISE":"ANTICLOCKWISE")+"}"; };
}


//======================================================================






//====================================================================================



// A Pattern is a set of closed curves that form a motif
function Pattern(new_g, new_shape1, new_shape2)
{
  this.splines = [];
  this.shape1=new_shape1;
  this.shape2=new_shape2;
  this.graph=new_g;
  this.ec=new EdgeCouple(new_g.edgeList.length);
  return this;
}

Pattern.prototype = {

  draw: function()
  {
    console.log(this.toString());
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

  edge_couple_set: function(edgeDirection, value)
  {
    for (var i=0;i<graph.edges.length;i++)
      if (graph.edges[i]==edgeDirection.getEdge()) {
        ec.getArray()[i][edgeDirection.getDirection()]=value;
        return;
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

    var x1=(edge1.getNode1().getX()+edge1.getNode2().getX())/2.0;
    var y1=(edge1.getNode1().getY()+edge1.getNode2().getY())/2.0;

    var x4=(edge2.getNode1().getX()+edge2.getNode2().getX())/2.0;
    var y4=(edge2.getNode1().getY()+edge2.getNode2().getY())/2.0;

    var alpha=edge1.angle_to(edge2,node,direction)*shape1;
    var beta=shape2;

    var i1x,i1y,i2x,i2y,x2,y2,x3,y3;

    switch(direction) {
    case ANTICLOCKWISE:
      // (i1x,i2x) must stick out to the left of NP1 and I2 to the right of NP4
      i1x =  alpha*(node.getY()-y1)+x1;
      i1y = -alpha*(node.getX()-x1)+y1;
      i2x = -alpha*(node.getY()-y4)+x4;
      i2y =  alpha*(node.getX()-x4)+y4;
      x2 =  beta*(y1-i1y) + i1x;
      y2 = -beta*(x1-i1x) + i1y;
      x3 = -beta*(y4-i2y) + i2x;
      y3 =  beta*(x4-i2x) + i2y;
      break;
    case CLOCKWISE:
      // I1 must stick out to the left of NP1 and I2 to the right of NP4
      i1x = -alpha*(node.getY()-y1)+x1;
      i1y =  alpha*(node.getX()-x1)+y1;
      i2x =  alpha*(node.getY()-y4)+x4;
      i2y = -alpha*(node.getX()-x4)+y4;
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


  next_unfilled_couple: function()
  {
    var ed=null; //EdgeDirection
    for (var i=0;i<this.ec.length;i++) {
      if (ec[i][CLOCKWISE]==0) {
        ed = new EdgeDirection(graph.edges[i], CLOCKWISE);
        return ed;
      }
      else if (ec[i][ANTICLOCKWISE]==0) {
        ed = new EdgeDirection(graph.edges[i], ANTICLOCKWISE);
        return ed;
      }
    }
    return ed; // possibly null if no edge found
  },

  makeCurves: function()
  {
    var i=0;
    var current_edge, first_edge, next_edge;
    var current_node, first_node;
    var current_direction, first_direction;
    var s; //Spline
    var first_edge_direction, current_edge_direction;

    while ((first_edge_direction=this.next_unfilled_couple())!=null) {
      // start a new loop
      s=new Spline(randomInt(100,255), randomInt(100,255), randomInt(100,255));

      current_edge_direction = new EdgeDirection(first_edge_direction.getEdge(),
                                                 first_edge_direction.getDirection());
      current_node=first_node=current_edge_direction.getEdge().getNode1();

      do {
        this.edge_couple_set(current_edge_direction, 1);
        next_edge = graph.next_edge_around(current_node,current_edge_direction);

        // add the spline segment to the spline
        this.addBezierCurve(s,current_node, current_edge_direction.getEdge(), next_edge, current_edge_direction.getDirection());

        // cross the edge
        current_edge_direction.setEdge(next_edge);
        current_node = next_edge.other_node(current_node);
        current_edge_direction.setDirection(1-current_edge_direction.getDirection());

      } while (current_node!=first_node ||
               current_edge_direction.e!=first_edge_direction.e ||
               current_edge_direction.d!=first_edge_direction.d);
      if (s.getSegments().length>2) // spline is just one point: remove it
        splines.push(s);
    }
    return this;
  }
};

//================================================================================

function Point(new_x, new_y)
{
  var x=new_x, y=new_y;

  //Accessors
  this.getX = function() { return x; };
  this.getY = function() { return y; };

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

function Spline(new_red,new_green,new_blue) {
  var segments = [];
  var _red=new_red;
  var _green=new_green;
  var _blue=new_blue;

//    var cssColorString="rgb("+red+","+green+","+blue+")";
//    print("new Spline: "+cssColorString)
//    g_ctx.strokeStyle=cssColorString;

  // accessors
  this.getSegments = function() { return segments; };
  this.getRed = function() { return _red; };
  this.getGreen = function() { return _green; };
  this.getBlue = function() { return _blue; };

  this.add_segment = function(x1, y1, x2, y2, x3, y3, x4, y4)
  {
    var bezier = new CubicBezierCurve(x1,y1,x2,y2,x3,y3,x4,y4);
//    print("adding: "+bezier);
    segments.push(bezier);
  };

  this.value_at = function(t)
  {
    var si;
    var tt;
    var ss;
    si = Math.floor(t*segments.length);
    if (si==segments.length) si--;
//    print("out: "+si+", "+segments.length+", "+t+"\n");
    tt = t*segments.length - si;
    ss=segments[si];
//    print("ss: "+ss);
    var pi=new PointIndex(ss.getX1()*(1-tt)*(1-tt)*(1-tt)+3*ss.getX2()*tt*(1-tt)*(1-tt)+3*ss.getX3()*tt*tt*(1-tt)+ss.getX4()*tt*tt*tt,
                          ss.getY1()*(1-tt)*(1-tt)*(1-tt)+3*ss.getY2()*tt*(1-tt)*(1-tt)+3*ss.getY3()*tt*tt*(1-tt)+ss.getY4()*tt*tt*tt,
                          si);
//    print(pi);
    return pi;
  };

  this.draw = function() {
    for (var i=0;i<segments.length;i++) {
      var s=segments[i];
      s.draw();
    }
  };

  this.toString = function() {
    return "Spline: { "+segments.length+" segments }";
  };
};

//================================================================================

function CubicBezierCurve(new_x1, new_y1, new_x2, new_y2, new_x3, new_y3, new_x4, new_y4) {
  // A Bezier spline segment: with 4 control points
  var x1,y1,x2,y2,x3,y3,x4,y4;
  x1=new_x1; y1=new_y1;
  x2=new_x2; y2=new_y2;
  x3=new_x3; y3=new_y3;
  x4=new_x4; y4=new_y4;

  // Accessors
  this.getX1 = function() { return x1; };
  this.getY1 = function() { return y1; };
  this.getX2 = function() { return x2; };
  this.getY2 = function() { return y2; };
  this.getX3 = function() { return x3; };
  this.getY3 = function() { return y3; };
  this.getX4 = function() { return x4; };
  this.getY4 = function() { return y4; };


  this.draw = function() {
    circle(x1, y1, 2.0);
    circle(x2, y2, 2.0);
    circle(x3, y3, 2.0);
    circle(x4, y4, 2.0);
    line(x1,y1, x2,y2);
    line(x2,y2, x3,y3);
    line(x3,y3, x4,y4);
  };

  this.toString = function() {
    return "CubicBezierCurve { "+x1+","+y1+" = "+x2+","+y2+" = "+x3+","+y3+" = "+x4+","+y4+"}";

  };
}

//================================================================================

function State()
{
  var showGraph; //Boolean
  var pattern;
  var graph;
  var width, height;
  var delay2;
  var reset;
  var t;
  var graphRotationAngle = randomFloat(0,2*PI);

  var params = new Params();

  this.getStep = function() { return step; };
  this.getPattern = function() { return pattern; };
  this.getGraph = function() { return graph; };
  this.getParams = function() { return params; };
  this.getGraphRotationAngle = function() { return graphRotationAngle; };

  // Constructor
  params.curve_width=randomFloat(4,10);

  //  params.shape1=randomFloat(.5,2);
  //  params.shape2=randomFloat(.5,2);
  params.shape1=.5;
  params.shape2=.5;
  params.edge_size=randomFloat(20,60);
  params.delay=0;
  params.margin=randomFloat(0,100);

//  params.type=randomInt(0,4);
  params.type=Graph.TYPE_CUSTOM;

  switch (params.type) {
    case Graph.TYPE_POLAR:
      params.type=Graph.TYPE_POLAR;
      params.nb_orbits=randomInt(2,11);
      params.nb_nodes_per_orbit=randomInt(4,13);
      graph=new Graph(Graph.TYPE_POLAR,
                         params.margin,
                         params.margin,
                         WIDTH-2*params.margin,
                         HEIGHT-2*params.margin,
                         params.nb_nodes_per_orbit,
                         params.nb_orbits);
      break;
    case Graph.TYPE_TGRID:
      params.type=Graph.TYPE_TGRID;
      params.shape1=-randomFloat(0.3, 1.2);
      params.shape2=-randomFloat(0.3, 1.2);
      params.edge_size=randomFloat(50,90);
      graph=new Graph(params.type,
                         params.margin,
                         params.margin,
                         WIDTH-2*params.margin,
                         HEIGHT-2*params.margin,
                         params.edge_size,
                         0);
      break;
    case Graph.TYPE_KENNICOTT:
      params.type=Graph.TYPE_KENNICOTT;
      params.shape1=randomFloat(-1,1);
      params.shape2=randomFloat(-1,1);
      params.edge_size=randomFloat(70,90);
      params.cluster_size=params.edge_size/randomFloat(3,12)-1;
      graph=new Graph(params.type,
                         params.margin,
                         params.margin,
                         WIDTH-2*params.margin,
                         HEIGHT-2*params.margin,
                         params.edge_size,
                         params.cluster_size);
      break;
    case Graph.TYPE_TRIANGLE:
      params.type=Graph.TYPE_TRIANGLE;
      params.edge_size=randomFloat(60,100);
      params.margin=randomFloat(-900,0);
      graph=new Graph (Graph.TYPE_TRIANGLE,
                          params.margin,
                          params.margin,
                          WIDTH-2*params.margin,
                          HEIGHT-2*params.margin,
                          params.edge_size,
                          0);
      break;
    case Graph.TYPE_CUSTOM:
      params.type=Graph.TYPE_CUSTOM;
      params.nb_orbits=randomInt(2,11);
      params.nb_nodes_per_orbit=randomInt(4,13);
      graph=new Graph(Graph.TYPE_CUSTOM,
                         params.margin,
                         params.margin,
                         WIDTH-2*params.margin,
                         HEIGHT-2*params.margin,
                         params.nb_nodes_per_orbit,
                         params.nb_orbits);
      break;
    default: print("error: graph type out of bounds: "+params.type);
    }

//  graph.rotate(graphRotationAngle,WIDTH/2,HEIGHT/2);
//  print("Graph: "+graph);

  pattern=new Pattern(this, graph, params.shape1, params.shape2);
  pattern.makeCurves();
  t = 0.0;


  //  if (pattern.splines.length==1) {
    colorMode(HSB);
    start=color(randomInt(0,256), 200, 200);
    end=color(randomInt(0,256), 200, 200);
    //  }
  strokeWeight(params.curve_width);
  //  stroke(0,0,0);
  //graph.draw();
  //  print(graph);

};



//===========================================================================

function circle(cx,cy,radius)
{
  g_ctx.lineWidth = 2;
  g_ctx.beginPath();
  g_ctx.arc(cx,cy,radius,0,TWO_PI,false);
  g_ctx.closePath();
  g_ctx.stroke();
}

//===========================================================================

var st;
var s;
var t,t2;
var pi1, pi2, pi3, pi4;
var start, end; // colors

function setup()
{
  st=new State();
//  g_ctx.fillStyle="rgb("+randomInt(0,100)+","+randomInt(0,100)+","+randomInt(0,100)+")";
//  g_ctx.fillRect(0,0,WIDTH,WIDTH);
  st.getGraph().draw();
}

function draw() {
  var c; //color
  var step = st.getParams().getStep();
  var delay = st.getParams().getDelay();
  var splines = st.getPattern().getSplines();
  var intervalId;

  t=0;
  intervalId = setInterval(drawOneStep,delay);

  function drawOneStep() {
    if(t>=1.0) {clearInterval(intervalId);}
    else {
      t2 = (t+step>1.0) ? 1.0 : t+step;
      for (var i=0;i<splines.length;i++) {
        s=splines[i];

        if (s != null) { // skip if one-point spline
          g_ctx.strokeStyle="rgb("+s.getRed()+","+s.getGreen()+","+s.getBlue()+")";
          pi1=s.value_at(t);
          pi2=s.value_at(t2);
          var p1=pi1.getPoint(), p2=pi2.getPoint();
          line(p1.getX(),p1.getY(), p2.getX(),p2.getY());
        }
      }
      t=t2;
    }
  }
}

function print(text)
{
  if (navigator.userAgent.indexOf("Opera")!=-1) opera.postError(text);
  else if (navigator.userAgent.indexOf("Mozilla")!=-1) console.log(text);
}


function main()
{
  setup();
  draw();
}

   /*
g_canvas.addEventListener('click',main,false);
main();
*/
