const config = require('../config/database');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const pool = mysql.createPool(config);
const db_sementara = new Map();
var crypto = require('crypto');
const { redirect } = require('express/lib/response');


let tokens = []
let refreshTokens = []

module.exports = {
 otorisasiToken(req,res,next) {
     const authHeader = req.headers['authorization']
     const token = authHeader && authHeader.split(' ')[1]
     if(token === null) return res.sendStatus(401)
     b = tokens.filter(e=> e.token === token)

     if(b.length !== 0) {
         if(b[0].token === token) {
             jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,user) => {
                if (err) return res.sendStatus(405)
                console.log('berhasil otorisasi token - >'+ JSON.stringify(user))
                req.user = user
                next()
             })
         }
     }
 },
  getUser(req, res) {
   pool.getConnection(function(err, connection){
       if(err) throw err
       connection.query(`SELECT * FROM pegawai`, function(error,results){
           res.send(results);

       })
   })
  },
  getUserBypath(req,res) {
      console.log(req.body)
      pool.getConnection(function(err, connection){
          if(err) throw err
          connection.query(`SELECT * FROM pegawai WHERE photo=?`,
          req.body.photo, function(error, results){
              console.log(results)
              res.send(results)
          })
      })
  },
    addUser(req, res) {
    //  console.log(req.file.path)
     console.log(JSON.stringify(req.body))
     if(!req.body.username || !req.body.password) {
         res.send('{"info": "harap masukan username/password"}')
     } else {
         if(req.body.username !== "" && req.body.password !== "" ){
             try {
    
                if(req.file == undefined) {
                    return res.status(400).send({pesan : "harap upload foto"})
                }
               

                  
                
                let data = ''
                if(req.body.password) {
                    req.body.password = crypto.createHash('sha256').update(req.body.password).digest('hex')
                    data = req.body
                } else {
                  res.sendStatus(404)
                }
               pool.getConnection(function(err,connection){
                   if(err)throw err
                   connection.query(`INSERT INTO pegawai set username=?,password=?, nama=?,photo=?,jabatan=?,no_telp=?,alamat=?, nip=?`,
                   [req.body.username, req.body.password, req.body.fullname, req.file.path,req.body.jabatan, req.body.notelp, req.body.alamat,req.body.nip ],
                   function(error, results){
                       if(error) throw error;
                       db_sementara.set(req.body.password+req.body.username, data)
                       console.log("berhasil daftar user")
                       res.send("berhasil daftar pegawai<a href='https://affandev.github.io/add-pegawai.html'>kembali</a>")
                       
                   });
                   connection.release()
               })
               
             } catch {
                 res.status(500).send({ pesan: "gagal upload file"})
             }
         }
         else {
             res.send('{"pesan" : "isi username/password anda}')
         }
         
     }
 },
 getAll(req, res) {
     pool.getConnection(function(err,connection){

        if(err) throw err;
        connection.query(`SELECT * FROM v_absensi`,function(error, results){
            if(error)throw error;
            res.send(results)
        })
     })
 },
 laporan(req, res){

    pool.getConnection(function(err, connection){
        if(err) throw err;
        connection.query(`SELECT distinct tanggal , v_absensi.* FROM v_absensi  WHERE Month(tanggal) = ?
        AND Year(tanggal) = ? ORDER BY tanggal`,[req.body.bulan, req.body.tahun], function(error, results){
            if(error) throw error;
            res.send(results)
        })
        connection.release();
    })
 },
 getJam(req,res){
    let dt = new Date()
    let jam = `${
        (dt.getMonth()+1).toString().padStart(2, '0')}-${
        dt.getDate().toString().padStart(2, '0')}-${
        dt.getFullYear().toString().padStart(4, '0')} ${
        dt.getHours().toString().padStart(2, '0')}:${
        dt.getMinutes().toString().padStart(2, '0')}`;
    res.send(jam)
 },
 isiAbsen(req,res) {
     let keterangan
    let dt = new Date()
    let jam = `${
        (dt.getMonth()+1).toString().padStart(2, '0')}-${
        dt.getDate().toString().padStart(2, '0')}-${
        dt.getFullYear().toString().padStart(4, '0')} ${
        dt.getHours().toString().padStart(2, '0')}:${
        dt.getMinutes().toString().padStart(2, '0')}`;
        let batas =`${
            (dt.getMonth()+1).toString().padStart(2, '0')}-${
            dt.getDate().toString().padStart(2, '0')}-${
            dt.getFullYear().toString().padStart(4, '0')} 08:45`;
        if(jam > batas ) {
            keterangan ="telat";
        } else {
            keterangan = "hadir"
        }
      pool.getConnection(function(err, connection){
          if(err) throw err;
          var id_user = req.body.id
         


          connection.query(`INSERT INTO absensi set id_user=?,absen=?,keterangan=?`,[JSON.stringify(id_user), keterangan, keterangan], function(error, results){
          
           res.send({pesan:'absensi berhasil',keterangan: keterangan})

          })
          connection.release()
      }) 
   
     
 },
 loginUser(req, res) {
     console.log(req.body)
     let status_break = false;
     if(!req.body.username && !req.body.password){
         status_break = true;
         res.send("eror, parameter tidak boleh kosong")
     }
     if(!status_break) {
         b = tokens.filter(e => e.user === req.body.username);
         b.forEach(f => tokens.splice(tokens.findIndex(e => e.user === f.user),1))
         var sandi = crypto.createHash('sha256').update(req.body.password).digest('hex');
         let token_user = { name: req.body.username }
         var result_db =  db_sementara.get(sandi+req.body.username)
         console.log(result_db)
         pool.getConnection(function(err,connection){
            connection.query(`SELECT * FROM pegawai WHERE username=? AND password=?`,
            [req.body.username, sandi ],
            function(error, results){
               if(results.length !== 0){
                if(sandi !== results[0].password) return res.send('{"pesan":"username / password salah"}')
                const accessToken = jwt.sign(token_user, process.env.ACCESS_TOKEN_SECRET)
                tokens.push({'token':accessToken,'user':req.body.username})
                console.log("berhasil login")
                json_hasil = {
                    "pesan" : "Login Berhasil",
                    "nama" : req.body.username ,
                    "jabatan": results[0].jabatan,
                    "token": accessToken }
                res.send(json_hasil)
               } else {
                   res.send({pesan :"username /password salah"})
               }
            });
            connection.release()
        })
       
         
      

         
     }
 } 
}