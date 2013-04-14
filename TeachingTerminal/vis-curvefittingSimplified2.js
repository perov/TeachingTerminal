
// Global variable to save the last drawn curve (its object reference).
previousPolynomialCurve = undefined;

function InitializeDemo() {
  ripl = new ripl(); // Create a RIPL client object to communicate with the engine.
  ripl.clearTrace(); // Clear the engine state.
  
  // Define the generic model:
  noise_directive_id = ripl.assume('noise', '(* (beta 1 7) 50)')['d_id'];
  coefficients_directive_ids = new Array();
  coefficients_directive_ids[0] = ripl.assume('c0', '(normal 0.0 10.0)')['d_id'];
  coefficients_directive_ids[1] = ripl.assume('c1', '(normal 0.0 1.0)')['d_id'];
  ripl.assume('linear-function', '(lambda (x) (+ c0 (* c1 x)))');
  ripl.start_cont_infer(1); // Start the continuous ("infinite") inference.

  // Prepare the canvas in your browser.
  paper = Raphael($('#graphics_div')[0], 420, 420);
  background = paper.rect(0, 0, 420, 420).attr({fill: "white"});
  LabelPlot();
  
  all_points = new Object(); // Init a JavaScript dictionary to save current points.
  next_point_unique_id = 0;
  
  background.click(function(background_event) {
    // If user clicks on the plot, create a new point.
    var point = new Object();
    
    // Coordinates in the browser window:
    point.html_x = background_event.pageX - $('#graphics_div').offset().left;
    point.html_y = background_event.pageY - $('#graphics_div').offset().top;
    
    // "Mathematical" coordinates on the canvas (relative to the plot centre):
    point.plot_math_x = (point.html_x - (420 / 2)) / 20;
    point.plot_math_y = ((point.html_y - (420 / 2)) * -1) / 20;
    
    // Create and pretty a rectangle on the plot.
    point.rectangle = paper.rect(point.html_x, point.html_y - 2, 1, 5, 0);
    point.rectangle.attr("fill", "white");
    point.rectangle.attr("stroke", "red");
    point.rectangle.attr("stroke-width", "2.0");
    point.rectangle.attr("opacity", "0.5");
    point.circle = paper.circle(point.html_x, point.html_y, 2);
    point.circle.attr("fill", "white");
    point.circle.attr("stroke", "red");
    point.circle.attr("stroke-width", "2.0");
    // point.circle.attr("opacity", "0.5");
    
    // Send information about this data point to the engine.
    var observation_expression = '(normal (linear-function r[' + point.plot_math_x + ']) noise)';
    point.observation_id = ripl.observe(observation_expression, "r[" + point.plot_math_y + "]")['d_id'];
    point.unique_id = next_point_unique_id;
    
    // Save the point to the dictionary of all current points.
    all_points[point.unique_id] = point;
    point.rectangle.data("point_reference", point);
    point.circle.data("point_reference", point);
    next_point_unique_id++;
    
    point.rectangle.click(function(circle_event) {
      // If user clicks on the point, delete it.
      ripl.forget(this.data("point_reference").observation_id); // Remove it from the engine trace.
      delete all_points[this.data("point_reference").unique_id]; // Remove it from the dictionary of all current points.
      this.data("point_reference").circle.remove();
      this.remove(); // Remove the point from the paper.
    });
    point.circle.click(function(circle_event) {
      // If user clicks on the point, delete it.
      ripl.forget(this.data("point_reference").observation_id); // Remove it from the engine trace.
      delete all_points[this.data("point_reference").unique_id]; // Remove it from the dictionary of all current points.
      this.data("point_reference").rectangle.remove();
      this.remove(); // Remove the point from the paper.
    });
  });
  
  polyordersqueue = [];
  
  // Run first time the function GetAndDrawCurrentSample().
  // Next setTimeout(...) are being called in this function itself.
  // (FYI, setTimeout(..., msec) runs the function only once after X msec instead
  //  of setInterval(..., msec), which continuously runs the function each X msec.)
  setTimeout("GetAndDrawCurrentSample();", 1);
}

function GetAndDrawCurrentSample() {
  ripl.stop_cont_infer(); // Stop the continuous inference in order to get all necessary
                          // data from the engine from the *same* model state
                          // (i.e. from the *same sample*).
                        
  var reported_directives_before = ripl.report_directives();                        
  var church_code_str = "<b>Venture code:</b><br>";
  for (i = 0; i < reported_directives_before.length; i++) {
    church_code_str += reported_directives_before[i]["directive-expression"] + '<br>';
  }
  church_code_str = church_code_str.replace(/ /g, "&nbsp;");
  church_code_str = church_code_str.replace(/\(if/g, "(<font color='#0000FF'>if</font>");
  church_code_str = church_code_str.replace(/\(/g, "<font color='#0080D5'>(</font>");
  church_code_str = church_code_str.replace(/\)/g, "<font color='#0080D5'>)</font>");
  church_code_str = church_code_str.replace(/lambda/g, "<font color='#0000FF'>lambda</font>");
  church_code_str = church_code_str.replace(/list/g, "<font color='#0000FF'>list</font>");
  church_code_str = church_code_str.replace(/\>=/g, "<font color='#0000FF'>>=</font>");
  church_code_str = church_code_str.replace(/\+/g, "<font color='#0000FF'>+</font>");
  church_code_str = church_code_str.replace(/\*/g, "<font color='#0000FF'>*</font>");
  church_code_str = "<font face='Courier New' size='2'>" + church_code_str + "</font>";
  $("#church_code").html(church_code_str);
                          
  // Get the data from the current model state:
  current_noise = ripl.report_value(noise_directive_id)['val'];
  var coefficients = new Array();
  coefficients[0] = ripl.report_value(coefficients_directive_ids[0])['val'];
  coefficients[1] = ripl.report_value(coefficients_directive_ids[1])['val'];
  
  // Represent the noise level as points' radius.
  for (point_unique_id in all_points) {
    all_points[point_unique_id].rectangle.attr("x", all_points[point_unique_id].html_x);
    all_points[point_unique_id].rectangle.attr("y", all_points[point_unique_id].html_y - current_noise * 20);
    all_points[point_unique_id].rectangle.attr("width", 1);
    all_points[point_unique_id].rectangle.attr("height", current_noise * 20 * 2);
  }
  
  if (previousPolynomialCurve != undefined) {
    // Remove the previously drawn curve, if any.
    previousPolynomialCurve.remove();
  }
  
  // polyordersqueue.push(ripl.report_value(noise_directive_id)['val'])
  // PolynomialDegreesInfo = new Array;
  // var polydegreesinfo_size = 0;
  // for (key in polyordersqueue) {
    // if (PolynomialDegreesInfo[polyordersqueue[key]] != undefined) {
      // PolynomialDegreesInfo[polyordersqueue[key]]++;
    // } else {
      // PolynomialDegreesInfo[polyordersqueue[key]] = 1;
    // }
    // polydegreesinfo_size++;
  // }
  // if (polydegreesinfo_size > 100) { PolynomialDegreesInfo[polyordersqueue.shift()]--; polydegreesinfo_size--; }
  // for (i = 0; i <= 1; i++) {
    // if (PolynomialDegreesInfo[i] == undefined) {
      // PolynomialDegreesInfo[i] = 0;
    // }
    // document.getElementById('poly' + i).style.height = Math.round(100 * PolynomialDegreesInfo[i] / polydegreesinfo_size) + 'px'
    // console.log('poly' + i, Math.round(100 * PolynomialDegreesInfo[i] / polydegreesinfo_size))
  // }
  
  previousPolynomialCurve = DrawPolynomial(coefficients); // Draw polynomial on the paper (in the browser).
  ripl.start_cont_infer(1); // Switch on back continuous inference.
  setTimeout("GetAndDrawCurrentSample();", 1); // Run this function again after 1 msec.
}

// Calculate the function y = c0 + c1 * x.
function CalculatePolynomialValue(x, coefficients) {
  var result = coefficients[0];
  for (var i = 1; i < coefficients.length; i++) {
    result += coefficients[i] * Math.pow(x, i);
  }
  return result;
}

// Draw polynomial on the paper in the browser.
function DrawPolynomial(coefficients) {
  var step = 1;
  var plot_y = (420 / 2) - CalculatePolynomialValue(-10, coefficients) * 20;
  var line_description = "M-10 " + plot_y;
  var plot_x1 = 0;
  var plot_y1 = 0;
  var plot_x = 0;
  var plot_y = 0;
  for (var x = -12 + step; x <= 12; x = x + step) {
    plot_x = (420 / 2) + x * 20;
    plot_y = (420 / 2) - CalculatePolynomialValue(x, coefficients) * 20;
    plot_x1 = (420 / 2) + (x + step / 2) * 20;
    plot_y1 = (420 / 2) - CalculatePolynomialValue(x + step / 2, coefficients) * 20;
    line_description += "Q" + plot_x + " " + plot_y + " " + plot_x1 + " " + plot_y1;
  }
  var path_object = paper.path(line_description);
  return path_object;
}

// Marking up the canvas (just for user's convenience).
function LabelPlot() {
  var currentObject;
  for (var x = 0; x <= 400; x = x + (400) / 10) {
    currentObject = paper.path("M" + (x + 10) + " 0L" + (x + 10) + " 420");
    currentObject.attr("stroke-dasharray", "-");
    currentObject.attr("stroke-width", "0.2");
    currentObject = paper.path("M0 " + (x + 10) + "L420 " + (x + 10) + "");
    currentObject.attr("stroke-dasharray", "-");
    currentObject.attr("stroke-width", "0.2");

    currentObject = paper.text(x + 10, 15, "" + (((x / 40) - 5) * 2) + "");
    currentObject.attr("fill", "#aaaaaa");

    if (x != 0) {
      currentObject = paper.text(10, x + 10, "" + (((x / 40) - 5) * -2) + "");
      currentObject.attr("fill", "#aaaaaa");
    }
  }

  currentObject = paper.circle(420 / 2, 420 / 2, 2);
  currentObject = paper.text(420 / 2 + 20, 420 / 2, "(0; 0)");
  currentObject.attr("fill", "#aaaaaa");
}
