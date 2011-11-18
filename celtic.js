var Const = {
  ANTICLOCKWISE:0,
  CLOCKWISE:1,
  SQRT_3: 1.73205080756887729352,
  RGB: 0,
  HSB: 1
};

var Celtic = (function() {


    // private static methods
    this.randomFloat = function(min,max) {
      // return a number in [min, max[
      // <http://processing.org/reference/random_.html>
      return Math.random()*(max-min) + min;
    };

    this.randomInt = function(min,max)
    {
      return Math.floor(Math.random()*(max-min) + min) | 0;
    };


  return function(params) {
    var curve_width, shadow_width; //float
    var angle; /* angle of rotation of the graph around the centre */
    var canvas;
    var width, height;
    var colorMode = Const.RGB; // one of RGB or HSB
    var r = 0;
    var g = 0;
    var b = 0;
    var st;
    var t,t2;
    var s;
    var pi1, pi2, pi3, pi4;
    var start, end; // colors

    var graphRotationAngle = 0;//randomFloat(0,2*Math.PI);
    var graph;

    this.color = function(a,b,c) {
      switch(this.colorMode) {
        case Const.RGB: this.r=a; this.g=b; this.b=c; break;
      }
    };

    // constructor code
    canvas = document.getElementById("canvas");
    if (canvas) {
      this.ctx = canvas.getContext("2d");
      this.ctx.lineJoin="round";
      this.ctx.lineCap="round";
      width = canvas.width;
      height = canvas.height;
      this.delay = 10; // step delay in microsecs
      this.step=0.001; // parameter increment for progressive rendering

      // random colour background
      this.ctx.fillStyle="rgb("+randomInt(100,255)+","+randomInt(100,255)+","+randomInt(100,255)+")";
      this.ctx.fillRect(0,0,width,height);


      curve_width=randomFloat(4,10);
      shadow_width=curve_width+4;

      // if the type is random, then we pick one other type and compute
      // its parameter randomly. Otherwise it is expected that all
      // parameters are set in the UI and have been retrieved in params
      if (params.type == Graph.TYPE_RANDOM) {
        params.type=randomInt(1,5);

        switch (params.type) {
        case Graph.TYPE_POLAR:
          params.nb_orbits=randomInt(2,11);
          params.nb_nodes_per_orbit=randomInt(4,13);
        break;
        case Graph.TYPE_TGRID:
          params.shape1=-randomFloat(0.3, 1.2);
          params.shape2=-randomFloat(0.3, 1.2);
          params.edge_size=randomFloat(50,90);
        break;
        case Graph.TYPE_KENNICOTT:
          params.shape1=randomFloat(-1,1);
          params.shape2=randomFloat(-1,1);
          params.edge_size=randomFloat(70,90);
          params.kennicott_cluster_size=params.edge_size/randomFloat(3,12)-1;
        break;
        case Graph.TYPE_TRIANGLE:
          params.edge_size=randomFloat(60,100);
          params.margin=randomFloat(-900,0);
        break;
        case Graph.TYPE_CUSTOM:
          params.nb_orbits=randomInt(2,11);
          params.nb_nodes_per_orbit=randomInt(4,13);
        break;
        default: console.log("error: graph type out of bounds: "+this.params.type);
        }
      }
      var graphParams = params;
      graphParams.width = width;
      graphParams.height = height;
      graph = new Graph(graphParams);
//      graph.draw(this.ctx);

      graph.rotate(graphRotationAngle,width/2,height/2);
      this.pattern=new Pattern(graph, params.shape1, params.shape2);
      this.pattern.make_curves();


//      console.log("graph: "+graph);
//      this.pattern.draw(this.ctx);
//      console.log("pattern: "+this.pattern);
//      console.log(this.pattern.toString());

      //  if (pattern.splines.length==1) {
      colorMode = Const.HSB;
      this.color(randomInt(0,256), 200, 200);
//      start=color(randomInt(0,256), 200, 200);
//      end=color(randomInt(0,256), 200, 200);
      //  }
      this.ctx.lineWidth = curve_width;
      //  stroke(0,0,0);
      //graph.draw();
      //  console.log(graph);
    } else {
      console.log("canvas not supported");
    }
  };
})();


// public methods
Celtic.prototype = {
    draw: function() {
      var that=this;
      var t=0;
      var intervalId = setInterval(drawOneStep,this.delay);
      this.ctx.shadowColor="rgba(0,0,0,.5)";
      this.ctx.shadowOffsetX=5;
      this.ctx.shadowOffsetY=5;
      this.ctx.shadowBlur=3;

      function drawOneStep() {
        var t2,pi1,pi2;
        var splines = that.pattern.getSplines();
        if(t>=1.0) clearInterval(intervalId);
        else {
          t2 = (t+that.step>1.0) ? 1.0 : t+that.step;
          for (var i=0;i<splines.length;i++) {
            var s=splines[i];
            if (s != null) {
              that.ctx.strokeStyle="rgb("+s.getRed()+","+s.getGreen()+","+s.getBlue()+")";
              pi1=s.value_at(t);
              pi2=s.value_at(t2);
              var p1=pi1.getPoint(), p2=pi2.getPoint();
              G.line(that.ctx, p1.getX(),p1.getY(), p2.getX(),p2.getY());
            }
          }
          t=t2;
        }
      }
    }
};

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function Edge(n1,n2) {
  var node1 = n1;
  var node2 = n2;

  var angle1=Math.atan2(n2.getY() - n1.getY(), n2.getX() - n1.getX());
  if (angle1 < 0) angle1+=2*Math.PI;
  var angle2=Math.atan2(n1.getY() - n2.getY(), n1.getX() - n2.getX());
  if (angle2 < 0) angle2+=2*Math.PI;

  // Accessors
  this.getNode1 = function() { return node1; };
  this.getNode2 = function() { return node2; };

  this.draw = function(ctx)
  {
    G.line(ctx,node1.getX(),node1.getY(), node2.getX(),node2.getY());
  };

  this.toString = function()
  {
    return "Edge: {node1: "+node1+", node2: "+node2+", angle1: "+(this.angle(node1)*180/Math.PI)+", angle2: "+(this.angle(node2)*180/Math.PI)+"}";
  };

  this.angle = function(n)
  {
    // return the angle of the edge at Node n
    if (n===node1) return angle1; else return angle2;
  };

  this.other_node = function(n)
  {
    if (n===node1) return node2; else return node1;
  };

  this.angle_to = function(e2, node, direction)
  {
    /* returns the absolute angle from this edge to "edge2" around
     "node" following "direction" */
    var a;

    if (direction===Const.CLOCKWISE)
      a=this.angle(node) - e2.angle(node);
    else
      a=e2.angle(node) - this.angle(node);

    if (a<0) return a+2*Math.PI; else return a;
  };


};


//======================================================================

var EdgeCoupleArray = (function()
{
  return function(nb_edges) {
    this.size = nb_edges;
    this.array = new Array(this.size);
    for (var i=0;i<this.size;i++) {
      this.array[i] = new Array(2);
      this.array[i][Const.CLOCKWISE] = 0;
      this.array[i][Const.ANTICLOCKWISE] = 0;
    }
  };
})();

EdgeCoupleArray.prototype = {
  getSize: function() { return this.size;  },
  getArray: function() { return this.array;  },
  toString: function() {
    var s=["EdgeCoupleArray"];
    for (var i=0;i<this.size;i++) {
      s.push(this.array[i][Const.CLOCKWISE]);
      s.push(this.array[i][Const.ANTICLOCKWISE]);
      s.push(",");
    }
    return s.join('');
  }
};




//======================================================================

var EdgeDirection = (function() {
  return function(newEdge, newDirection) {
    this.edge = newEdge;
    this.direction = newDirection;
  };
})();

EdgeDirection.prototype = {
  getEdge: function() { return this.edge; },
  setEdge: function(edge) { this.edge = edge; },
  getDirection: function() { return this.direction; },
  setDirection: function(direction) { this.direction = direction; },
  toString: function() { return "EdgeDirection {e: "+this.edge+", d:"+(this.direction===Const.ANTICLOCKWISE?"ANTICLOCKWISE":"CLOCKWISE")+"}"; }
};


//======================================================================


//function Graph(type,xmin,ymin,width,height,param1,param2) {
function Graph(params) {
  this.params = params;

  this.xmin = this.params.margin;
  this.ymin = this.params.margin;
  this.width = this.params.width - 2*this.params.margin;
  this.height = this.params.height - 2*this.params.margin;
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
    //    console.log("Adding: "+e+"\n");
  };

  this.add_node = function(node)
  {
    this.nodes.push(node);
    //    console.log("Adding: "+n+"\n");
  };
  switch (this.params.type) {
  case Graph.TYPE_POLAR:
    var nbp=this.params.nb_nodes_per_orbit | 0; // number of points on each orbit
    var nbo=this.params.nb_orbits | 0; // number of orbits
    var os = (this.width<this.height?this.width:this.height)/(2*nbo); // orbit height
    var o,p, row, col; // iterator indexes
    grid = new Array(1+nbp*nbo); // array of Node
    cx = this.width/2+this.xmin;
    cy = this.height/2+this.ymin; // centre

    this.add_node(grid[0]=new Node(cx,cy));

    for (o=0;o<nbo;o++)
      for (p=0;p<nbp;p++)
        this.add_node(grid[1+o*nbp+p]=new Node(cx+(o+1)*os*Math.sin(p*2*Math.PI/nbp),
                                          cy+(o+1)*os*Math.cos(p*2*Math.PI/nbp)));

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
    var edge_size=this.params.triangle_edge_size;
    var L=(this.width<this.height?this.width:this.height)/2.0; // circumradius of the triangle
    cx=(this.xmin+this.width/2.0); cy=(this.ymin+this.height/2.0); /* centre of the triangle */
    var p2x=(cx-L*Const.SQRT_3/2.0), p2y=(cy+L/2.0); /* p2 is the bottom left vertex */
    var nsteps=Math.floor(3*L/(Const.SQRT_3*edge_size)) | 0;
    grid = new Array((nsteps+1)*(nsteps+1));

    // create node grid
    for (row=0;row<=nsteps;row++)
      for (col=0;col<=nsteps;col++)
        if (row+col<=nsteps) {
          x=p2x+col*L*Const.SQRT_3/nsteps + row*L*Const.SQRT_3/(2*nsteps);
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

    step=this.params.kennicott_edge_size;
    var cluster_size=this.params.kennicott_cluster_size;
    size=this.width<this.height?this.height:this.width;
    nbcol=Math.floor((1+size/step)/2*2) | 0; //@@ was (int)((1+size/step)/2*2)
    nbrow=Math.floor((1+size/step)/2*2) | 0;
    grid = new Array(5*nbrow*nbcol);   /* there are 5 nodes in each cluster */

    /* adjust xmin and xmax so that the grid is centred */
    this.xmin+=(this.width-(nbcol-1)*step)/2;
    this.ymin+=(this.height-(nbrow-1)*step)/2;

    /* create node grid */
    for (row=0;row<nbrow;row++)
      for (col=0;col<nbcol;col++) {
        var ci=5*(row+col*nbrow);
        x=col*step+this.xmin;
        y=row*step+this.ymin;

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
    step = params.tgrid_edge_size | 0;
    size = this.width<this.height?this.height:this.width;

    // empirically, it seems there are 2 curves only if both
    // nbcol and nbrow are even, so we round them to even
    nbcol=Math.floor((2+size/step)/2*2); //@@ /2*2?
    nbrow=Math.floor((2+size/step)/2*2);
    // was: nbcol=(int)((2+size/step)/2*2);
    //      nbrow=(int)((2+size/step)/2*2);

    grid = new Array((nbrow*nbcol)|0);

    /* adjust xmin and xmax so that the grid is centered */
    this.xmin+=(this.width-(nbcol-1)*step)/2;
    this.ymin+=(this.height-(nbrow-1)*step)/2;

    /* create node grid */
    for (row=0;row<nbrow;row++)
      for (col=0;col<nbcol;col++) {
        x=col*step+this.xmin;
        y=row*step+this.ymin;
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
    var node3=new Node(100,100); this.add_node(node3);

    this.add_edge(new Edge(node1,node2));
    this.add_edge(new Edge(node2,node3));
    this.add_edge(new Edge(node3,node1));
  }
};



Graph.prototype.next_edge_around = function(node, edge_direction) {
  // find the next edge in the direction around node from edge
//console.log("Next edge around "+node+", "+edge_direction);
  var theNode = node;
  var theEdge = edge_direction.getEdge();
  var theDirection = edge_direction.getDirection();

  var angle, minangle=20;
  var next_edge, edgeCandidate;
  var edgesAroundNode = theNode.getEdges();
  for (var i=0;i<edgesAroundNode.length;i++) {
    edgeCandidate=edgesAroundNode[i];
    if (edgeCandidate != theEdge) {
      angle = theEdge.angle_to(edgeCandidate,theNode,theDirection);
      if (angle < minangle) {
        next_edge=edgeCandidate;
        minangle=angle;
      }
    }
  }
//console.log("Next edge around. redturning: "+next_edge);
  return next_edge;
};

Graph.prototype.draw = function(ctx)
{
  var i;
  ctx.strokeStyle = "rgb(0,0,0)";
  ctx.lineWidth=2;
  for (i=0;i<this.nodes.length;i++) this.nodes[i].draw(ctx);
  for (i=0;i<this.edges.length;i++) this.edges[i].draw(ctx);
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

Graph.TYPE_RANDOM=0;
Graph.TYPE_TGRID=1;
Graph.TYPE_TRIANGLE=2;
Graph.TYPE_POLAR=3;
Graph.TYPE_KENNICOTT=4;
Graph.TYPE_CUSTOM=5;





//====================================================================================

function Node(new_x, new_y)
{
  var x=new_x;
  var y=new_y;
  var edges = [];

  this.getX = function() { return x; };
  this.getY = function() { return y; };
  this.getEdges = function() { return edges; };
  this.setX = function(new_x) { x=new_x; };
  this.setY = function(new_y) { y=new_y; };
  this.setEdges = function(new_edges) { edges=new_edges; };

  this.draw = function(ctx)
  {
    G.circle(ctx, x, y, 4.0);
  };

  this.toString = function()
  {
    return "Node: {x:"+x+", y:"+y+"}";
  };

  this.add_edge = function(e)
  {
    edges.push(e);
  };
}

//================================================================================


// A Pattern is a set of closed curves that form a motif
function Pattern(new_g, new_shape1, new_shape2) {
  var splines = [];
  var shape1=new_shape1;
  var shape2=new_shape2;
  var graph=new_g;
  var ec=new EdgeCoupleArray(new_g.edges.length);

  this.getSplines = function() { return splines; };

  this.draw = function(ctx) {
//    ctx.strokeStyle = "red";
    for (var i=0;i<splines.length;i++) {
      ctx.strokeStyle="rgb("+randomInt(0,255)+","+randomInt(0,255)+","+randomInt(0,255)+")";
      splines[i].draw(ctx);
    }
  };

  this.toString = function() {
    var result="Pattern: { "+splines.length+" splines: [";
    for (var i=0;i<splines.length;i++) {
      result+=splines[i];
    }
    return result+"]}";
  };

  this.edge_couple_set = function(edgeDirection, value)
  {
    for (var i=0;i<graph.edges.length;i++)
      if (graph.edges[i]===edgeDirection.getEdge()) {
        ec.getArray()[i][edgeDirection.getDirection()]=value;
        console.log("setting edge_index "+i+" with dir: "+edgeDirection.getDirection()+" to "+value);
        console.log(ec.toString());
        return;
      }
  };

  // Add a cubic Bezier curve segment to a spline (s)
  this.addBezierCurve = function(s, node, edge1, edge2, direction)
  {
//    console.log("<addBezierCurve>"+s+" -- "+node+" -- "+edge1+" -- "+edge2+" -- "+direction+"</addBezierCurve>");
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

//    console.log("addBezierCurve(s :"+s+", node: "+node+", edge1: "+edge1+", edge2: "+edge2+", direction: "+direction);

    var x1=(edge1.getNode1().getX()+edge1.getNode2().getX())/2.0;
    var y1=(edge1.getNode1().getY()+edge1.getNode2().getY())/2.0;

    var x4=(edge2.getNode1().getX()+edge2.getNode2().getX())/2.0;
    var y4=(edge2.getNode1().getY()+edge2.getNode2().getY())/2.0;

    var alpha=edge1.angle_to(edge2,node,direction)*shape1;
    var beta=shape2;

    var i1x,i1y,i2x,i2y,x2,y2,x3,y3;

    switch(direction) {
    case Const.ANTICLOCKWISE:
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
    case Const.CLOCKWISE:
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
      console.log("Error in addBezierCurve: direction is neither CLOCKWISE nor ANTICLOCKWISE: "+direction);
    }
    //console.log("adding Bezier ("+x1+","+y1+" -- "+x2+","+y2+" -- "+x3+","+y3+" -- "+x4+","+y4+")");
    return s.add_segment(x1,y1,x2,y2,x3,y3,x4,y4);
  };


  this.next_unfilled_couple = function()
  {
    var ed=null; //EdgeDirection
    for (var i=0;i<ec.getSize();i++) {
      if (ec.getArray()[i][Const.CLOCKWISE]===0) {
        ed = new EdgeDirection(graph.edges[i], Const.CLOCKWISE);
        return ed;
      }
      else if (ec.getArray()[i][Const.ANTICLOCKWISE]===0) {
        ed = new EdgeDirection(graph.edges[i], Const.ANTICLOCKWISE);
        return ed;
      }
    }
    console.log("next_unfilled_couple: "+ed);
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

    while ((first_edge_direction=this.next_unfilled_couple())!==null) {
      // start a new loop

      s=new Spline(randomInt(100,255), randomInt(100,255), randomInt(100,255));

      current_edge_direction = new EdgeDirection(first_edge_direction.getEdge(),
                                                 first_edge_direction.getDirection());
      current_node=first_node=current_edge_direction.getEdge().getNode1();


      do {

//      console.log("current_edge_direction "+current_edge_direction);
//      console.log("current_node "+current_node);

        this.edge_couple_set(current_edge_direction, 1);
        next_edge = graph.next_edge_around(current_node,current_edge_direction);

//      console.log("next_edge "+next_edge);

        // add the spline segment to the spline
        var bez = this.addBezierCurve(s,current_node, current_edge_direction.getEdge(), next_edge, current_edge_direction.getDirection());

        // cross the edge
        current_edge_direction.setEdge(next_edge);
        current_node = next_edge.other_node(current_node);
        current_edge_direction.setDirection(1-current_edge_direction.getDirection());

//        console.log("current e_d: "+current_edge_direction);


      } while (current_node!==first_node ||
               current_edge_direction.getEdge()!==first_edge_direction.getEdge() ||
               current_edge_direction.getDirection()!==first_edge_direction.getDirection());
      if (s.getSegments().length>2) // spline is just one point: remove it
        splines.push(s);
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
//    console.log("new Spline: "+cssColorString)
//    ctx.strokeStyle=cssColorString;

  // accessors
  this.getSegments = function() { return segments; };
  this.getRed = function() { return _red; };
  this.getGreen = function() { return _green; };
  this.getBlue = function() { return _blue; };

  this.add_segment = function(x1, y1, x2, y2, x3, y3, x4, y4)
  {
    var bezier = new CubicBezierCurve(x1,y1,x2,y2,x3,y3,x4,y4);
    segments.push(bezier);
    return bezier;
  };

  this.value_at = function(t)
  {
    var si;
    var tt;
    var ss;
    si = Math.floor(t*segments.length);
    if (si==segments.length) si--;
//    console.log("out: "+si+", "+segments.length+", "+t+"\n");
    tt = t*segments.length - si;
    ss=segments[si];
    var pi=new PointIndex(ss.getX1()*(1-tt)*(1-tt)*(1-tt)+3*ss.getX2()*tt*(1-tt)*(1-tt)+3*ss.getX3()*tt*tt*(1-tt)+ss.getX4()*tt*tt*tt,
                          ss.getY1()*(1-tt)*(1-tt)*(1-tt)+3*ss.getY2()*tt*(1-tt)*(1-tt)+3*ss.getY3()*tt*tt*(1-tt)+ss.getY4()*tt*tt*tt,
                          si);
    return pi;
  };

  this.draw = function(ctx) {
    for (var i=0;i<segments.length;i++) {
      segments[i].draw(ctx);
    }
  };

  this.toString = function() {
    var s=[];
    for (var i=0; i<segments.length; i++) {
      s.push(segments[i].toString());
    }
    return "Spline: { "+segments.length+" segments ("+ s.join(",") +") }";

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


  this.draw = function(ctx) {
    G.circle(ctx, x1, y1, 2.0);
    G.circle(ctx, x2, y2, 2.0);
    G.circle(ctx, x3, y3, 2.0);
    G.circle(ctx, x4, y4, 2.0);
    G.line(ctx, x1,y1, x2,y2);
    G.line(ctx, x2,y2, x3,y3);
    G.line(ctx, x3,y3, x4,y4);
  };

  this.toString = function() {
    return "CubicBezierCurve { "+x1+","+y1+" = "+x2+","+y2+" = "+x3+","+y3+" = "+x4+","+y4+"}";

  };
}

//================================================================================

var G = {
    line: function(ctx,x1,y1, x2,y2) {
      // <http://processing.org/reference/line_.html>
      //  this.ctx.strokeStyle="rgb("+randomInt(0,255)+","+randomInt(0,255)+","+randomInt(0,255)+")";
      //  console.log("tracing line from ("+x1+","+y1+" to ("+x2+","+y2+")");
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.closePath();
      ctx.stroke();
    },
    circle: function(ctx, cx,cy,radius) {
      ctx.beginPath();
      ctx.arc(cx,cy,radius,0,2*Math.PI,false);
      ctx.closePath();
      ctx.stroke();
    }
};