const express = require("express");
const router = express.Router();
const multer = require("multer");
const Teams = require("../models/Teams");
var jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");
const checkteamleaderlimit=require('../middlewares/checkteamleaderlimit');
const fetchteamlead=require('../middlewares/fetchteamlead');
const fetchteammmember=require('../middlewares/fetchteammember');
const TeamMember = require("../models/TeamMember");
const checkpslimit =require('../middlewares/checkpslimit')
const checkteammemberlimit=require('../middlewares/checkteammemberlimit')

const PSsubmission = require("../models/PSsubmission");
const JWT_SECRET = "Souvikisagoodboy";

//upload image
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./uploads"); //we need to create the directory
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("file1");

//routes
router.get("/", (req, res) => {
    user_id = [0];
    res.render("index", { user_id });
});
//problem statement submission
router.get("/teamsadd/:id", auth, checkteamleaderlimit,(req, res) => {
    const user_id = req.params.id;
    res.render("TeamLeader", { user_id });
});

router.post("/teamsadd/:id", auth,checkteamleaderlimit, async(req, res) => {
    const id = req.params.id;

    const {
        teamname,
        teamleadername,
        phone,
        email,
        whatsappnumber,
        institution,
    } = req.body;

    if(!teamname || !teamleadername || !phone || !email || !whatsappnumber || !institution){
        req.flash('message','please provide the correct credentials')
        req.flash('type','danger')
        res.redirect(`/get_team_member_details/${id}`)
    }
    else{
    try {
        let team = await Teams.findOne({ email: req.body.email });
        if (team) {
            return res
                .status(400)
                .json({ success: "True", message: "Please enter a valid email" });
        }
        team = await Teams.create({
            teamid: id,
            teamname,
            teamleadername,
            phone,
            email,
            institution,
            whatsapp: whatsappnumber,
        });
        await team.save();
        const data = {
            team: {
                id: team.teamid,
            },
        };
        res.redirect(`/get_team_member/${team.teamid}`);
    } catch (error) {
        console.log("error.messagehghjghj");
        console.log(error);
        res.json({ error });
    }
}
});

//TeamMember information submission

router.post("/add_team_member/:id", auth,fetchteamlead,checkteammemberlimit,async(req, res) => {
    const id = req.params.id;
    try {
        const { name1, branch1, emailid1, phone1 } = req.body;
        if(!name1 || !branch1 || !phone1 || !emailid1 ){
            req.flash('message','please provide the correct credentials')
            req.flash('type','danger')
            res.redirect(`/get_team_member_details/${id}`)
        }
        else{
        let teammember = await TeamMember.findOne({ emailid1 });
        if (teammember) {
            success = false;
            req.flash('message','This Emails is already used . Please provide different email');
            req.flash('type','danger');
            res.redirect(`/get_team_member_details/${id}`)
        }
   else{
        teammember = new TeamMember({
            name1,
            branch1,
            emailid1,
            phone1,
            teamId: id,
        });
        const savedteammember = await teammember.save();
    
        res.redirect(`/get_team_member_details/${id}`);
    }
}
    } catch (error) {
        console.log(error.message);
       req.flash('message',error.message);
       req.flash('type','danger');
       res.redirect(`/get_team_member_details/${id}`);
    }

});

router.get("/add_team_member/:id",fetchteamlead,checkteammemberlimit, auth,(req, res) => {
    const id = req.params.id;
    res.render("add_team_member", { id });
});

router.post("/add_problem_statement/:id",auth,fetchteamlead,fetchteammmember,checkpslimit,async(req, res) => {
    const id = req.params.id;
  
    try {
        console.log(req.body)
        const { idea, ideadesc ,psid } = req.body;
  if(!idea || !ideadesc || !psid){
    req.flash('message','Please fill the all fields');
    req.flash('type','danger')
    res.redirect(`/get_problem_statement/${id}`)
  }
  else{
        const pssubmitone = new PSsubmission({
            idea,
            ideadesc,
            psid,
            teamId: id,
        });
        const savedpssubmitone = await pssubmitone.save();
        res.redirect(`/get_problem_statement/${id}`);
    }
    } catch (error) {
        console.log(error);
        res.json({ msg: "Invalid response was sent" });
    }
});

//problem statement submit route
router.get("/add_problem_statement/:id", fetchteamlead,fetchteammmember,checkpslimit,auth,(req, res) => {
    const id = req.params.id;
    res.render("add_problem_statement", { id });
});

//route to get the team members
router.get("/get_team_intro/:id",auth,(req, res) => {
    const id = req.params.id;

    Teams.find({ teamid: id }, (err, teamdetail) => {

        if (err) {
            res.json(err);
        } else {
            function json2array(json) {
                var result = [];
                var keys = Object.keys(json);
                keys.forEach(function(key) {
                    result.push(json[key]);
                });
                return result;
            }
            const teamintro = json2array(teamdetail);
           
            res.render('get_team_intro', { teamintro , id })
        }
    });

});

//route to get teammember details

router.get('/get_team_member_details/:id', fetchteamlead,auth,(req, res) => {
    const id = req.params.id;

    TeamMember.find({ teamId: id }, (err, teammember) => {

        if (err) {
            res.json({ err });
        } else {
            function json2array(json) {
                var result = [];
                var keys = Object.keys(json);
                keys.forEach(function(key) {
                    result.push(json[key]);
                });
                return result;
            }
            const teammemberdetails = json2array(teammember);

            if (teammemberdetails.length > 0) {
                const success = "true";
                    let message=req.flash('message')[0]
                    let type=req.flash('type')[0]
                res.render('get_team_member_details', { teammemberdetails, id , message,type })
            } else {

                res.render('get_team_member_details', { teammemberdetails, id })
            }

        }

    });

})


//route to get the problem statements
router.get("/get_problem_statement/:id", auth,fetchteamlead,fetchteammmember,(req, res) => {
    const id = req.params.id;

    PSsubmission.find({ teamId: id }, (err, problemstatements) => {
        if (err) {
            res.redirect("/");
        } else {
            if (problemstatements == null) {
                res.render('get_problem_statement', { problemstatements, id })
            } else {
                const success = "true";
                res.render('get_problem_statement', { problemstatements, id })
            }
        }
    });
});

router.get("/aboutus", (req, res) => {
    res.render("aboutus");
});


//Dashboard code is here
router.get('/dashboard', auth,(req, res) => {
    console.log(req.user)
    res.render('dashboard',{user_id:req.user.id})
})

//delete team member
router.get('/delete_team_member/:id1/:id2',auth,(req,res)=>{
    let id1=req.params.id1;
    let id2=req.params.id2
   console.log(id1)
   console.log(id2)
    TeamMember.findByIdAndRemove(id2,(err,result)=>{
   
  if(err){
 
      res.json({
      message:err.message
      })
    
  }
  else{
    

      res.redirect(`/get_team_member_details/${id1}`);
     
  }
    })
  })



//update team member post route

router.post('/update_team_member/:id1/:id2',auth,(req,res)=>{
    let id1=req.params.id1;
    let id2=req.params.id2;
    console.log("printing request")

    TeamMember.findByIdAndUpdate(id2,{
        name1:req.body.name1,
        teamId:id1,
        emailid1:req.body.emailid1,
        phone1:req.body.phone1,
        branch1:req.body.branch1
    },(err,result)=>{
        if(err){
            res.json({err:err})
        }
        else{
            req.session.message={
                type:'success',
                message:'Updated user successfully'
            };
    
            res.redirect(`/get_team_member_details/${id1}`);
        }
    })
})

//update team member get route
router.get('/edit_team_member/:id1/:id2',auth,(req,res)=>{
    let id1=req.params.id1;
    let id2=req.params.id2;
    TeamMember.findById(id2,(err,user)=>{
        if(err){
            res.redirect('/');
        }
        else{
            if(user == null){
                res.redirect('/');
            }
            else{
                res.render('edit_team_member',{
                    title:"Edit User",
                    user:user,
                    teamId:id1,
                })
            }
        }
    })
})

router.post('/update_team_lead/:id1/:id2',auth,(req,res)=>{
    let id1=req.params.id1;
    let id2=req.params.id2;
    console.log("printing request")

    Teams.findByIdAndUpdate(id2,{
        teamname:req.body.teamname,
        teamid:id1,
        teamleadername:req.body.teamleadername,
        email:req.body.email,
        phone:req.body.phone,
        whatsapp:req.body.whatsappnumber,
        institution:req.body.institution
    },(err,result)=>{
        if(err){
            res.json({err:err})
        }
        else{
            req.session.message={
                type:'success',
                message:'Updated user successfully'
            };
    
            res.redirect(`/get_team_intro/${id1}`);
        }
    })
})

//update team member get route
router.get('/edit_team_lead/:id1/:id2',auth,(req,res)=>{
    let id1=req.params.id1;
    let id2=req.params.id2;
    Teams.findById(id2,(err,user)=>{
        if(err){
            res.redirect('/');
        }
        else{
            if(user == null){
                res.redirect('/');
            }
            else{
             
                res.render('edit_team_leader',{
                    title:"Edit User",
                    user:user,
                    teamid:id1,
                })
            }
        }
    })
})

module.exports = router;