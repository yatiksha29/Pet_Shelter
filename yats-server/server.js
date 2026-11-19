const express=require("express");
const fileupload=require("express-fileupload");
const mysql2=require("mysql2");  //package
const path = require("path");   // New Line
require("dotenv").config();    // NEW LINE

const app=express();

console.log("ENV:", process.env.DB_HOST, process.env.DB_USER, process.env.DB_NAME);

app.listen(2007,function()
{
    console.log("Server started at port:2007");
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads"))); //new line
//app.use(express.static("public"));

const configKuch={
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    dateStrings:true,
    timezone: process.env.DB_TIMEZONE
};

const mysql=mysql2.createConnection(configKuch); //connection object

mysql.connect(function(err)
{
    if(err==null)
    console.log("Connected Successfully");
    else
    console.log(err.sqlMessage);
});

//app.get("/",function(req,resp)
//{
//   const filePath=__dirname+ "/public/index.html";
//   resp.sendFile(filePath);
//})
app.get("/hello",function(req,resp)
{
    resp.send("Hi Programmers");
})


///////////// OWNER PAGE DETAILS 
// Home
app.get("/", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "index.html"));
});

// Owner dashboard
app.get("/dash-owner", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "dash-owner.html"));
});

// Owner Profile Information page
app.get("/ownerPro", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "owner-profile.html"));
});

// Shelter Profile Information page
app.get("/shelterPro", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "shelter-profile.html"));
});

// Search Shelter page (owner side)
app.get("/search-shelter", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "shelter-finder.html"));
});


// ---------- shelter-finder APIs ----------

// Cities ke naam dropdown ke liye
app.get("/Fetch-all-cities", function (req, resp) {
    let query = "select distinct city from sprofile";
    mysql.query(query, function (err, resTable) {
        if (err) {
            console.log(err);
            resp.status(500).send(err.message);
            return;
        }
        resp.send(resTable);
    });
});

// Selected city ke shelters
app.get("/fetch-shfinder-record", function (req, resp) {
    let city = req.query.citykuch;
    let query = "select * from sprofile where city=?";

    mysql.query(query, [city], function (err, resTable) {
        if (err) {
            console.log(err);
            resp.status(500).send(err.message);
            return;
        }
        resp.send(resTable);
    });
});

// shelter-profile ka Fetch button
app.get("/fetch-record", function (req, resp) {
    let em = req.query.emailKuch;
    let query = "select * from sprofile where emailid=?";

    mysql.query(query, [em], function (err, resTable) {
        if (err) {
            console.log(err);
            resp.status(500).send(err.message);
            return;
        }
        resp.send(resTable);
    });
});

// ------ Owner Profile -----
// OWNER PROFILE FETCH (Fetch Button)
app.get("/fetch-json-record", function (req, resp) {
    let em = req.query.emailKuch;          // JS se aa raha hai
    let query = "select * from oprofile where emailid=?";

    mysql.query(query, [em], function (err, resTable) {
        if (err) {
            console.log(err);
            resp.status(500).send(err.message);
            return;
        }
        resp.send(resTable);              // respJSONAry
    });
});

app.use(fileupload());
app.use(express.urlencoded({ extended: true }));

// SHELTER PROFILE SAVE
app.post("/ssave", function (req, resp) {

    let d = req.body;

    let idpic = "nopic.jpeg";
    let shelpic = "nopic.jpeg";

    if (!d.txtEmail) {
        resp.status(400).send("Email is missing. Please sign in again.");
        return;
    }

    let filesToSave = [];

    if (req.files && req.files.idpic) {
        idpic = d.txtEmail + "-" + req.files.idpic.name;

        filesToSave.push(
            req.files.idpic.mv(
                path.join(__dirname, "public", "uploads", idpic)
            )
        );
    }

    if (req.files && req.files.shelpic) {
        shelpic = d.txtEmail + "-" + req.files.shelpic.name;

        filesToSave.push(
            req.files.shelpic.mv(
                path.join(__dirname, "public", "uploads", shelpic)
            )
        );
    }

    Promise.all(filesToSave)
        .then(function () {

            let query = "insert into sprofile (emailid,name,contact,address,city,website,since,selpets,idpic,shelpic) values (?,?,?,?,?,?,?,?,?,?)";

            mysql.query(query, [
                d.txtEmail,
                d.txtName,
                d.txtCon,
                d.txtAdd,
                d.txtCity,
                d.txtWeb,
                d.txtSin,
                d.txtSel,
                idpic,
                shelpic
            ], function (err) {

                if (err) {
                    console.log(err);
                    resp.status(500).send(err.message);
                    return;
                }

                resp.send("Shelter Profile Saved Successfully");
            });
        })
        .catch(function (err) {
            console.log(err);
            resp.status(500).send("File upload failed: " + err.message);
        });
});


// SHELTER PROFILE UPDATE
app.post("/supdate", function (req, resp) {

    let d = req.body;

    if (!d.txtEmail) {
        resp.status(400).send("Email is missing. Please sign in again.");
        return;
    }

    let idpic = d.hdn || "nopic.jpeg";
    let shelpic = d.hdn1 || "nopic.jpeg";

    let filesToSave = [];

    if (req.files && req.files.idpic) {
        idpic = d.txtEmail + "-" + req.files.idpic.name;

        filesToSave.push(
            req.files.idpic.mv(
                path.join(__dirname, "public", "uploads", idpic)
            )
        );
    }

    if (req.files && req.files.shelpic) {
        shelpic = d.txtEmail + "-" + req.files.shelpic.name;

        filesToSave.push(
            req.files.shelpic.mv(
                path.join(__dirname, "public", "uploads", shelpic)
            )
        );
    }

    Promise.all(filesToSave)
        .then(function () {

            let query = "update sprofile set name=?,contact=?,address=?,city=?,website=?,since=?,selpets=?,idpic=?,shelpic=? where emailid=?";

            mysql.query(query, [
                d.txtName,
                d.txtCon,
                d.txtAdd,
                d.txtCity,
                d.txtWeb,
                d.txtSin,
                d.txtSel,
                idpic,
                shelpic,
                d.txtEmail
            ], function (err, result) {

                if (err) {
                    console.log(err);
                    resp.status(500).send(err.message);
                    return;
                }

                if (result.affectedRows === 1) {
                    resp.send("Shelter Profile Updated Successfully");
                } else {
                    resp.send("No existing shelter profile found. Please use Save first.");
                }
            });
        })
        .catch(function (err) {
            console.log(err);
            resp.status(500).send("File upload failed: " + err.message);
        });
});

// OWNER PROFILE SAVE
app.post("/osave", function (req, resp) {

    let d = req.body;

    let picname = "nopic.jpeg";
    if (req.files != null && req.files.ppic != null) {

        picname = d.txtEmail + "-" + req.files.ppic.name;
        const savePath = process.cwd() + "/public/uploads/" + picname;
        req.files.ppic.mv(savePath);
        console.log("Owner ppic uploaded");
    }

    let petType = "";

    if (Array.isArray(d.txtP)) {
        petType = d.txtP.join(",");
    }
    else {
        petType = d.txtP || "";
    }

    let query = "insert into oprofile(emailid,name,contact,address,city,ppic,ptype) values(?,?,?,?,?,?,?)";

    mysql.query(query, [
        d.txtEmail,
        d.txtName,
        d.txtCon,
        d.txtAdd,
        d.txtCity,
        picname,
        petType
        //d.txtP    // select multiple ka name="txtP"
    ], function (err, result) {

        if (err) {
            console.log(err);
            resp.send(err.message);
        }
        else {
            resp.send("Saved");
        }
    });
});

// OWNER PROFILE UPDATE
app.post("/oupdate", function (req, resp) {
    let d = req.body;

    let picname = d.hdnPic || "nopic.jpeg";   // hidden old pic
    if (req.files != null && req.files.ppic != null) {
        picname = d.txtEmail + "-" + req.files.ppic.name;
        const savePath = process.cwd() + "/public/uploads/" + picname;
        req.files.ppic.mv(savePath);
    }

    let petType = "";

    if (Array.isArray(d.txtP)) {
        petType = d.txtP.join(",");
    }
    else {
        petType = d.txtP || "";
    }

    let query = "update oprofile set name=?,contact=?,address=?,city=?,ppic=?,ptype=? where emailid=?";

    mysql.query(query, [
        d.txtName,
        d.txtCon,
        d.txtAdd,
        d.txtCity,
        picname,
        petType,
        d.txtEmail
    ], function (err, result) {

        if (err) {
            console.log(err);
            resp.send(err.message);
        }
        else if (result.affectedRows == 1) {
            resp.send("Updated");
        }
        else {
            resp.send("Invalid ID");
        }
    });
});


 
//------- Signup process ----------------
app.get("/signup-process",function(req,resp)
{
    console.log(req.query);

    let quali="";

    if(req.query.chkB!=undefined)
       quali=req.query.chkB+",";
    if(req.query.chkM!=undefined)
       quali+=req.query.chkM+",";
    if(req.query.chkBt!=undefined)
       quali+=req.query.chkBt;

    let visited=req.query.cityv;
    resp.send("Qualification="+quali+"  Occuptation="+req.query.city+"  Visited Cities="+visited);
})

//-------------URL handlers
//------------- SIGNUP ROUTE -------------

app.post("/signup", function (req, resp) {

    let em = req.body.emailKuch;
    let pwd = req.body.pwdKuch;
    let utype = req.body.utypeKuch;

    // Check duplicate email
    mysql.query(
        "select * from users where emailid=?",
        [em],
        function (err, resTable) {

            if (err) {
                console.log(err);
                resp.status(500).send(err.message);
                return;
            }

            if (resTable.length > 0) {
                resp.send("Email already registered");
                return;
            }

            // Insert new user
            let query = "insert into users (emailid,pwd,Utype,status) values(?,?,?,?)";

            mysql.query(
                query,
                [em, pwd, utype, 1],
                function (err, result) {

                    if (err) {
                        console.log(err);
                        resp.status(500).send(err.message);
                        return;
                    }

                    resp.send("Signup Successfully");
                }
            );

        }
    );

});

app.get("/signup-secure",function(req,resp)
{
    const filePath=__dirname+"/public/signup-secure.html";
    resp.sendFile(filePath);
    
})

//app.use(fileupload());
//app.use(express.urlencoded({extended:true}));
app.post("/signup-process-secure",function(req,resp)
{
    //resp.send("welcome:"+req.body.txtEmail);
    console.log(req.files);

    resp.contentType("text/html");
    if(req.files!=null && req.files.ppic!=null)
    {
        let filename=req.files.ppic.name;
        let filepath=process.cwd()+"/public/uploads/"+filename;
        req.files.ppic.mv(filepath);
        resp.write("  *Ppic Uplaoded Successfullyyyy<br>");
    }
    if(req.files!=null && req.files.proof!=null)
    {
        let filename=req.files.proof.name;
        let filepath=process.cwd()+"/public/uploads/"+filename;
        req.files.proof.mv(filepath);
        resp.write("  *Proof Uploaded Successfulyyyy <br>");
    }
    resp.write("Data Saved Successfully");
    resp.end(); 
});

/*app.post("signup-process-secure",function PreviewImage()
{
    var oFReader= new FileReader();
    oFReader.readAsDataURL(document.getElementById("uploadImage").files[0]);

    oFReader.onload=function(oFREvent) 
    {
     document.getElementById("uploadPreview").src=oFREvent.target.result;
    }
}); */

//------------------DATABASE Connectivity Code
app.get("/profile-front",function(req,resp)
{
    resp.sendFile(process.cwd()+"/public/profile-db.html");
})
// DATABASE PROFILE SAVE

///edit in this processs for update functionand change the update query below 
app.post("/db-profile-process",function(req,resp)
{
    const email=req.body.txtEmail;
    const dob=req.body.dob;

    let filename="nopic.jpeg";

    if(req.files!=null&& req.files.ppic != null)
    {
        filename=req.body.txtEmail+"-"+req.files.ppic.name;
        const path=process.cwd()+"/public/uploads/"+filename;
        req.files.ppic.mv(path);
        console.log("File Uploaded Successfullyy");
    }
   
    mysql.query("insert into profilesnov values(?,?,?,current_date())",[email,dob,filename],function(err)
    {
            if(err==null)
                resp.send("Records Saved Successfullyy");
            else
                resp.send(err.message);
    });
    
})

app.post("/db-profile-update",function(req,resp)
{
    const email=req.body.txtEmail;
    const dob=req.body.dob;
    let filename="";

    if(req.files!=null)
    {
        filename=req.body.txtEmail+"-"+req.files.ppic.name;
        const path=process.cwd()+"/public/uploads/"+filename;
        req.files.ppic.mv(path);
        console.log("File Uploaded Successfullyy");
    }
    else
    filename=req.body.hdn;
   
   mysql.query("update profilesnov set dob=?,ppic=? where emailid=?",[dob,filename,email],function(err,resTable)
    {
            if(err==null)
            {
                if(resTable.affectedRows==1)
                 resp.send("Record Updated Successfully");
                else
                 resp.send("Invalid ID");
            }
            else
                resp.send(err.message);
    });
    
})


app.post("/db-profile-delete",function(req,resp)
{
    const emailid=req.body.txtEmail;
    mysql.query("delete from profilesnov where emailid=?",[emailid],function(err,result)
    {
        if(result.affectedRows==1)
          resp.send("Deleted")  ;
        else
            resp.send("Invalid ID");
    })
})
app.post("/db-profile-showall",function(req,resp)
{
    mysql.query("select * from profilesnov",function(err,resTable)
    {
        resp.send(resTable);
    })
})

app.get("/chk-email",function(req,resp)
{
    let eml=req.query.emailkuch;
    mysql.query("select * from profilesnov where emailid=?",[eml],function(err,resTable){
        if(err)
        {
            resp.send(err.message);
            return;
        }
        if(resTable.length==1)
           resp.send("Already Taken");
        else
           resp.send("Not Taken, Available");
    })
})

app.get("/fetch-json-record",function(req,resp)
{
    let eml=req.query.emailKuch;
    mysql.query("select * from profilesnov where emailid=?",[eml],function(err,resTable)
    {
        if(err)
        {
            resp.send(err.message);
            return;
        }
        resp.send(resTable);
    });
})

// ------------- LOGIN ROUTE -------------
app.get("/login", function (req, resp) {

    let em  = req.query.emailKuch;
    let pwd = req.query.pwdKuch;

    console.log("LOGIN REQ:", em, pwd);

    // users table: emailid, pwd, Utype, status
    let query = "select * from users where emailid=? and pwd=? and status=1";

    mysql.query(query, [em, pwd], function (err, resTable) {

        console.log("LOGIN RESULT err:", err);
        console.log("LOGIN RESULT rows:", resTable);

        if (err) {
            resp.send(err.message);
            return;
        }

        if (resTable.length == 1) {
            let utype = resTable[0].Utype;   // column name exactly Utype hai

            if (utype === "Owner")
                resp.send("Owner");
            else if (utype === "Shelter")
                resp.send("Shelter");
            else
                resp.send("Unknown");
        } else {
            resp.send("Invalid Email or Password");
        }
    });
});

// CHECK OLD PASSWORD
app.get("/chkpwd", function (req, resp) {

    let email = req.query.emailkuch;
    let pwd = req.query.pwdkuch;

    let query = "select * from users where emailid=? and pwd=? and status=1";

    mysql.query(query, [email, pwd], function (err, resTable) {

        if (err) {
            resp.send("error");
            return;
        }

        if (resTable.length == 1)
            resp.send("valid");
        else
            resp.send("invalid");

    });
});


// UPDATE PASSWORD
app.post("/update-password", function (req, resp) {

    let email = req.body.changeEmail;
    let oldPass = req.body.changePass;
    let newPass = req.body.txtNew;
    let rePass = req.body.txtRe;

    if (newPass != rePass) {
        resp.send("Passwords do not match");
        return;
    }

    let query = "update users set pwd=? where emailid=? and pwd=? and status=1";

    mysql.query(query, [newPass, email, oldPass], function (err, result) {

        if (err) {
            resp.send(err.message);
            return;
        }

        if (result.affectedRows == 1)
            resp.send("Password Updated Successfully");
        else
            resp.send("Password Update Failed");

    });
});


