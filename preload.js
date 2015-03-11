preload_complete = false;

progress_bar_full = 800;

simultaneous_load = 6; // how many items should we load at once?
default_simultaneous_load = simultaneous_load;
master_check_interval = 500;
empty_checks_before_throttle = 3; // how many times should it check if we're below the simultaneous load (to add new images to load) at the check interval before it bumps us down to loading fewer elements at once?
default_empty_checks_before_throttle = empty_checks_before_throttle;
current_empty_checks = 0;

loading_elements = 0;
loaded_elements = 0;
container = "#preload_container";

var timeout_id;

// patch in an endsWith function so we can check later
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}


notify_on_load = function(setup_id, autodelete){
	// autodelete keeps the DOM cleaner - maybe speeds things up for large loads
	img_item = $("img#" + setup_id);
	img_item.on('load', function(){
		console.log("loaded image " + setup_id);
		loaded_elements++;
		loading_elements--;
		//if (autodelete === true){
		img_item.remove()
		//}
	});
	
	img_item.on('error', function(){
		console.log("failed to load image " + setup_id);
		loaded_elements++;  // treat it like it succeeded - it can be loaded as needed or errors handled by the application we preload for
		loading_elements--;
		$("img#" + setup_id).remove()
	});
};

load_image = function(url, element_id){
	setup_id = "preload_" + element_id;
	$(container).append("<img src=\"" + url + "\" id=\"" + setup_id + "\" class=\"preload\">");
	notify_on_load(setup_id, true);
};

preload = function(urls, check_interval, container, json_tree) {
    // preloads a set of URLs provided in the urls parameter. If json_tree is provided, urls is ignored and populated with urls created from the json_tree, as parsed by json_tree_to_urls. JSON trees are JSON format nested structures where directories have an attribue "name" and an attribute "children" and the children attribute is other items with the "name" attribute. Files only have the "name" attribute.

    if (check_interval === undefined) {
        check_interval = 500;
    }
    if (container === undefined) {
        container = "#container";
    }

    if (urls === undefined && json_tree === undefined){
        console.log("Need either a list of URLs, or a JSON tree structure of files to load!");
    }

    if (json_tree !== undefined){
        urls = json_tree_to_urls(json_tree)
    }

	var total_elements = urls.length; // store that so we can reference it
	master_check_interval = check_interval;
	var element_ids = 0; // a counter we use to determine new IDs and where we are in the URLs to load
	
	console.log("Will check every " + master_check_interval + "ms");
	
	load_images = function(){
		new_this_time = 0;
		
		console.log("Attempting load!");
		
		while(loading_elements < simultaneous_load && element_ids < total_elements){  // if we have capacity to download things
			console.log("Loading new image - " + urls[element_ids]);
			load_image(urls[element_ids], element_ids);  // start a new image loading
			
			new_this_time++;
			loading_elements++;
			element_ids++;
		}
		
		console.log("Elements: " + total_elements + ", Current: " + element_ids + ", Loading: " + loading_elements + ", Loaded: " + loaded_elements);


		// Throttling follows!

        // Should we be going faster?
		if(simultaneous_load < default_simultaneous_load && new_this_time !=0 && current_empty_checks == 0){  // if we've throttled_back at some point and we loaded one this time AND last time, then maybe we're doing alright - move the load up
			console.log("Increasing throttle for speedy loading. Current simultaneous download limit is " + simultaneous_load);
			simultaneous_load++;  // allow more to come down at once
			empty_checks_before_throttle--; // but also check a little more frequently
		}

        // Track whether we got anything this time to know if we should be going slower
		if(simultaneous_load > 1 && new_this_time == 0){  // if we can reduce the load still and we didn't add any new images this time around, then note that
			console.log("Couldn't add new image - queue full");
			current_empty_checks++;
		}else if(new_this_time != 0){  // otherwise, note that we loaded a new image this time by setting the counter to 0;
			console.log("Image loaded - clearing counter");
			current_empty_checks = 0;
		}

        // Or should we be going slower?
		if(simultaneous_load > 1 && current_empty_checks == empty_checks_before_throttle){
			console.log("Throttling back for repeated inability to load new images. Current simultaneous download limit is " + simultaneous_load);
			simultaneous_load--;  // reduce the number of images to load at once
			empty_checks_before_throttle++; // but also wait longer before throttling because we now have further to go 
		}
	
		//do it again while there's still content to download
		if((loaded_elements + loading_elements) < total_elements){
			timeout_id = window.setTimeout(load_images, master_check_interval);
		}else{
			console.log("All done!")
			$(container).show();
			preload_complete = true;
		}
		
		SetPercent(loaded_elements+loading_elements, total_elements);
	};
	
	// call it the first time
	timeout_id = window.setTimeout(load_images, master_check_interval);
};

json_tree_to_urls = function(json_tree, base_path){
    // takes a JSON tree where it's a list of objects with names and children and turns them into full URLs relative to the root

    var urls = [];

    new_base_path = json_tree.name;  // base_part of the path
    if (base_path !== undefined) {
        base_path += new_base_path;
    }else{
        base_path = new_base_path;
    }

    if (base_path !== undefined && !(base_path.endsWith("/"))){
        base_path += "/";
    }

    if(json_tree.children !== undefined) {
        for (var i = 0; i < json_tree.children.length; i++) {
            urls.push(base_path + json_tree.children[i].name);
            urls = urls.concat(json_tree_to_urls(json_tree.children[i], base_path));
        }
    }

    return urls;
};


function SetPercent(current, total){

	percent = (current / total);
	p_bar_width = percent * progress_bar_full;
	percent = Math.round(percent*1000000)/10000;
	megaround = Math.round(percent*10)/10;
	document.getElementById('progress_percent').innerHTML = megaround + "%";
	document.getElementById('currentProgress').style.width = p_bar_width + "px";
}