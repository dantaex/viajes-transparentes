/*
* yet another...
* Flow Control !
* made by @dantaex on March 2014
*
* Disclaimer 
*	I made this in 30 minutes, I was nearly drunk
*	so don't trust this, I barely tested it.
*
* Usage
*   var fc = require('flowcontrol');
*   var mylist = [{...},...,{...}];
*
*	var applyThisToEachElement = function(item,callback{
*		//do your stuff
*		...
*		//say i'm done
*		callback(err,newdata);	
*	};
*
*   fc.taskList( mylist, applyThisToEachElement, function(err,result){ console.log('Everything done, results in result var');  });
*   //or
*   fc.taskMap( mylist, applyThisToEachElement, function(err,result){ console.log('Everything done, results in result var');  });
*   //or
*   fc.taskChain( mylist, applyThisToEachElement, function(err,result){ console.log('Everything done, results in result var');  });
*	
*	
*/


/**
* @constructor
*/
function FlowControl(){}
/**
* Execute a function over an input list, no matter:
*  Order of execution
*  Order of output
*  {f} Concurrecny limit
*
* @param {items} Array[] : input list
* @param {f} Function : this is the functon to be applied to each item in the input list, 
*	called as f(current_item,callWhenDone,items.length)
* @param {callback} Function : called as callback(errorlist) or callback(null,resultList)
* @param {mergeArrayResults} boolean : There are certain moments when you have
*	an array as a result of every f() execution, in this case you may end with
*	something like this as final result:
*    [   [{name:'a'},{name:'b'}], [{name:'c'}], [{name:'d'}], ...    ]
* 	but you may want all of those results in a single array like this 
*    [   [{name:'a'},{name:'b'},{name:'c'},{name:'d'} ... ]
* 	so you can say mergeArrayResults
*/
FlowControl.prototype.taskList = function(items,f,callback,mergeArrayResults){
	var notFinished = items.length,
		errrors = [],
		results = [];

	function verifier(err,data){
		if(err)	errrors.push(err);	
		else if(data){
			if(data instanceof Array && mergeArrayResults){
				results = results.concat(data);
			}
			else
				results.push(data);
		} 
		
		if( --notFinished == 0 ){
			if(errrors.length > 0) callback(errors);
			else callback(null,results);
		} 
	}

	for (var i = items.length - 1; i >= 0; i--)
		f(items[i],verifier,results.length);
};


/**
* Execute a function over an input list, if you don't care about:
*  Order of execution
*  {f} Concurrecny limit
* 
* But you need each output value to be stored in the same index of its corresponding input
*
* @param {items} Array[] : input list
* @param {f} Function : called f(current_item,callWhenDone,items.length)
* @param {callback} Function : called as callback(errorlist) or callback(null,resultList)
*/
FlowControl.prototype.taskMap = function(items,f,callback){
	var notFinished = items.length,
		errrors = [],
		results = [];

	function wrapper(i,item){
		f(item,function(err,data){
			if(err)	errrors.push(err);	
			else results[i] = data;
			
			if( --notFinished == 0 ){
				if(errrors.length > 0) callback(errors);
				else callback(null,results);
			} 
		},results.length);
	}

	for (var i = items.length - 1; i >= 0; i--)
		wrapper(i,items[i]);
};


/**
* Execute a function over an input list, if you care about:
*  Order of execution
*  {f} Concurrecny limit
* Each execution comes exactly after the last one finishes
*
* @param {items} Array[] : input list
* @param {f} Function : called f(current_item,callWhenDone,items.length)
* @param {callback} Function : called as callback(errorlist) or callback(null,resultList)
* @param {acceptnull} boolean : Accept null results (default false)
* @param {mergeArrayResults} boolean : There are certain moments when you have
*	an array as a result of every f() execution, in this case you may end with
*	something like this as final result:
*    [   [{name:'a'},{name:'b'}], [{name:'c'}], [{name:'d'}], ...    ]
* 	but you may want all of those results in a single array like this 
*    [   [{name:'a'},{name:'b'},{name:'c'},{name:'d'} ... ]
* 	so you can say mergeArrayResults
*/
FlowControl.prototype.taskChain = function(items,f,callback,acceptnull,mergeArrayResults){
	if(items == undefined){
		return callback(null,[]);
	}

	var nitems = items.slice(),
		errors = [],
		results = [];

	function next(item){
		if( item == undefined ){
			if(errors.length > 0) callback( errors );
			else callback( null, results );
		} else {
			f(item,function(err,data){
				if(err) errors.push(err);
				else{
					if(acceptnull || data != null)
						if(data instanceof Array && mergeArrayResults){
							results = results.concat(data);
						}
						else
							results.push(data);
				} 
				next(nitems.shift());
			},results.length);
		}
	}
	next(nitems.shift());
};

module.exports = new FlowControl();