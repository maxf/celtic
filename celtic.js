(function() {


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

/*
var g_canvas = document.getElementById("canvas");
var g_ctx;
if (g_canvas) {
  g_ctx = g_canvas.getContext("2d");
  g_ctx.lineJoin="round";
  g_ctx.lineCap="round";

  // @@TODO: connect to Parameters
  g_ctx.shadowColor="rgba(0,0,0,.5)";
  g_ctx.shadowOffsetX=5;
  g_ctx.shadowOffsetY=5;
  g_ctx.shadowBlur=3;
}
else
  return;
*/
const WIDTH=document.getElementById("canvas").width;
const HEIGHT=document.getElementById("canvas").height;
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

function Edge(n1,n2) {
  var node1 = n1;
  var node2 = n2;

  var angle1=Math.atan2(n2.getY() - n1.getY(), n2.getX() - n1.getX());
  if (angle1 < 0) angle1+=TWO_PI;
  var angle2=Math.atan2(n1.getY() - n2.getY(), n1.getX() - n2.getX());
  if (angle2 < 0) angle2+=TWO_PI;

  // Accessors
  this.getNode1 = function() { return node1; };
  this.getNode2 = function() { return node2; };

  this.draw = function()
  {
    line(node1.getX(),node1.getY(), node2.getX(),node2.getY());
  };

  this.toString = function()
  {
    return "Edge: {node1: "+node1+", node2: "+node2+"}";
  };

  this.angle = function(n)
  {
    // return the angle of the edge at Node n
    if (n==node1) return angle1; else return angle2;
  };

  this.other_node = function(n)
  {
    if (n==node1) return node2; else return node1;
  };

  this.angle_to = function(e2, node, direction)
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


};


//======================================================================

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


function Graph(type,xmin,ymin,width,height,param1,param2) {
  this.type=type; // (TYPE_POLAR, TYPE_GRID...)
  this.xmin = xmin;
  this.ymin = ymin;
  this.param1 = param1;
  this.param2 = param2;
  this.height = height;
  this.width = width;
  this.nodes = [];
  this.edges = [];

  var cx,cy,x,y,size; //float
  var grid; // array of Node
  var step,nbcol,nbrow; //int

  this.add_edge = function(edge)
  {
    this.edges.push(edge);
    // for each node of edge 'edge', add it to 'e'
    edge.getNode1().add_edge(edge);
    edge.getNode2().add_edge(edge);
    //    print("Adding: "+e+"\n");
  };

  this.add_node = function(node)
  {
    this.nodes.push(node);
    //    print("Adding: "+n+"\n");
  };

  switch (this.type) {
  case Graph.TYPE_POLAR:
    var nbp=this.param1 | 0; // number of points on each orbit
    var nbo=this.param2 | 0; // number of orbits
    var os = (this.width<this.height?this.width:this.height)/(2*nbo); // orbit height
    var o,p, row, col; // iterator indexes
    grid = new Array(1+nbp*nbo); // array of Node
    cx = this.width/2+this.xmin;
    cy = this.height/2+this.ymin; // centre

    this.add_node(grid[0]=new Node(cx,cy));

    for (o=0;o<nbo;o++)
      for (p=0;p<nbp;p++)
        this.add_node(grid[1+o*nbp+p]=new Node(cx+(o+1)*os*Math.sin(p*TWO_PI/nbp),
                                          cy+(o+1)*os*Math.cos(p*TWO_PI/nbp)));

    // generate edges
    for (o=0;o<nbo;o++)
      for (p=0;p<nbp;p++) {
        if (o===0) {
          // link first orbit nodes with centre
          this.add_edge(new Edge(grid[1+o*nbp+p],grid[0]));
        }
        else // link orbit nodes with lower orbit
          this.add_edge(new Edge(grid[1+o*nbp+p],grid[1+(o-1)*nbp+p]));
        // link along orbit
        this.add_edge(new Edge(grid[1+o*nbp+p], grid[1+o*nbp+(p+1)%nbp]));
      }
    break;

  case Graph.TYPE_TRIANGLE:
    var edge_size=param1;
    var L=(width<height?width:height)/2.0; // circumradius of the triangle
    cx=(xmin+width/2.0); cy=(ymin+height/2.0); /* centre of the triangle */
    var p2x=(cx-L*SQRT_3/2.0), p2y=(cy+L/2.0); /* p2 is the bottom left vertex */
    var nsteps=Math.floor(3*L/(SQRT_3*edge_size)) | 0;
    grid = new Array((nsteps+1)*(nsteps+1));

    // create node grid
    for (row=0;row<=nsteps;row++)
      for (col=0;col<=nsteps;col++)
        if (row+col<=nsteps) {
          x=p2x+col*L*SQRT_3/nsteps + row*L*SQRT_3/(2*nsteps);
          y=p2y-row*3*L/(2*nsteps);
          grid[col+row*(nsteps+1)]=new Node(x, y);
          this.add_node(grid[col+row*(nsteps+1)]);
        }

    // create edges
    for (row=0;row<nsteps;row++)
      for (col=0;col<nsteps;col++)
        if (row+col<nsteps) {
          // horizontal edges
          this.add_edge(new Edge(grid[row+col*(nsteps+1)],grid[row+(col+1)*(nsteps+1)]));
          // vertical edges
          this.add_edge(new Edge(grid[row+col*(nsteps+1)],grid[row+1+col*(nsteps+1)]));
          // diagonal edges
          this.add_edge(new Edge(grid[row+1+col*(nsteps+1)],grid[row+(col+1)*(nsteps+1)]));
        }
    break;

  case Graph.TYPE_KENNICOTT:
    // make a graph inspired by one of the motifs from the Kennicott bible
    // square grid of clusters of the shape  /|\
    //                                       ---
    //                                       \|/
    // cluster_size is the length of an edge of a cluster

    step=param1;
    var cluster_size=param2;
    size=width<height?height:width;
    nbcol=Math.floor((1+size/step)/2*2) | 0; //@@ was (int)((1+size/step)/2*2)
    nbrow=Math.floor((1+size/step)/2*2) | 0;
    grid = new Array(5*nbrow*nbcol);   /* there are 5 nodes in each cluster */

    /* adjust xmin and xmax so that the grid is centred */
    xmin+=(width-(nbcol-1)*step)/2;
    ymin+=(height-(nbrow-1)*step)/2;

    /* create node grid */
    for (row=0;row<nbrow;row++)
      for (col=0;col<nbcol;col++) {
        var ci=5*(row+col*nbrow);
        x=col*step+xmin;
        y=row*step+ymin;

        /* create a cluster centred on x,y */
        grid[ci  ]=new Node(x, y);
        grid[ci+1]=new Node((x+cluster_size), y);
        grid[ci+2]=new Node(x, (y-cluster_size));
        grid[ci+3]=new Node((x-cluster_size), y);
        grid[ci+4]=new Node(x, (y+cluster_size));

        this.add_node(grid[ci]);
        this.add_node(grid[ci+1]);
        this.add_node(grid[ci+2]);
        this.add_node(grid[ci+3]);
        this.add_node(grid[ci+4]);

        /* internal edges */
        this.add_edge(new Edge(grid[ci], grid[ci+1]));
        this.add_edge(new Edge(grid[ci], grid[ci+2]));
        this.add_edge(new Edge(grid[ci], grid[ci+3]));
        this.add_edge(new Edge(grid[ci], grid[ci+4]));
        this.add_edge(new Edge(grid[ci+1], grid[ci+2]));
        this.add_edge(new Edge(grid[ci+2], grid[ci+3]));
        this.add_edge(new Edge(grid[ci+3], grid[ci+4]));
        this.add_edge(new Edge(grid[ci+4], grid[ci+1]));

      }

    // create inter-cluster edges
    for (row=0;row<nbrow;row++)
      for (col=0;col<nbcol;col++) {
        if (col!=nbcol-1)
          // horizontal edge from edge 1 of cluster (row, col) to edge 3
          // of cluster (row,col+1)
          this.add_edge(new Edge(grid[5*(row+col*nbrow)+1],grid[5*(row+(col+1)*nbrow)+3]));
        if (row!=nbrow-1)
          // vertical edge from edge 4 of cluster (row, col) to edge 2
          // of cluster (row+1,col)
          this.add_edge(new Edge(grid[5*(row+col*nbrow)+4], grid[5*(row+1+col*nbrow)+2]));
      }
    break;

  case Graph.TYPE_TGRID:
    // simple grid graph
    step=param1; //was (int)param1
    size=width<height?height:width;

    // empirically, it seems there are 2 curves only if both
    // nbcol and nbrow are even, so we round them to even
    nbcol=Math.floor((2+size/step)/2*2); //@@ /2*2?
    nbrow=Math.floor((2+size/step)/2*2);
    // was: nbcol=(int)((2+size/step)/2*2);
    //      nbrow=(int)((2+size/step)/2*2);

    grid = new Array((nbrow*nbcol)|0);

    /* adjust xmin and xmax so that the grid is centered */
    xmin+=(width-(nbcol-1)*step)/2;
    ymin+=(height-(nbrow-1)*step)/2;

    /* create node grid */
    for (row=0;row<nbrow;row++)
      for (col=0;col<nbcol;col++) {
        x=col*step+xmin;
        y=row*step+ymin;
        grid[row+col*nbrow]=new Node(x, y);
        this.add_node(grid[row+col*nbrow]);
      }

    /* create edges */
    for (row=0;row<nbrow;row++)
      for (col=0;col<nbcol;col++) {
        if (col!=nbcol-1)
          this.add_edge(new Edge(grid[row+col*nbrow], grid[row+(col+1)*nbrow]));
        if (row!=nbrow-1)
          this.add_edge(new Edge(grid[row+col*nbrow], grid[row+1+col*nbrow]));
        if (col!=nbcol-1 && row!=nbrow-1) {
          this.add_edge(new Edge(grid[row+col*nbrow], grid[row+1+(col+1)*nbrow]));
          this.add_edge(new Edge(grid[row+1+col*nbrow], grid[row+(col+1)*nbrow]));
        }
      }
    break;
    case Graph.TYPE_CUSTOM:
    var node1=new Node(250,250); this.add_node(node1);
    var node2=new Node(250,300); this.add_node(node2);
    var node3=new Node(300,300); this.add_node(node3);

    this.add_edge(new Edge(node1,node2));
    this.add_edge(new Edge(node2,node3));
    this.add_edge(new Edge(node3,node1));
  }
};



Graph.prototype.next_edge_around = function(n, ed) {
  // return the next edge after e around node n clockwise
  var angle, minangle=20;
  var next_edge = ed.getEdge(), edge;
  for (var i=0;i<n.getEdges().length;i++) {
    edge=n.getEdges()[i];
    if (edge != ed.getEdge()) {
      angle = ed.getEdge().angle_to(edge,n,ed.getDirection());
      if (angle < minangle) {
        next_edge=edge;
        minangle=angle;
      }
    }
  }
return next_edge;
};

Graph.prototype.draw = function()
{
  var i;
  g_ctx.strokeStyle = "rgb(0,0,0)";
  for (i=0;i<this.nodes.length;i++) this.nodes[i].draw();
  for (i=0;i<this.edges.length;i++) this.edges[i].draw();
};

Graph.prototype.toString = function()
{
  var i;
  var s="Graph: ";
  s+="\n- "+this.nodes.length+" nodes: ";
  for (i=0;i<this.nodes.length;i++) s+=this.nodes[i]+", ";
  s+="\n- "+this.edges.length+" edges: ";
  for (i=0;i<this.edges.length;i++) s+=this.edges[i]+", ";
  return s;
};

Graph.prototype.rotate = function(angle, cx, cy)
{
  // rotate all the nodes of this graph around point (cx,cy)
  var c=Math.cos(angle), s=Math.sin(angle), x, y;
  var n;
  for (var i=0;i<this.nodes.length;i++) {
    n=this.nodes[i];
    x=n.getX(); y=n.getY();
    n.setX((x-cx)*c-(y-cy)*s + cx);
    n.setY((x-cx)*s+(y-cy)*c + cy);
  }
};

Graph.TYPE_POLAR=0;
Graph.TYPE_TGRID=1;
Graph.TYPE_KENNICOTT=2;
Graph.TYPE_TRIANGLE=3;
Graph.TYPE_CUSTOM=4;




//====================================================================================



// A Pattern is a set of closed curves that form a motif
function Pattern(new_st, new_g, new_shape1, new_shape2) {
  var splines = [];
  var shape1=new_shape1;
  var shape2=new_shape2;
  var graph=new_g;
  var ec=new EdgeCouple(new_g.edges.length);

  this.getSplines = function() { return splines; };

  this.toString = function() {
    var result="Pattern: { splines: [";
    for (var i=0;i<splines.length;i++) {
      result+=splines[i];
    }
    return result+"]}";
  };

  this.edge_couple_set = function(edgeDirection, value)
  {
    for (var i=0;i<graph.edges.length;i++)
      if (graph.edges[i]==edgeDirection.getEdge()) {
        ec.getArray()[i][edgeDirection.getDirection()]=value;
        return;
      }
  };

  // Add a cubic Bezier curve segment to a spline (s)
  this.addBezierCurve = function(s, node, edge1, edge2, direction)
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
  };


  this.next_unfilled_couple = function()
  {
    var ed=null; //EdgeDirection
    for (var i=0;i<ec.getSize();i++) {
      if (ec.getArray()[i][CLOCKWISE]==0) {
        ed = new EdgeDirection(graph.edges[i], CLOCKWISE);
        return ed;
      }
      else if (ec.getArray()[i][ANTICLOCKWISE]==0) {
        ed = new EdgeDirection(graph.edges[i], ANTICLOCKWISE);
        return ed;
      }
    }
    return ed; // possibly null if no edge found
  };

  this.make_curves = function()
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
//      print("2="+this.splines.length);
      if (s.getSegments().length>2) // spline is just one point: remove it
        splines.push(s);

//      print("3="+this.splines.length);
    }
  };
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
  pattern.make_curves();
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

})();