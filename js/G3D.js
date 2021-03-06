/*jslint devel: true, browser: true, maxerr: 50, indent: 2 */
var THREE, G3D = {
  line: function (scene, x1, y1, z1, x2, y2, z2, color) {
    "use strict";

    var
      radiusTop = 10,
      radiusBottom = 10,
      height =  Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1)),
//      cylinderMaterial = new THREE.MeshBasicMaterial({color : color || 0xAAAACC, wireframe: true}),
      cylinderMaterial = new THREE.MeshLambertMaterial({color : color || 0xAAAACC}),
      segmentsRadius = 10,
      segmentsHeight = 5,
      openEnded = false,
      cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segmentsRadius, segmentsHeight, openEnded), cylinderMaterial);

    cylinder.position.x = (x1 + x2) / 2;
    cylinder.position.y = (y1 + y2) / 2;
    cylinder.position.z = (z1 + z2) / 2;
    cylinder.rotation.x = (y2 === y1) ? 0 : Math.atan((z2 - z1) / (y2 - y1));
    cylinder.rotation.z = (x2 === x1) ? 0 : Math.PI / 2 + Math.atan((y2 - y1) / (x2 - x1));

    scene.add(cylinder);

//    console.log("adding cylinder: (" + x1 + "," + y1 + "," + z1 + " /  " + x2 + "," + y2 + "," + z2  + ")");
//    console.log("height: " + height);
//    console.log("rx: " + cylinder.rotation.x);
//    console.log("ry: " + cylinder.rotation.y);
  },

  add_sphere: function (scene, cx, cy, cz, radius) {
    "use strict";

    var
      segments = 16,
      rings = 16,
      sphereMaterial = new THREE.MeshLambertMaterial({color : 0xCC0000}),
      sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, rings), sphereMaterial);

    sphere.position.x = cx;
    sphere.position.y = cy;
    sphere.position.z = cz;
    scene.add(sphere);

//    console.log("adding sphere: (" + cx + "," + cy + "," + cz + " /  " + radius + ")");
  }
};
