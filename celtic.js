(function() {
  
var g_canvas = document.getElementById("canvas");
var g_ctx;


const WIDTH=document.getElementById("canvas").width;
const HEIGHT=document.getElementById("canvas").height;
const CLOCKWISE=0;
const ANTICLOCKWISE=1;
const SQRT_3 = 1.73205080756887729352;
const PI = Math.PI;
const TWO_PI = 2*PI;

//================================================================================
// Processing functions and types rewritten


// returns a random integer between min and max
function random(min,max)
{
  return (Math.floor(Math.random()*(1+max-min)) + min) | 0;
}



//================================================================================

function Edge(n1,n2) {
  var node1, node2;
  var angle1, angle2;

  node1=n1;
  node2=n2;
  angle1=atan2(node2.y - node1.y, node2.x - node1.x);
  if (angle1 < 0) angle1+=TWO_PI;
  angle2=atan2(node1.y - node2.y, node1.x - node2.x);
  if (angle2 < 0) angle2+=TWO_PI;

  function draw() 
  {
    line(node1.x,node1.y, node2.x,node2.y);
  }

  function toString() 
  {
    return "Edge: "+node1+", "+node2;
  }

  function angle(n) 
  {
    // return the angle of the edge at Node n
    if (n==node1) return angle1; else return angle2;
  }

  function other_node(n) 
  {
    if (n==node1) return node2; else return node1;
  }

  function angle_to(e2, node, direction)
  {
    /* returns the absolute angle from this edge to "edge2" around
       "node" following "direction" */
    var a;

    if (direction===CLOCKWISE)
      a=this.angle(node) - e2.angle(node);
    else
      a=e2.angle(node) - this.angle(node);

    if (a<0) return a+2*PI; else return a;
  }
}

//======================================================================

function EdgeCouple(nb_edges) 
{
  var array = new Array(nb_edges);
  var size;
  
  for (var i=0;i<nb_edges;i++) {
    array[i] = new Array(2);
  }
  size=nb_edges;
}

//======================================================================

function EdgeDirection (edge,direction)
{
  var e,d;
  this.e=edge; // Edge
  this.d=direction; // int
}

//======================================================================


function Graph(new_type,new_xmin,new_ymin,new_width,new_height,new_param1,new_param2) {
  var type=new_type; //int
  var nodes = [];
  var edges = [];
  var xmin,ymin,width,height; //int
  var cx,cy,x,y,size; //float
  var grid; // array of Node
  var step,nbcol,nbrow; //int

  switch (type) {
  case Graph.TYPE_POLAR:
    var nbp=new_param1; // number of points on each orbit
    var nbo=new_param2; // number of orbits
    var os = (new_width<new_height?new_width:new_height)/(2*nbo); // orbit height 
    var o,p, row, col; // iterator indexes
    grid = new Array(1+nbp*nbo); // array of Node
    cx = new_width/2+new_xmin;
    cy = new_height/2+new_ymin; // centre
    
    add_node(grid[0]=new Node(cx,cy));
    
    for (o=0;o<nbo;o++)
      for (p=0;p<nbp;p++)
        add_node(grid[1+o*nbp+p]=new Node(cx+(o+1)*os*sin(p*TWO_PI/nbp),
                                          cy+(o+1)*os*cos(p*TWO_PI/nbp)));
    
    // generate edges
    for (o=0;o<nbo;o++)
      for (p=0;p<nbp;p++) {
        if (o===0) // link first orbit nodes with centre
          add_edge(new Edge(grid[1+o*nbp+p],grid[0]));
        else // link orbit nodes with lower orbit 
          add_edge(new Edge(grid[1+o*nbp+p],grid[1+(o-1)*nbp+p]));
        // link along orbit 
        add_edge(new Edge(grid[1+o*nbp+p], grid[1+o*nbp+(p+1)%nbp]));
      }
    break;
    
  case Graph.TYPE_TRIANGLE:
    var edge_size=new_param1;
    var L=(width<height?width:height)/2.0; // circumradius of the triangle
    cx=(xmin+width/2.0); cy=(ymin+height/2.0); /* centre of the triangle */
    var p2x=(cx-L*SQRT_3/2.0), p2y=(cy+L/2.0); /* p2 is the bottom left vertex */
    var nsteps=Math.floor(3*L/(SQRT_3*edge_size));
    grid = new Node[(nsteps+1)*(nsteps+1)];
    
    // create node grid
    for (row=0;row<=nsteps;row++)
      for (col=0;col<=nsteps;col++)
        if (row+col<=nsteps) {
          x=p2x+col*L*SQRT_3/nsteps + row*L*SQRT_3/(2*nsteps);
          y=p2y-row*3*L/(2*nsteps);
          grid[col+row*(nsteps+1)]=new Node(x, y);
          add_node(grid[col+row*(nsteps+1)]);
        }
    
    // create edges
    for (row=0;row<nsteps;row++)
      for (col=0;col<nsteps;col++)
        if (row+col<nsteps) {
          // horizontal edges
          add_edge(new Edge(grid[row+col*(nsteps+1)],grid[row+(col+1)*(nsteps+1)]));
          // vertical edges
          add_edge(new Edge(grid[row+col*(nsteps+1)],grid[row+1+col*(nsteps+1)]));
          // diagonal edges
          add_edge(new Edge(grid[row+1+col*(nsteps+1)],grid[row+(col+1)*(nsteps+1)]));
        }
    break;
    
  case Graph.TYPE_KENNICOTT:
    // make a graph inspired by one of the motifs from the Kennicott bible
    // square grid of clusters of the shape  /|\
    //                                       ---
    //                                       \|/
    // cluster_size is the length of an edge of a cluster
    
    step=new_param1;
    var cluster_size=new_param2;
    size=width<height?height:width;
    nbcol=Math.floor((1+size/step)/2*2); //@@ was (int)((1+size/step)/2*2)
    nbrow=Math.floor((1+size/step)/2*2);
    grid = new Node[5*nbrow*nbcol];   /* there are 5 nodes in each cluster */
    
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
        
        add_node(grid[ci]);
        add_node(grid[ci+1]);
        add_node(grid[ci+2]);
        add_node(grid[ci+3]);
        add_node(grid[ci+4]);
        
        /* internal edges */
        add_edge(new Edge(grid[ci], grid[ci+1]));
        add_edge(new Edge(grid[ci], grid[ci+2]));
        add_edge(new Edge(grid[ci], grid[ci+3]));
        add_edge(new Edge(grid[ci], grid[ci+4]));
        add_edge(new Edge(grid[ci+1], grid[ci+2]));
        add_edge(new Edge(grid[ci+2], grid[ci+3]));
        add_edge(new Edge(grid[ci+3], grid[ci+4]));
        add_edge(new Edge(grid[ci+4], grid[ci+1]));
        
      }
    
    // create inter-cluster edges
    for (row=0;row<nbrow;row++)
      for (col=0;col<nbcol;col++) {
        if (col!=nbcol-1)
          // horizontal edge from edge 1 of cluster (row, col) to edge 3
          // of cluster (row,col+1)
          add_edge(new Edge(grid[5*(row+col*nbrow)+1],grid[5*(row+(col+1)*nbrow)+3]));
        if (row!=nbrow-1)
          // vertical edge from edge 4 of cluster (row, col) to edge 2
          // of cluster (row+1,col)
          add_edge(new Edge(grid[5*(row+col*nbrow)+4], grid[5*(row+1+col*nbrow)+2]));
      }
    break;
    
  case Graph.TYPE_TGRID:
    // simple grid graph
    step=new_param1; //was (int)param1
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
        add_node(grid[row+col*nbrow]);
      }
    
    /* create edges */
    for (row=0;row<nbrow;row++)
      for (col=0;col<nbcol;col++) {
        if (col!=nbcol-1)
          add_edge(new Edge(grid[row+col*nbrow], grid[row+(col+1)*nbrow]));
        if (row!=nbrow-1)
          add_edge(new Edge(grid[row+col*nbrow], grid[row+1+col*nbrow]));
        if (col!=nbcol-1 && row!=nbrow-1) {
          add_edge(new Edge(grid[row+col*nbrow], grid[row+1+(col+1)*nbrow]));
          add_edge(new Edge(grid[row+1+col*nbrow], grid[row+(col+1)*nbrow]));
        }
      }
    break;
  }

  function add_node(node) 
  {
    nodes.addElement(node);
    //    System.out.println("Adding: "+n+"\n");
  }

  function add_edge(edge)
  {
    edges.addElement(edge);
    // for each node of edge 'edge', add it to 'e'
    edge.node1.add_edge(edge);
    edge.node2.add_edge(edge);
    //    System.out.println("Adding: "+e+"\n");
  }

  function next_edge_around(n, ed) {
    // return the next edge after e around node n clockwise
    var angle, minangle=20;
    var next_edge = ed.e, edge;
    for (var i=0;i<n.edges.size();i++) {
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
  }

  function draw() 
  {
    var i;
    for (i=0;i<nodes.size();i++) nodes[i].draw();
    for (i=0;i<edges.size();i++) nodes[i].draw();
  }

  function toString()
  {
    var i;
    var s="Graph: ";
    s+="\n- "+nodes.size()+" Nodes: ";
    for (i=0;i<nodes.size();i++) s+=nodes[i].toString();
    s+="\n- "+edges.size()+" Edges: ";
    for (i=0;i<edges.size();i++) s+=edges[i].toString();
    return s;
  }

  function rotate(angle, cx, cy) {
    // rotate all the nodes of this graph around point (cx,cy)
    var c=cos(angle),s=sin(angle),x,y;
    var n;
    for (var i=0;i<nodes.size();i++) {
      n=nodes[i];
      x=n.x; y=n.y;
      n.x = (x-cx)*c-(y-cy)*s + cx;
      n.y = (x-cx)*s+(y-cy)*c + cy;
    }
  }
}

Graph.TYPE_POLAR=0;
Graph.TYPE_TGRID=1;
Graph.TYPE_KENNICOTT=2;
Graph.TYPE_TRIANGLE=3;


//====================================================================================

function Node(new_x,new_y)
{
  var x,y; // float
  var edges = [];

  x=new_x;
  y=new_y;

  function draw() 
  {
    arc(x, y, 10.0, 10.0, 0.0, TWO_PI);
  }

  function toString()
  {
    return "Node: ("+x+","+y+")";
  }

  function add_edge(e)
  {
    edges.addElement(e);
  }
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
  var shape1, shape2;
  var ec; //EdgeCouple
  var graph;
  var splines = [];

  this.shape1=new_shape1;
  this.shape2=new_shape2;
  this.graph=new_g;
  this.ec=new EdgeCouple(new_g.edges.size());

  function edge_couple_set(ed, value) {
    for (var i=0;i<graph.edges.size();i++)
      if (graph.edges[i]==ed.e) {
        ec.array[i][ed.d]=value;
        return;
      }
  }

  function draw_spline_direction(s, node, edge1, edge2, direction)
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
    s.add_segment(x1,y1,x2,y2,x3,y3,x4,y4);
  }


  function next_unfilled_couple()
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
  }

  function make_curves()
  {
    var i;
    var current_edge, first_edge, next_edge;
    var current_node, first_node;
    var current_direction, first_direction;
    var s; //Spline
    var first_edge_direction, current_edge_direction;

    i=0;
    while ((first_edge_direction=next_unfilled_couple())!=null) {
      // start a new loop
      s=new Spline(random(100,255), random(100,255), random(100,255));
      this.splines.addElement(s);

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
      if (s.segments.size()==2) // spline is just one point: remove it
        this.splines.remove(this.splines.size()-1);
    }
  }
}

//================================================================================

function Point(new_x, new_y) 
{
  var x,y;
  x=new_x;
  y=new_y;
}

//================================================================================
 
function PointIndex(new_x,new_y,new_i) {
  // Typically one point of a spline and the segment index of the spline that
  // the point is on
  var p=new Point(x,y);
  var i=new_i;
}

//================================================================================

function Spline(red,green,blue) {
  var segments = [];
  var r=red, g=green, b=blue;

  function add_segment(x1, y1, x2, y2, x3, y3, x4, y4)
  {
    segments.addElement(new SplineSegment(x1,y1,x2,y2,x3,y3,x4,y4));
  }

  function value_at(t)
  {
    var si;
    var tt;
    var ss;
    si = Math.floor(t*segments.size());
    if (si==segments.size()) si--;
    //    System.out.println("out: "+si+", "+this.segments.size()+", "+t);
    tt = t*this.segments.size() - si;
    ss=this.segments[si];

    return new PointIndex(ss.x1*(1-tt)*(1-tt)*(1-tt)+3*ss.x2*tt*(1-tt)*(1-tt)+3*ss.x3*tt*tt*(1-tt)+ss.x4*tt*tt*tt,
                          ss.y1*(1-tt)*(1-tt)*(1-tt)+3*ss.y2*tt*(1-tt)*(1-tt)+3*ss.y3*tt*tt*(1-tt)+ss.y4*tt*tt*tt,
                          si);
  }

  function draw() {
    //    System.out.println("=== spline ===");
    for (var i=0;i<segments.size();i++) {
      var s= segments[i];
      s.draw();
    }
  }
}

//================================================================================

function SplineSegment(new_x1, new_y1, new_x2, new_y2, new_x3, new_y3, new_x4, new_y4) {
  var x1,y1,x2,y2,x3,y3,x4,y4;

  x1=new_x1; y1=new_y1;
  x2=new_x2; y2=new_y2;
  x3=new_x3; y3=new_y3;
  x4=new_x4; y4=new_y4;

  function draw() {
    arc(x1, y1, 2.0, 2.0, 0.0, TWO_PI);
    arc(x2, y2, 2.0, 2.0, 0.0, TWO_PI);
    arc(x3, y3, 2.0, 2.0, 0.0, TWO_PI);
    arc(x4, y4, 2.0, 2.0, 0.0, TWO_PI);
    line(x1,y1, x2,y2);
    line(x2,y2, x3,y3);
    line(x3,y3, x4,y4);
    //    System.out.println("segment: "+this.x1+","+this.y1+" = "+this.x2+","+this.y2+" = "+this.x3+","+this.y3+" = "+this.x4+","+this.y4);
  }
}

//================================================================================

function State()
{
  var STEP=0.005;
  var showGraph; //Boolean
  var pattern;
  var graph;
  var width, height;
  var delay2;
  var reset;
  var t;
  var params;
};

//===========================================================================

function myinit()
{
  st = new State();
  st.params = new Params();
  st.params.curve_width=random(4,10);
  st.params.shadow_width=st.params.curve_width+4;
  //  st.params.shape1=random(.5,2);
  //  st.params.shape2=random(.5,2);
  st.params.shape1=.5;
  st.params.shape2=.5;
  st.params.edge_size=random(20,60);
  //  st.params.delay=100;
  st.params.delay=0;
  st.params.angle=random(0,2*PI);
  st.params.margin=random(0,100);

  st.params.type=random(0,4);

  switch (st.params.type) {
    case Graph.TYPE_TGRID:
      st.params.type=Graph.TYPE_TGRID;
      st.params.shape1=-random(0.3, 1.2);
      st.params.shape2=-random(0.3, 1.2);
      st.params.edge_size=random(50,90);
      st.params.edge_size=500;
      st.graph=new Graph(st.params.type,
                         st.params.margin,
                         st.params.margin,
                         WIDTH-2*st.params.margin,
                         HEIGHT-2*st.params.margin,
                         st.params.edge_size,
                         0);
      break;
    case Graph.TYPE_KENNICOTT:
      st.params.type=Graph.TYPE_KENNICOTT;
      st.params.shape1=random(-1,1);
      st.params.shape2=random(-1,1);
      st.params.edge_size=random(70,90);
      st.params.cluster_size=st.params.edge_size/random(3,12)-1;
      st.graph=new Graph(st.params.type,
                         st.params.margin,
                         st.params.margin,
                         WIDTH-2*st.params.margin,
                         HEIGHT-2*st.params.margin,
                         st.params.edge_size,
                         st.params.cluster_size);
      break;
    case Graph.TYPE_TRIANGLE:
      st.params.type=Graph.TYPE_TRIANGLE;
      st.params.edge_size=random(60,100);
      st.params.margin=random(-900,0);
      st.graph=new Graph (Graph.TYPE_TRIANGLE,
                          st.params.margin,
                          st.params.margin,
                          WIDTH-2*st.params.margin,
                          HEIGHT-2*st.params.margin,
                          st.params.edge_size,
                          0);
      break;
    case Graph.TYPE_POLAR:
      st.params.type=Graph.TYPE_POLAR;
      st.params.nb_orbits=random(2,11);
      st.params.nb_nodes_per_orbit=random(4,13);
      st.graph=new Graph(Graph.TYPE_POLAR,
                         st.params.margin,
                         st.params.margin,
                         WIDTH-2*st.params.margin,
                         HEIGHT-2*st.params.margin,
                         st.params.nb_nodes_per_orbit,
                         st.params.nb_orbits);
      break;
    default: alert("error: graph type out of bounds: "+st.params.type);
    }

  //  st.graph.rotate(st.params.angle,WIDTH/2,HEIGHT/2);
  st.pattern=new Pattern(st, st.graph, st.params.shape1, st.params.shape2);
  st.pattern.make_curves();
  st.t = 0.0;

  background(random(0,100),random(0,100),random(0,100));

  //  if (st.pattern.splines.size()==1) {
    colorMode(HSB);
    start=color(random(0,256), 200, 200);
    end=color(random(0,256), 200, 200);
    //  }
  strokeWeight(st.params.curve_width);
  //  stroke(0,0,0);
  //  st.graph.draw();
  //  System.out.println(st.graph);
}

var st; // State
var t,t2; //float
var s;
var pi1, pi2, pi3, pi4;
var start, end; // colors

function setup() 
{
  g_ctx.strokeStyle = "rgb(0,0,0)";
  myinit();
  t=0;
  //  st.graph.draw();
}

function draw() {
  var speed;
  var c; //color
  t2 = (t+st.STEP>1.0) ? 1.0 : t+st.STEP;

  //  System.out.println("t: "+t+", t2: "+t2);

  for (var i=0;i<st.pattern.splines.size();i++) {
    s=st.pattern.splines[i];
    //    s.draw();

    if (s != null) { // skip if one-point spline 
      pi1=s.value_at(t);
      pi2=s.value_at(t2);
      //      stroke(s.r, s.g, s.b);
      //      line(pi1.p.x,pi1.p.y, pi2.p.x,pi2.p.y);

      //      if (st.pattern.splines.size()==1) // if only one curve to draw, make it more colourful
        //        fill(lerpColor(start, end, t));
        stroke(lerpColor(start, end, t));
      //      else
      //        stroke(s.r, s.g, s.b);

      line(pi1.p.x,pi1.p.y, pi2.p.x,pi2.p.y);
      //      speed = sqrt((pi2.p.x-pi1.p.x)*(pi2.p.x-pi1.p.x)+(pi2.p.y-pi1.p.y)*(pi2.p.y-pi1.p.y));
      //      ellipse((pi2.p.x+pi1.p.x)/2, (pi2.p.y+pi1.p.y)/2, speed, speed);
    }
  }

  t+=st.STEP;

  if (t >= 1.0) {
    noLoop();
    delay(3000);
    myinit();
    t=0;
    loop();
  }
}


function mousePressed() {
  myinit();
  t=0;
  loop();
}

if (g_canvas.getContext)
{
  g_ctx = g_canvas.getContext("2d");
  setup();
  draw();
}



})();