// Module to create HTTP server and API endpoint
const express = require('express');

// Server init
const app = express();

// Module to stamp HTTP packets with response time, for benchmarking
const responseTime = require('response-time');

// Module to parse and easily use CloudFoundry (CF) environment variables, e.g to connect to third-party services
const cfenv = require('cfenv');

// Module to manipulate SQL
const mysql = require('mysql');

// appEnv holds all the application's environment variables
const appEnv = cfenv.getAppEnv();

// a DB connection
let dbConn = null;

app.use(responseTime())

/* Simple endpoint */
app.get('/', function (req, res) {
  res.send('Hello World!')
})

/* Compte the fact of n */
app.get('/fact/:n', function (req, res) {
  var r = compute_fact(req.params.n);
  save_result(r);
  res.send('computed fact : ' + r + "<br>" + res_num + "<br>" + print_results())
})

/* Kill process ; used to show that the application will be automatically restarted by CF */
app.get('/kill', function (req, res) {
  return process.exit(22);
})

/* Drastically increase the app memory usage ; used to illustrate the auto-scaling feature when memory usage is above a specified payload */
app.get('/mem', function (req, res) {
  mam_arr = Array(1e7).fill("Lorem ipsum dolor sit amet");
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  res.send("Mem used : " + used + " MB"); 	
})

/* Initiate a DB connection */
app.get('/db/init', function (req, res) {
    if(dbConn){
	res.send("DB CONNECTION ALREADY EXISTING");
		
    } else {
		var r = create_conn();
		res.send("Creating connection : " + r);
    }  
})

/* Get values from the DB's table 'myvalues' */
app.get('/db/get', function (req, res) {
    if(dbConn){
	
		dbConn.query('SELECT * FROM myvalues', function (error, results, fields) {
			if (error) res.send(error);

			var res_str = "";
			results.forEach(function(el){
			res_str += el.value + ", ";
			});

			res.send(res_str.slice(0, -2));
		});
		
    } else {
		res.send("NO DATABASE CONNECTION");
    }
  
})

/* Add a value in the DB's table - sorry for the endpoint "semantic" -- in REST it should be a POST */
app.get('/db/set/:n', function (req, res) {
	if(dbConn){

		dbConn.query("INSERT INTO myvalues VALUES ('', " + req.params.n + " , '')", function (error, results, fields) {
			if (error) res.send(error);

			res.send(results);
		});
 
		
    } else {
		res.send("NO DATABASE CONNECTION");
    }
})

/* Print environment variables of the app */
app.get('/env', function (req, res) {
  res.send("<pre>" + JSON.stringify(appEnv, null, "\t") + "</pre>");
})

/* Makes the server listen to incoming request, using the default port for this application defined in the environment variables */
app.listen(process.env.PORT || 3000, function () {
  console.log('CF example app listening on port 3000!')
})


function compute_fact(n){
    var rval=1;
    for (var i = 2; i <= n; i++)
        rval = rval * i;
    return rval;
}

var last_results = [];
var res_num = 0;
var res_str;
let mem_arr;

function save_result(n){
    last_results.push(n);
    res_num++;
}

function print_results(){
    return last_results.toString();
}

/* Create connection to a databse. We use here a clearDB instance */
function create_conn(){
    if (dbConn) return "CONNECTION ALREADY CREATED";

    if (appEnv.services.cleardb){
		dbConn = mysql.createConnection(appEnv.services.cleardb[0].credentials.uri);
		dbConn.connect();
		return "DATABASE CONNECTION CREATED";
    } else {
		dbConn = null;
	return "ERROR CONNECTING DATABASE - NO DATABASE SERVICE";
    }
}


