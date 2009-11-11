(function() {
  
var g_canvas = document.getElementById("canvas");
var g_ctx;
if (g_canvas) 
  g_ctx = g_canvas.getContext("2d");
else
  return;

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
function random(min,max)
{
  return Math.random()*(max-min) + min;
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
  g_ctx.beginPath();
  g_ctx.moveTo(x1,y1);
  g_ctx.lineTo(x2,y2);
  g_ctx.closePath();
  g_ctx.stroke();
}


//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function Edge(n1,n2) {
  this.node1=n1;
  this.node2=n2;
  this.angle1=Math.atan2(n2.y - n1.y, n2.x - n1.x);
  if (this.angle1 < 0) this.angle1+=TWO_PI;
  this.angle2=Math.atan2(n1.y - n2.y, n1.x - n2.x);
  if (this.angle2 < 0) this.angle2+=TWO_PI;

  this.draw = function() 
  {
    line(this.node1.x,this.node1.y, this.node2.x,this.node2.y);
  };

  this.toString = function()
  {
    return "Edge: "+this.node1+", "+this.node2;
  };

  this.angle = function(n) 
  {
    // return the angle of the edge at Node n
    if (n==this.node1) return this.angle1; else return this.angle2;
  };

  this.other_node = function(n) 
  {
    if (n==this.node1) return this.node2; else return this.node1;
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
}

//======================================================================

function EdgeCouple(nb_edges) 
{
  this.size = nb_edges;
  this.array = new Array(this.size);
  
  for (var i=0;i<this.size;i++) {
    this.array[i] = new Array(2);
    this.array[i][0] = 0;
    this.array[i][1] = 0;
  }
}

//======================================================================

function EdgeDirection (edge,direction)
{
  var e,d;
  this.e=edge; // Edge
  this.d=direction; // int
}

//======================================================================


function Graph(type,xmin,ymin,width,height,param1,param2) {
  this.type=type; // (TYPE_POLAR, TYPE_GRID...)
  this.nodes = [];
  this.edges = [];

  var cx,cy,x,y,size; //float
  var grid; // array of Node
  var step,nbcol,nbrow; //int

  this.add_edge = function(edge)
  {
    this.edges.push(edge);
    // for each node of edge 'edge', add it to 'e'
    edge.node1.add_edge(edge);
    edge.node2.add_edge(edge);
    //    print("Adding: "+e+"\n");
  };

  this.add_node = function(node) 
  {
    this.nodes.push(node);
    //    print("Adding: "+n+"\n");
  };

  switch (this.type) {
  case Graph.TYPE_POLAR:
    var nbp=param1 | 0; // number of points on each orbit
    var nbo=param2 | 0; // number of orbits
    var os = (width<height?width:height)/(2*nbo); // orbit height 
    var o,p, row, col; // iterator indexes
    grid = new Array(1+nbp*nbo); // array of Node
    cx = width/2+xmin;
    cy = height/2+ymin; // centre

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
    var node1=new Node(50,50); this.add_node(node1);
    var node2=new Node(50,100); this.add_node(node2);
//    var node3=new Node(100,100); this.add_node(node3);

    this.add_edge(new Edge(node1,node2));
//    this.add_edge(new Edge(node2,node3));
//    this.add_edge(new Edge(node3,node1));
  }


  this.next_edge_around = function(n, ed) {
    // return the next edge after e around node n clockwise
    var angle, minangle=20;
    var next_edge = ed.e, edge;
    for (var i=0;i<n.edges.length;i++) {
      edge=n.edges[i];
       if (edge != ed.e) {
         angle = ed.e.angle_to(edge,n,ed.d);
         if (angle < minangle) {
           next_edge=edge;
           minangle=angle;
         }
       }
     }
    return next_edge;
  };

  this.draw = function() 
  {
    var i;
    g_ctx.strokeStyle = "rgb(0,0,0)";
    for (i=0;i<this.nodes.length;i++) this.nodes[i].draw();
    for (i=0;i<this.edges.length;i++) this.edges[i].draw();
  };

  this.toString = function()
  {
    var i;
    var s="Graph: ";
    s+="\n- "+nodes.length+" Nodes: ";
    for (i=0;i<nodes.length;i++) s+=nodes[i].toString();
    s+="\n- "+edges.length+" Edges: ";
    for (i=0;i<edges.length;i++) s+=edges[i].toString();
    return s;
  };

  this.rotate = function(angle, cx, cy) {
    // rotate all the nodes of this graph around point (cx,cy)
    var c=Math.cos(angle), s=Math.sin(angle), x, y;
    var n;
    for (var i=0;i<this.nodes.length;i++) {
      n=this.nodes[i];
      x=n.x; y=n.y;
      n.x = (x-cx)*c-(y-cy)*s + cx;
      n.y = (x-cx)*s+(y-cy)*c + cy;
    }
  };
}

Graph.TYPE_POLAR=0;
Graph.TYPE_TGRID=1;
Graph.TYPE_KENNICOTT=2;
Graph.TYPE_TRIANGLE=3;
Graph.TYPE_CUSTOM=4;




//====================================================================================

function Node(x,y)
{
  this.x=x;
  this.y=y;
  this.edges = [];

  this.draw = function() 
  {
    circle(this.x, this.y, 4.0);
  };

  this.toString = function()
  {
    return "Node: ("+this.x+","+this.y+")";
  };

  this.add_edge = function(e)
  {
    this.edges.push(e);
  };
};

//================================================================================

function Params()
{
  var curve_width, shadow_width; //float
  var shape1, shape2; //float
  var margin; //float
  var type; // int. one of Graph.TYPE_*
  var edge_size;
  var cluster_size; /* only used if type is kennicott */
  var delay;        /* controls curve drawing speed (step delay in microsecs) */
  var nsteps; /* only if triangle: number of subdivisions along the side */
  var nb_orbits;          /* only used if type is polar */
  var nb_nodes_per_orbit; /* only used if type is polar */
  var angle; /* angle of rotation of the graph around the centre */
};

//================================================================================

function Pattern(new_t, new_g, new_shape1, new_shape2) {
  this.splines = [];
  this.shape1=new_shape1;
  this.shape2=new_shape2;
  this.graph=new_g;
  this.ec=new EdgeCouple(new_g.edges.length);

  this.edge_couple_set = function(ed, value)
  {
    for (var i=0;i<this.graph.edges.length;i++)
      if (this.graph.edges[i]==ed.e) {
        this.ec.array[i][ed.d]=value;
        return;
      }
  };

  this.draw_spline_direction = function(s, node, edge1, edge2, direction)
  {
    var x1=(edge1.node1.x+edge1.node2.x)/2.0;
    var y1=(edge1.node1.y+edge1.node2.y)/2.0;

    // P2 (x2,y2) is the middle point of edge1
    var x4=(edge2.node1.x+edge2.node2.x)/2.0;
    var y4=(edge2.node1.y+edge2.node2.y)/2.0;

    var alpha=edge1.angle_to(edge2,node,direction)*this.shape1;
    var beta=this.shape2;

    var i1x,i1y,i2x,i2y,x2,y2,x3,y3;

    if (direction == ANTICLOCKWISE) {
      // I1 must stick out to the left of NP1 and I2 to the right of NP4
      i1x =  alpha*(node.y-y1)+x1;
      i1y = -alpha*(node.x-x1)+y1;
      i2x = -alpha*(node.y-y4)+x4;
      i2y =  alpha*(node.x-x4)+y4;
      x2 =  beta*(y1-i1y) + i1x;
      y2 = -beta*(x1-i1x) + i1y;
      x3 = -beta*(y4-i2y) + i2x;
      y3 =  beta*(x4-i2x) + i2y;
    }
    else {
      // I1 must stick out to the left of NP1 and I2 to the right of NP4
      i1x = -alpha*(node.y-y1)+x1;
      i1y =  alpha*(node.x-x1)+y1;
      i2x =  alpha*(node.y-y4)+x4;
      i2y = -alpha*(node.x-x4)+y4;
      x2 = -beta*(y1-i1y) + i1x;
      y2 =  beta*(x1-i1x) + i1y;
      x3 =  beta*(y4-i2y) + i2x;
      y3 = -beta*(x4-i2x) + i2y;
    }
    print("adding sement")
    s.add_segment(x1,y1,x2,y2,x3,y3,x4,y4);
  };


  this.next_unfilled_couple = function()
  {
    var ed=null; //EdgeDirection
    for (var i=0;i<this.ec.size;i++) {
      if (this.ec.array[i][CLOCKWISE]==0) {
        ed = new EdgeDirection(this.graph.edges[i], CLOCKWISE);
        return ed;
      }
      else if (this.ec.array[i][ANTICLOCKWISE]==0) {
        ed = new EdgeDirection(this.graph.edges[i], ANTICLOCKWISE);
        return ed;
      }
    }
    return ed; // possibly null if no edge found
  };

  this.make_curves = function()
  {
    var i;
    var current_edge, first_edge, next_edge;
    var current_node, first_node;
    var current_direction, first_direction;
    var s; //Spline
    var first_edge_direction, current_edge_direction;

    i=0;
    while ((first_edge_direction=this.next_unfilled_couple())!=null) {
      // start a new loop
      s=new Spline(random(100,255), random(100,255), random(100,255));
      this.splines.push(s);
      print("1="+this.splines.length)
      current_edge_direction = new EdgeDirection(first_edge_direction.e,
                                                 first_edge_direction.d);
      current_node=first_node=current_edge_direction.e.node1;

      do {
        this.edge_couple_set(current_edge_direction, 1);
        next_edge = this.graph.next_edge_around(current_node,current_edge_direction);

        // add the spline segment to the spline
        this.draw_spline_direction(s,current_node, current_edge_direction.e, next_edge, current_edge_direction.d);

        // cross the edge
        current_edge_direction.e = next_edge;
        current_node = next_edge.other_node(current_node);
        current_edge_direction.d = 1-current_edge_direction.d;

      } while (current_node!=first_node ||
               current_edge_direction.e!=first_edge_direction.e ||
               current_edge_direction.d!=first_edge_direction.d);
      print("2="+this.splines.length)
//      if (s.segments.length==2) // spline is just one point: remove it
//        this.splines.splice(this.splines.length-1,1);
      print("3="+this.splines.length)
    }
  };
}

//================================================================================

function Point(x, y) 
{
  this.x=x;
  this.y=y;
  this.toString = function() { return "Point: {x="+this.x+", y="+this.y+"}";};    
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
  var red=new_red;
  var green=new_green;
  var blue=new_blue;

  this.add_segment = function(x1, y1, x2, y2, x3, y3, x4, y4)
  {
    segments.push(new SplineSegment(x1,y1,x2,y2,x3,y3,x4,y4));
  };

  this.value_at = function(t)
  {
    var si;
    var tt;
    var ss;
    si = Math.floor(t*segments.length);
    if (si==segments.length) si--;
    print("out: "+si+", "+segments.length+", "+t+"\n");
    tt = t*segments.length - si;
    ss=segments[si];
    print("ss: "+ss);
    var pi=new PointIndex(ss.x1*(1-tt)*(1-tt)*(1-tt)+3*ss.x2*tt*(1-tt)*(1-tt)+3*ss.x3*tt*tt*(1-tt)+ss.x4*tt*tt*tt,
                          ss.y1*(1-tt)*(1-tt)*(1-tt)+3*ss.y2*tt*(1-tt)*(1-tt)+3*ss.y3*tt*tt*(1-tt)+ss.y4*tt*tt*tt,
                          si);
    print(pi);
    return pi;
  };

  this.draw = function() {
    //    print("=== spline ===");
    for (var i=0;i<segments.length;i++) {
      var s=segments[i];
      s.draw();
    }
  };

  this.toString = function() {
    return "Spline: { "+segments.length+" segments }";
  };
}

//================================================================================

function SplineSegment(new_x1, new_y1, new_x2, new_y2, new_x3, new_y3, new_x4, new_y4) {
  var x1,y1,x2,y2,x3,y3,x4,y4;

  x1=new_x1; y1=new_y1;
  x2=new_x2; y2=new_y2;
  x3=new_x3; y3=new_y3;
  x4=new_x4; y4=new_y4;

  this.draw = function() {
    circle(x1, y1, 2.0);
    circle(x2, y2, 2.0);
    circle(x3, y3, 2.0);
    circle(x4, y4, 2.0);
    line(x1,y1, x2,y2);
    line(x2,y2, x3,y3);
    line(x3,y3, x4,y4);
    //    print("segment: "+this.x1+","+this.y1+" = "+this.x2+","+this.y2+" = "+this.x3+","+this.y3+" = "+this.x4+","+this.y4);
  };
}

//================================================================================

function State()
{
  var step=0.1;
  var showGraph; //Boolean
  var pattern;
  var graph;
  var width, height;
  var delay2;
  var reset;
  var t;
  var params = new Params();

  this.getStep = function() { return step; };
  this.getPattern = function() { return pattern; };
  this.getGraph = function() { return graph; };

  // Constructor
  params.curve_width=random(4,10);
  params.shadow_width=params.curve_width+4;
  //  params.shape1=random(.5,2);
  //  params.shape2=random(.5,2);
  params.shape1=.5;
  params.shape2=.5;
  params.edge_size=random(20,60);
  //  params.delay=100;
  params.delay=0;
  params.angle=random(0,2*PI);
  params.margin=random(0,100);

  params.type=Math.floor(random(0,4)) | 0; // | 0 converts to an int32
  params.type=4;

  switch (params.type) {
    case Graph.TYPE_TGRID:
      params.type=Graph.TYPE_TGRID;
      params.shape1=-random(0.3, 1.2);
      params.shape2=-random(0.3, 1.2);
      params.edge_size=random(50,90);
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
      params.shape1=random(-1,1);
      params.shape2=random(-1,1);
      params.edge_size=random(70,90);
      params.cluster_size=params.edge_size/random(3,12)-1;
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
      params.edge_size=random(60,100);
      params.margin=random(-900,0);
      graph=new Graph (Graph.TYPE_TRIANGLE,
                          params.margin,
                          params.margin,
                          WIDTH-2*params.margin,
                          HEIGHT-2*params.margin,
                          params.edge_size,
                          0);
      break;
    case Graph.TYPE_POLAR:
      params.type=Graph.TYPE_POLAR;
      params.nb_orbits=random(2,11);
      params.nb_nodes_per_orbit=random(4,13);
      graph=new Graph(Graph.TYPE_POLAR,
                         params.margin,
                         params.margin,
                         WIDTH-2*params.margin,
                         HEIGHT-2*params.margin,
                         params.nb_nodes_per_orbit,
                         params.nb_orbits);
      break;
    case Graph.TYPE_CUSTOM:
      params.type=Graph.TYPE_CUSTOM;
      params.nb_orbits=random(2,11);
      params.nb_nodes_per_orbit=random(4,13);
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

//  graph.rotate(st.params.angle,WIDTH/2,HEIGHT/2);

  pattern=new Pattern(st, graph, params.shape1, params.shape2);
  pattern.make_curves();
  t = 0.0;

  var canvasBackground="rgb("+random(0,100)+","+random(0,100)+","+random(0,100)+")";
  document.getElementById("canvas").style.backgroundColor=canvasBackground;

  //  if (pattern.splines.length==1) {
    colorMode(HSB);
    start=color(random(0,256), 200, 200);
    end=color(random(0,256), 200, 200);
    //  }
  strokeWeight(params.curve_width);
  //  stroke(0,0,0);
  //  graph.draw();
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

var st=new State(); // State
var t,t2; //float
var s;
var pi1, pi2, pi3, pi4;
var start, end; // colors

function setup() 
{
  st.getGraph().draw();
}

function draw() {
  var speed;
  var c; //color

  for (t=0;t<=1.0;t+=st.getStep()) {
    t2 = (t+st.getStep()>1.0) ? 1.0 : t+st.getStep();

    //  print("t: "+t+", t2: "+t2);

    for (var i=0;i<st.getPattern().splines.length;i++) {

      s=st.getPattern().splines[i];
      //    s.draw();

      if (s != null) { // skip if one-point spline 
        pi1=s.value_at(t);
        pi2=s.value_at(t2);
        //      stroke(s.r, s.g, s.b);
        //      line(pi1.p.x,pi1.p.y, pi2.p.x,pi2.p.y);
        
        //      if (st.pattern.splines.length==1) // if only one curve to draw, make it more colourful
        //        fill(lerpColor(start, end, t));
        
        //       stroke(lerpColor(start, end, t));
        g_ctx.fillStyle="grey";
        //      else
        //        stroke(s.r, s.g, s.b);
        var p1=pi1.getPoint(), p2=pi2.getPoint();
        line(p1.x,p1.y, p2.x,p2.y);
      //      speed = sqrt((pi2.p.x-pi1.p.x)*(pi2.p.x-pi1.p.x)+(pi2.p.y-pi1.p.y)*(pi2.p.y-pi1.p.y));
      //      ellipse((pi2.p.x+pi1.p.x)/2, (pi2.p.y+pi1.p.y)/2, speed, speed);
      }
    }
  }
}

function print(text)
{
  // Firefox
  console.log(text);
}

setup();
draw();



})();