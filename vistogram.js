//Example template which extends vis-module

//To run: 
//ex=new vistogram()
//ex.run()


var vistogram = visualizer.extend({

	testname: "one-dir-histogram",

	// check if the variable is continuous or discrete. if continuous, plot the density, if discrete, give the histogram

	constructor: function() {
		// Set up my ripl
		this.ripl = new ripl();
		this.insertHTML('metaContainer');
	},
	
	loadProgram: function() {
	    var ret, expr = NaN;
	    
	    //ret = this.ripl.clearTrace();
	    // expr='(flip 0.5)';
	    // ret = this.ripl.assume('g',expr);
	    //console.log('ASSUME RET:' + JSON.stringify(ret));
				
		//Here we basically put a reference for all the directives we need to report after continous inference. This is useful because it serves as a flag for the 'predicate' function to check the current state of engine. If directives for the current test are present in the trace, we just use these and report! No need to clear and re-run the program. 
		//This is done by synthetically inserting an ASSUME value with <name> as the test-name and <expr> as directive-id value of the thing we want to report

	    expr='2'; //4 is directive-ID for (PREDICT (positive-mammogram)) ... directive which we want to report! 
	    //	ret = this.ripl.assume(this.testname,expr);
	    //	console.log('ASSUME RET:' + JSON.stringify(ret));
	    var currentDirectives = [];
	    currentDirectives.push(expr); //adding it to list so that render function can use it
	    console.log('Current directives:' + currentDirectives);
	    return currentDirectives;
	},


	render: function() {
	    //custom graphics logic
	    //Now user can just loop through directives, and do this.report_value(directives[..]) at every time instance in animation to get data. That's it!
	    // Generate an Irwin–Hall distribution of 10 random variables.
	    	    
	    $('#metaContainer').html('');
	    var values = [];
	    var numMHiter = 100; // get this value from the slider
	    
	    if (document.getElementById("option1").checked){
		dirvar = 'isTricky';
            }
            else if (document.getElementById("option2").checked){
		dirvar = '(myCoin)';
            }
            else if (document.getElementById("option3").checked){
                dirvar = 'myCoinWeight';
	    }


	    for(i=0; i<numMHiter; i++){
	    	ret = this.ripl.predict(dirvar);
		console.log('PREDICT RET:' + JSON.stringify(ret)); 
		if (ret['val']){
	    	    values.push(1);
	    	} else {
	    	    values.push(0);
		}
		
		// }
		$('#metaContainer').html('');
		console.log(values);
		
		// A formatter for counts.
		var formatCount = d3.format(",.0f");
		
		var margin = {top: 50, right: 0, bottom: 50, left: 0},
		    width = 200,
			height = 300-margin.top;
		    
		    var x = d3.scale.linear()
			.domain([0, 1])
			.range([0, width]);
		    
		    // Generate a histogram using twenty uniformly-spaced bins.
		    var data = d3.layout.histogram()
			.bins(2)
			(values);
		    
		    var y = d3.scale.linear()
			.domain([0, d3.max(data, function(d) { return d.y; })])
			.range([height-100, 0]);
		    
		    var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(2);
		    
		    //var svg = d3.select("body").append("svg")
		    var svg = d3.select("#metaContainer").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    
		    var bar = svg.selectAll(".bar")
			.data(data)
			.enter().append("g")
			.attr("class", "bar")
			.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });
		    
		    bar.append("rect")
			.attr("x", 1)
			.attr("width", x(data[0].dx) - 1)
			.attr("height", function(d) { return height - y(d.y); });
		    
		    bar.append("text")
			.attr("dy", ".75em")
			.attr("y", 6)
			.attr("x", x(data[0].dx) / 2)
			.attr("text-anchor", "middle")
			.text(function(d) { return formatCount(d.y); });
		    
		    svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);
		    
		    svg.append("text")
			.attr("x", (width / 2))             
			.attr("y", 1 - (margin.top / 2))
			.attr("text-anchor", "middle")
			.attr("font","Courier")
			.style("font-size", "16px") 
			.style("text-decoration", "underline")  
			.text("OUTCOME DISTRIBUTION")
			
			}
	},
	

	run: function(directives) {
		//check engine status to see if this test is already running or not
		var active_directives = this.predicate(this.testname);

		active_directives = this.loadProgram();
		//if (active_directives == 'ERR') {
		//	console.log('\n--------- Nothing running on the Engine. Starting from scratch -------\n');
		//	active_directives = this.loadProgram();
		//}
		//else {
		//	console.log('\n------This example is currently running on the engine. No need to loadProgram. Can just send it to render for graphics ----------\n');
		//}
	
		//if continous inference is not on, turning it on
		ret = this.ripl.cont_infer_status();
		if (ret["status"] == "off") {
			ret = this.ripl.start_cont_infer(1);
			//alert(ret);
		}

		// this can be controlled by GUI elements on the webpage (use Jquery to access UI elements). User defines this
		this.render(active_directives);	
		console.log('\n Running Render [Report_directives on]:' + active_directives); 	
    
	},


		
	insertHTML: function() {
	    // $('div.'+divclass).innerHTML = ""
	    //if ( document.getElementById("graphicsContainer") != 'null' ){
	    //document.getElementById("graphicsContainer").innerHTML = "";
	    // }
	    //d/ocument.getElementById("graphicsContainer").innerHTML = "Test";
	    // $('#metaContainer').html('<table><tr><td style="vertical-align: top;"><div id="graphicsContainer" style="background-color: white; width: 600px; height: 300px;"></div></td><br></tr></table>');
	    
	}
	
	//('								\
	//<table><tr><td style="vertical-align: top;">			\
	//      <div id="graphicsContainer" style="background-color: white; width: 600px; height: 300px;"></div> \
	//      <br>							\
	//</tr>								\
	//</table>							\
	//');
	//}
	
	
    });



