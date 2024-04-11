var express=require("express"); // express module used to create flexible webapplication
var session=require("express-session"); // express-session module used to implement session
var multer = require('multer'); // multer module used to upload file 
var fs=require('fs'); //fs module used to unlink video file after delete or update
//var con=require("database");
var app=express();

const mysql=require("mysql");

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "video_streaming"
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "CREATE TABLE IF NOT EXISTS User (id int primary key auto_increment, name VARCHAR(50), email VARCHAR(150), contact VARCHAR(10), password VARCHAR(10))";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });
    var sql = "CREATE TABLE IF NOT EXISTS Videos (id int primary key auto_increment, name VARCHAR(50), path TEXT)";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });
    var sql = "CREATE TABLE IF NOT EXISTS VideoComment (id int primary key auto_increment,uid INT, vid INT, review VARCHAR(250), rate INT)";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });
  });

// Define multer storage
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
      // Specify the destination folder
      callback(null, 'assets/uploads');
    },
    filename: function(req, file, callback) {
      // Specify the file name
      callback(null, file.originalname);
    }
});

app.use(express.json());       
app.use(express.urlencoded({extended: true})); 

app.use(express.static('assets'))
app.use("/css",express.static(__dirname+"assets/css"))
app.use("/img",express.static(__dirname+"assets/img"))
app.use("/js",express.static(__dirname+"assets/js"))
app.use(session({
    secret:'weblession',
    resave:true,
    saveUninitialized:true
}));

//Set views
app.set("views","./views")
app.set("view engine","ejs")

app.get('/',function(req,res){
    //res.sendFile(__dirname+'/views/index.html',{text:"hello"});
    //res.render("index",{session:req.session});
    var sql = `SELECT * FROM Videos`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        if(result.length>0){
            //req.session.user=result[0].name;
            //res.redirect("/");
            res.render("index",{session:req.session,data:result});
        }
    });
});

app.get('/login',function(req,res){
    res.render("login")
});

app.get('/registration',function(req,res){
    res.render("registration",)
});

app.get('/logout',function(req,res){
    req.session.destroy();
    res.redirect("/login");
});

app.get('/videoUpload',function(req,res){
    res.render("videoUpload",{session:req.session});
});

app.get('/GamingVideoConsole',function(req,res){
  var sql = `SELECT * FROM Videos`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        if(result.length>0){
            req.session.user_id=result[0].name;
            //res.redirect("/");
            res.render("GamingVideoConsole",{session:req.session,data:result});
        }
        else
            res.redirect("/login");
    });
});

app.get('/singleVideo',function(req,res){
  var id=req.query.id;
  var sql = `SELECT * FROM Videos where id="${id}"`;
  console.log(sql);
    con.query(sql, function (err, result) {
        if (err) throw err;
        if(result.length>0){
            req.session.user_id=result[0].name;
            var sqlselComment=`SELECT id,(SELECT name FROM user where id=videocomment.uid) as name,vid,review,rate FROM videocomment where vid="${id}"`;
            console.log(sqlselComment)
            con.query(sqlselComment,function(error, rows){
              if (error) throw error;
              if(result.length>0){
                req.session.user_id=result[0].name;
                res.render("singleVideo",{session:req.session,data:result,review_data:rows});
              }
            });
            //res.render("SingleVideo",{session:req.session,data:result});
        }
        else
            res.redirect("/");
    });
    //res.render("singleVideo",{session:req.session,data:req.body.id});
});

/*Admin Panel Pages */
app.get('/AdminDashboard',function(req,res){
  if(req.session.user=="Admin"){
  res.render("AdminDashboard",{session:req.session});
  }
  else
    res.redirect("/login");
});

app.get('/viewUser',function(req,res){
  if(req.session.user=="Admin"){
  var sql = `SELECT * FROM User`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        if(result.length>0){
            res.render("viewUser",{session:req.session,data:result});
        }
    });
  }
  else
    res.redirect("/login");
});

app.get('/viewReviewRate',function(req,res){
  if(req.session.user=="Admin"){
  var sql = `SELECT id,(SELECT name FROM user where id=videocomment.uid) as name,(SELECT name FROM Videos where id=videocomment.vid) as video,review,rate FROM videocomment`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        if(result.length>0){
            res.render("viewReviewRate",{session:req.session,data:result});
        }
    });
  }
  else
    res.redirect("/login");
});

app.get('/deleteReviewRate',function(req,res){
  var id=req.query.id;
  var sql = `DELETE FROM videocomment WHERE id="${id}"`;
    con.query(sql, function (err, output) {
        if (err) throw err;
        res.redirect("/viewReviewRate");
    });
});

app.get('/viewVideo',function(req,res){
  if(req.session.user=="Admin"){
  var sql = `SELECT * FROM Videos`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        if(result.length>0){
            res.render("viewVideo",{session:req.session,data:result});
        }
        else{
          res.redirect("/videoUpload");
        }
    });
  }
  else
    res.redirect("/login");
});

app.get('/updateVideo',function(req,res){
  if(req.session.user=="Admin"){
  var id=req.query.id;
  var sql = `SELECT * FROM Videos where id="${id}"`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        if(result.length>0){
            res.render("updateVideo",{session:req.session,data:result});
        }
    });
  }
  else
    res.redirect("/login");
});

app.get('/deleteVideo',function(req,res){
  var id=req.query.id;
  var path=req.query.path;
  var sql = `DELETE FROM Videos WHERE id="${id}"`;
    con.query(sql, function (err, output) {
        if (err) throw err;
        fs.unlinkSync("assets/"+path);
        res.redirect("/viewVideo");
    });
});

app.post('/registration',function(req,res,next){
    var name=req.body.username;
    var email=req.body.email;
    var contact=req.body.contact;
    var password=req.body.password;
    var sql = `INSERT INTO User (name, email, contact, password) VALUES ("${name}","${email}","${contact}","${password}")`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
    res.redirect("/login")
});

app.post('/login',function(req,res,next){
    var email=req.body.email;
    var password=req.body.password;
    if(email=="Admin" && password=="Admin@123"){
      req.session.user=email;
      res.redirect("/AdminDashboard");
    }
    else{
      var sql = `SELECT * FROM User where email="${email}" AND password="${password}"`;
      con.query(sql, function (err, result) {
          if (err) throw err;
          if(result.length>0){
              req.session.user_id=result[0].name;
              req.session.user=email;
              res.redirect("/");
          }
          else
              res.redirect("/login");
      });
    }
});

// Create multer instance
var upload = multer({ storage: storage });

// Define upload route
app.post('/videoUpload', upload.single('file'), function(req, res) {
  // Get the file name and path
  var fileName = req.file.originalname;
  //var filePath = req.file.path;
  var filePath = "/uploads/"+req.file.originalname;

  // Insert the file name and path into mysql table
  var sql = 'INSERT INTO Videos (name, path) VALUES (?, ?)';
  var values = [fileName, filePath];
  con.query(sql, values, function(err, result) {
    if (err) throw err;
    console.log('File name and path inserted into mysql');
  });
  res.redirect("/viewVideo");
});

app.post('/singleVideo',function(req,res,next){
  var email=req.body.email;
  var comment=req.body.comment;
  var rate=req.body.rate;
  var vid=req.body.vid;
  var sql = `SELECT * FROM Videos where id="${vid}"`;
  console.log(sql);
  con.query(sql, function (err, result) {
    if (err) throw err;
    if(result.length>0){
      var sqlsel = `SELECT * FROM User where email="${email}"`;
      con.query(sqlsel, function (err, rest) {
        if (err) throw err;
        if(rest.length>0){
          var sql = `INSERT INTO videocomment (uid,vid,review,rate) VALUES ("${rest[0].id}","${vid}","${comment}","${rate}")`;
          con.query(sql, function (err1, resins) {
            if (err1) throw err1;
            var sqlselComment=`SELECT id,(SELECT name FROM user where id=videocomment.uid) as name,vid,review,rate FROM videocomment where vid="${vid}"`;
            con.query(sqlselComment,function(error, rows){
              if (error) throw error;
              if(rows.length>0){
                req.session.user_id=result[0].name;
                res.render("singleVideo",{session:req.session,data:result,review_data:rows});
              }
            });
          });
        }
      });
    }
  });
});

// Create multer instance
var update_upload = multer({ storage: storage });

// Define upload route
app.post('/updateVideo', update_upload.single('file'), function(req, res) {
  var id=req.body.id;
  var path=req.body.path;
  // Get the file name and path
  var fileName = req.file.originalname;
  //var filePath = req.file.path;
  var filePath = "/uploads/"+req.file.originalname;
  fs.unlinkSync("assets"+path);
  // Insert the file name and path into mysql table
  var sql = 'UPDATE Videos set name=?, path=? WHERE id=?';
  var values = [fileName, filePath,id];
  con.query(sql, values, function(err, result) {
    if (err) throw err;
    console.log('File name and path inserted into mysql');
  });
  res.redirect("/viewVideo");
});

// Server setup 
app.listen(3000, () => { 
    console.log("Server is Running") 
}) 
