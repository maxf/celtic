import java.util.Vector;


public static int WIDTH=500;
public static int HEIGHT=500;


public static int CLOCKWISE=0;
public static int ANTICLOCKWISE=1;


class Edge {
  Node node1, node2;
  float angle1, angle2;

  public Edge(Node n1, Node n2) {
    node1=n1;
    node2=n2;
    angle1=atan2(node2.y - node1.y, node2.x - node1.x);
    if (angle1 < 0) angle1+=TWO_PI;
    angle2=atan2(node1.y - node2.y, node1.x - node2.x);
    if (angle2 < 0) angle2+=TWO_PI;
  }

  public void draw() {
    line(node1.x,node1.y, node2.x,node2.y);
  }

  public String toString() {
    return "Edge: "+node1.toString()+", "+node2.toString();
  }

  public float angle(Node n) {
    // return the angle of the edge at Node n
    if (n==node1) return angle1; else return angle2;
  }

  public Node other_node(Node n) {
    if (n==node1) return node2; else return node1;
  }

  public float angle_to(Edge e2, Node node, int direction)
  {
    /* returns the absolute angle from this edge to "edge2" around
       "node" following "direction" */
    float a;

    if (direction==CLOCKWISE)
      a=this.angle(node) - e2.angle(node);
    else
      a=e2.angle(node) - this.angle(node);

    if (a<0) return a+2*PI; else return a;
  }
}

//======================================================================

class EdgeCouple {
  int [][] array;
  int size;

  public EdgeCouple(int nb_edges) {
    array = new int[nb_edges][2];
    size=nb_edges;
  }
};
class EdgeDirection {
  Edge e;
  int d;
  public EdgeDirection(Edge e, int d) {
    this.e=e;
    this.d=d;
  }
};

class Graph {
  public static final int TYPE_POLAR=0;
  public static final int TYPE_TGRID=1;
  public static final int TYPE_KENNICOTT=2;
  public static final int TYPE_TRIANGLE=3;
  int type;
  Vector nodes;
  Vector edges;
  int xmin,ymin,width,height;

  public Graph(int type, float xmin, float ymin, float width, float height, float param1, float param2) {
    this.type=type;
    nodes=new Vector(100);
    edges=new Vector(100);
    float cx,cy,x,y,size;
    float SQRT_3 = (float)(1.73205080756887729352);
    Node grid[];
    int step,nbcol,nbrow;

    switch (type) {
    case Graph.TYPE_POLAR:
      int nbp=(int)param1; /* number of points on each orbit */
      int nbo=(int)param2; /* number of orbits */
      float os = (width<height?width:height)/(2*nbo); /* orbit height */
      grid = new Node[1+nbp*nbo];
      cx = width/2+xmin;
      cy=height/2+ymin; /* centre */

      add_node(grid[0]=new Node((float)cx,(float)cy));

      for (int o=0;o<nbo;o++)
        for (int p=0;p<nbp;p++)
          add_node(grid[1+o*nbp+p]=new Node(cx+(o+1)*os*sin(p*TWO_PI/nbp),
                                            cy+(o+1)*os*cos(p*TWO_PI/nbp)));

      /* generate edges */
      for (int o=0;o<nbo;o++)
        for (int p=0;p<nbp;p++) {
          if (o==0) /* link first orbit nodes with centre */
            add_edge(new Edge(grid[1+o*nbp+p],grid[0]));
          else /* liink orbit nodes with lower orbit */
            add_edge(new Edge(grid[1+o*nbp+p],grid[1+(o-1)*nbp+p]));
          /* link along orbit */
          add_edge(new Edge(grid[1+o*nbp+p], grid[1+o*nbp+(p+1)%nbp]));
        }
      break;

    case Graph.TYPE_TRIANGLE:
      float edge_size=param1;
      float L=(float)((width<height?width:height)/2.0); /* circumradius of the triangle */
      cx=(float)(xmin+width/2.0); cy=(float)(ymin+height/2.0); /* centre of the triangle */
      float p2x=(float)(cx-L*SQRT_3/2.0), p2y=(float)(cy+L/2.0); /* p2 is the bottom left vertex */
      int nsteps=(int)(3*L/(SQRT_3*edge_size));
      grid = new Node[(nsteps+1)*(nsteps+1)];

      /* create node grid */
      for (int row=0;row<=nsteps;row++)
        for (int col=0;col<=nsteps;col++)
          if (row+col<=nsteps) {
            x=p2x+col*L*SQRT_3/nsteps + row*L*SQRT_3/(2*nsteps);
            y=p2y-row*3*L/(2*nsteps);
            grid[col+row*(nsteps+1)]=new Node((float)x, (float)y);
            add_node(grid[col+row*(nsteps+1)]);
          }

      /* create edges */
      for (int row=0;row<nsteps;row++)
        for (int col=0;col<nsteps;col++)
          if (row+col<nsteps) {
            /* horizontal edges */
            add_edge(new Edge(grid[row+col*(nsteps+1)],grid[row+(col+1)*(nsteps+1)]));
            /* vertical edges */
            add_edge(new Edge(grid[row+col*(nsteps+1)],grid[row+1+col*(nsteps+1)]));
            /* diagonal edges */
            add_edge(new Edge(grid[row+1+col*(nsteps+1)],grid[row+(col+1)*(nsteps+1)]));
          }
      break;

    case Graph.TYPE_KENNICOTT:
      /* make a graph inspired by one of the motifs from the Kennicott bible */
      /* square grid of clusters of the shape  /|\
       *                                       ---
       *                                       \|/
       * cluster_size is the length of an edge of a cluster
       */
      step=(int)param1;
      float cluster_size=param2;
      size=width<height?height:width;
      nbcol=(int)((1+size/step)/2*2);
      nbrow=(int)((1+size/step)/2*2);
      grid = new Node[5*nbrow*nbcol];   /* there are 5 nodes in each cluster */

      /* adjust xmin and xmax so that the grid is centred */
      xmin+=(width-(nbcol-1)*step)/2;
      ymin+=(height-(nbrow-1)*step)/2;

      /* create node grid */
      for (int row=0;row<nbrow;row++)
        for (int col=0;col<nbcol;col++) {
          int ci=5*(row+col*nbrow);
          x=col*step+xmin;
          y=row*step+ymin;

          /* create a cluster centred on x,y */
          grid[ci  ]=new Node((float)x, (float)y);
          grid[ci+1]=new Node((float)(x+cluster_size), (float)y);
          grid[ci+2]=new Node((float)x, (float)(y-cluster_size));
          grid[ci+3]=new Node((float)(x-cluster_size), (float)y);
          grid[ci+4]=new Node((float)x, (float)(y+cluster_size));

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

      /* create inter-cluster edges */
      for (int row=0;row<nbrow;row++)
        for (int col=0;col<nbcol;col++) {
          if (col!=nbcol-1)
            /* horizontal edge from edge 1 of cluster (row, col) to edge 3
             * of cluster (row,col+1) */
            add_edge(new Edge(grid[5*(row+col*nbrow)+1],grid[5*(row+(col+1)*nbrow)+3]));
          if (row!=nbrow-1)
            /* vertical edge from edge 4 of cluster (row, col) to edge 2
             * of cluster (row+1,col) */
            add_edge(new Edge(grid[5*(row+col*nbrow)+4], grid[5*(row+1+col*nbrow)+2]));
        }

      break;

    case Graph.TYPE_TGRID:
      /* simple grid graph */
      step=(int)param1;
      size=(width<height?height:width);

      /* empirically, it seems there are 2 curves only if both
         nbcol and nbrow are even, so we round them to even */
      nbcol=(int)((2+size/step)/2*2);
      nbrow=(int)((2+size/step)/2*2);

      grid = new Node[nbrow*nbcol];

      /* adjust xmin and xmax so that the grid is centered */
      xmin+=(width-(nbcol-1)*step)/2;
      ymin+=(height-(nbrow-1)*step)/2;

      /* create node grid */
      for (int row=0;row<nbrow;row++)
        for (int col=0;col<nbcol;col++) {
          x=col*step+xmin;
          y=row*step+ymin;
          grid[row+col*nbrow]=new Node((float)x, (float)y);
          add_node(grid[row+col*nbrow]);
        }

      /* create edges */
      for (int row=0;row<nbrow;row++)
        for (int col=0;col<nbcol;col++) {
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
  }

  public void add_node(Node n) {
    nodes.addElement(n);
    //    System.out.println("Adding: "+n+"\n");
  }

  public void add_edge(Edge e) {
    edges.addElement(e);
    /* for each node n of e, add n to pointer e */
    e.node1.add_edge(e);
    e.node2.add_edge(e);
    //    System.out.println("Adding: "+e+"\n");
  }

  public Edge next_edge_around(Node n, EdgeDirection ed) {
    /* return the next edge after e around node n clockwise */
    float angle, minangle=20;
    Edge next_edge = ed.e, edge;
    for (int i=0;i<n.edges.size();i++) {
      edge=(Edge)n.edges.elementAt(i);
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

  public void draw() {
    for (int i=0;i<nodes.size();i++) ((Node)nodes.elementAt(i)).draw();
    for (int i=0;i<edges.size();i++) ((Edge)edges.elementAt(i)).draw();
  }

  public String toString() {
    String s="Graph: ";
    s+="\n- "+nodes.size()+" Nodes: ";
    for (int i=0;i<nodes.size();i++) s+=((Node)nodes.elementAt(i)).toString();
    s+="\n- "+edges.size()+" Edges: ";
    for (int i=0;i<edges.size();i++) s+=((Edge)edges.elementAt(i)).toString();
    return s;
  }

  public void rotate(float angle, float cx, float cy) {
    /* rotate all the nodes of this graph around point (cx,cy) */
    float c=cos(angle),s=sin(angle),x,y;
    Node n;
    for (int i=0;i<nodes.size();i++) {
      n=(Node)nodes.elementAt(i);
      x=n.x; y=n.y;
      n.x = (x-cx)*c-(y-cy)*s + cx;
      n.y = (x-cx)*s+(y-cy)*c + cy;
    }
  }



}

class Node {
  public float x,y;
  public Vector edges;

  public Node(float x, float y) {
    this.x=x;
    this.y=y;
    edges=new Vector();
  }

  public void draw() {
    arc(x, y, 10.0, 10.0, 0.0, TWO_PI);
  }

  public String toString() {
    return "Node: ("+x+","+y+")";
  }

  public void add_edge(Edge e) {
    edges.addElement(e);
  }
};

class Params {
  float curve_width, shadow_width;
  float shape1, shape2;
  float margin;

  int type; // one of Graph.TYPE_*
  float edge_size;
  float cluster_size; /* only used if type is kennicott */
  long delay;        /* controls curve drawing speed (step delay in microsecs) */
  long nsteps; /* only if triangle: number of subdivisions along the side */
  long nb_orbits;          /* only used if type is polar */
  long nb_nodes_per_orbit; /* only used if type is polar */

  float angle; /* angle of rotation of the graph around the centre */
};

class Pattern {
  float shape1, shape2;
  EdgeCouple ec;
  Graph graph;
  Vector splines;

  public Pattern(State t, Graph g, float shape1, float shape2) {
    this.shape1=shape1;
    this.shape2=shape2;
    this.graph=g;
    this.ec=new EdgeCouple(g.edges.size());
    this.splines=new Vector(10);
  }

  public void edge_couple_set(EdgeDirection ed, int value) {
    for (int i=0;i<graph.edges.size();i++)
      if ((Edge)graph.edges.elementAt(i)==ed.e) {
        ec.array[i][ed.d]=value;
        return;
      }
  }

  public void draw_spline_direction(Spline s,
                                    Node node, Edge edge1, Edge edge2,
                                    int direction)
  {
    float x1=(edge1.node1.x+edge1.node2.x)/2.0;
    float y1=(edge1.node1.y+edge1.node2.y)/2.0;

    /* P2 (x2,y2) is the middle point of edge1 */
    float x4=(edge2.node1.x+edge2.node2.x)/2.0;
    float y4=(edge2.node1.y+edge2.node2.y)/2.0;

    float alpha=edge1.angle_to(edge2,node,direction)*this.shape1;
    float beta=this.shape2;

    float i1x,i1y,i2x,i2y,x2,y2,x3,y3;

    if (direction == ANTICLOCKWISE) {
      /* I1 must stick out to the left of NP1 and I2 to the right of NP4 */
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
      /* I1 must stick out to the left of NP1 and I2 to the right of NP4 */
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


  EdgeDirection next_unfilled_couple()
  {
    EdgeDirection ed=null;
    for (int i=0;i<this.ec.size;i++) {
      if (this.ec.array[i][CLOCKWISE]==0) {
        ed = new EdgeDirection((Edge)this.graph.edges.elementAt(i), CLOCKWISE);
        return ed;
      }
      else if (this.ec.array[i][ANTICLOCKWISE]==0) {
        ed = new EdgeDirection((Edge)this.graph.edges.elementAt(i), ANTICLOCKWISE);
        return ed;
      }
    }
    return ed; // possibly null if no edge found
  }

  public void make_curves()
  {
    int i;
    Edge current_edge, first_edge, next_edge;
    Node current_node, first_node;
    int current_direction, first_direction;
    Spline s;
    EdgeDirection first_edge_direction, current_edge_direction;

    i=0;
    while ((first_edge_direction=next_unfilled_couple())!=null) {
      /* start a new loop */
      s=new Spline(int(random(100,255)), int(random(100,255)), int(random(100,255)));
      this.splines.addElement(s);

      current_edge_direction = new EdgeDirection(first_edge_direction.e,
                                                 first_edge_direction.d);
      current_node=first_node=current_edge_direction.e.node1;

      do {
        this.edge_couple_set(current_edge_direction, 1);
        next_edge = this.graph.next_edge_around(current_node,current_edge_direction);

        /* add the spline segment to the spline */
        this.draw_spline_direction(s,current_node, current_edge_direction.e, next_edge, current_edge_direction.d);

        /* cross the edge */
        current_edge_direction.e = next_edge;
        current_node = next_edge.other_node(current_node);
        current_edge_direction.d = 1-current_edge_direction.d;

      } while (current_node!=first_node ||
               current_edge_direction.e!=first_edge_direction.e ||
               current_edge_direction.d!=first_edge_direction.d);
      if (s.segments.size()==2) /* spline is just one point: remove it */
        this.splines.remove(this.splines.size()-1);
    }
  }
}

class Point {
  public float x,y;
  public Point(float x, float y) {
    this.x=x;
    this.y=y;
  }
}

class PointIndex {
  // Typically one point of a spline and the segment index of the spline that
  // the point is on
  public Point p;
  public int i;
  public PointIndex(float x, float y, int i) {
    p=new Point(x,y);
    i=i;
  }
}
class Spline {
  Vector segments; /* array of SplineSegment */
  int r, g, b;

  public Spline(int red, int green, int blue) {
    segments=new Vector(30);
    this.r=red;
    this.g=green;
    this.b=blue;
  }

  public void add_segment(float x1, float y1, float x2, float y2,
                          float x3, float y3, float x4, float y4) {
    segments.addElement(new SplineSegment(x1,y1,x2,y2,x3,y3,x4,y4));
  }

  public PointIndex value_at(float t) {
    int si;
    float tt;
    SplineSegment ss;
    si = floor(t*segments.size());
    if (si==segments.size()) si--;
    //    System.out.println("out: "+si+", "+this.segments.size()+", "+t);
    tt = t*this.segments.size() - si;
    ss=(SplineSegment)this.segments.elementAt(si);

    return new PointIndex(ss.x1*(1-tt)*(1-tt)*(1-tt)+3*ss.x2*tt*(1-tt)*(1-tt)+3*ss.x3*tt*tt*(1-tt)+ss.x4*tt*tt*tt,
                          ss.y1*(1-tt)*(1-tt)*(1-tt)+3*ss.y2*tt*(1-tt)*(1-tt)+3*ss.y3*tt*tt*(1-tt)+ss.y4*tt*tt*tt,
                          si);
  }

  public void draw() {
    //    System.out.println("=== spline ===");
    for (int i=0;i<segments.size();i++) {
      SplineSegment s= (SplineSegment)segments.elementAt(i);
      s.draw();
    }
  }
}

class SplineSegment {
  float x1,y1,x2,y2,x3,y3,x4,y4;
  public SplineSegment(float x1, float y1, float x2, float y2, float x3, float y3, float x4, float y4) {
    this.x1=x1; this.y1=y1;
    this.x2=x2; this.y2=y2;
    this.x3=x3; this.y3=y3;
    this.x4=x4; this.y4=y4;
  }

  public void draw() {
    arc(this.x1, this.y1, 2.0, 2.0, 0.0, TWO_PI);
    arc(this.x2, this.y2, 2.0, 2.0, 0.0, TWO_PI);
    arc(this.x3, this.y3, 2.0, 2.0, 0.0, TWO_PI);
    arc(this.x4, this.y4, 2.0, 2.0, 0.0, TWO_PI);
    line(this.x1,this.y1, this.x2,this.y2);
    line(this.x2,this.y2, this.x3,this.y3);
    line(this.x3,this.y3, this.x4,this.y4);
    //    System.out.println("segment: "+this.x1+","+this.y1+" = "+this.x2+","+this.y2+" = "+this.x3+","+this.y3+" = "+this.x4+","+this.y4);
  }


};




class State {
  float STEP=0.005;
  boolean showGraph;
  Pattern pattern;
  Graph graph;
  int width, height;
  int delay2;
  int reset;
  float t;

  Params params;
};

//===========================================================================

void myinit() {
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

  st.params.type=int(random(0,4));

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
      st.params.nb_orbits=int(random(2,11));
      st.params.nb_nodes_per_orbit=int(random(4,13));
      st.graph=new Graph(Graph.TYPE_POLAR,
                         st.params.margin,
                         st.params.margin,
                         WIDTH-2*st.params.margin,
                         HEIGHT-2*st.params.margin,
                         st.params.nb_nodes_per_orbit,
                         st.params.nb_orbits);
      break;
    }

  //  st.graph.rotate(st.params.angle,WIDTH/2,HEIGHT/2);
  st.pattern=new Pattern(st, st.graph, st.params.shape1, st.params.shape2);
  st.pattern.make_curves();
  st.t = 0.0;

  background(int(random(0,100)),int(random(0,100)),int(random(0,100)));

  //  if (st.pattern.splines.size()==1) {
    colorMode(HSB);
    start=color(int(random(0,256)), 200, 200);
    end=color(int(random(0,256)), 200, 200);
    //  }
  strokeWeight(st.params.curve_width);
  //  stroke(0,0,0);
  //  st.graph.draw();
  //  System.out.println(st.graph);
}

public static State st;
public static float t,t2;
public static Spline s;
public static PointIndex pi1, pi2, pi3, pi4;
public static color start, end;

void setup() {
  size(WIDTH, HEIGHT);
  stroke(0,0,0);
  smooth();
  myinit();
  t=0;
  //  st.graph.draw();
}

void draw() {
  float speed;
  color c;
  t2 = (t+st.STEP>1.0) ? 1.0 : t+st.STEP;

  //  System.out.println("t: "+t+", t2: "+t2);

  for (int i=0;i<st.pattern.splines.size();i++) {
    s=(Spline)st.pattern.splines.elementAt(i);
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

 void mousePressed() {
   myinit();
   t=0;
   loop();
 }

