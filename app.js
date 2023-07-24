const { render } = require('ejs');
const express = require('express');
const mysql = require('mysql');
const app = express();
const today = new Date();

app.use(express.static('public'))
app.set('views',  'views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('menu.ejs');
});
app.get('/reg.ejs', (req, res) => {
    res.render('reg.ejs');
});
app.get('/auth.ejs', (req, res) => {
    res.render('auth.ejs');
});
app.get('/main.ejs', (req, res) => {
    res.render('main.ejs');
});
app.get('/api/getCalender', async(req, res) => {
    try{
        console.log(req.query.month)
        const getCalenders = await getShift(req.query.month);
    } catch (err){
        console.log(err)
    }
});
app.post('/api/addCalender', async(req, res) => {
    try{
        const addCalenders = await calender.create(req.body);
    } catch (err){
        console.log(err)
    }
});
app.listen(3000);

// もしなければ次の月のtableを作成
const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const pool = mysql.createPool({
    user: 'root',
    password: '',
    database: 'shift',
});
pool.query(`CREATE table IF NOT EXISTS ${today.getFullYear()}_${today.getMonth()+2} SELECT name from user;`);
// 日毎のカラム作成
for (let i = 1; i <= endDate; i += 1){
    pool.query(
        `DESCRIBE ${today.getFullYear()}_${today.getMonth()+2} ${i}_;`,
        (error, results) => {
            if (results.length == 0) pool.query(`ALTER TABLE ${today.getFullYear()}_${today.getMonth()+2} ADD ${i}_ varchar(5);`);
        }
    )
}

let flg_reg = false;
app.post('/reg', (req, res) => {
    let data = '';
    req.on('data', function(chunk) {
        data += chunk;
    }).on('end', function() {
        reg(data.split('&'));
        setTimeout(function () {
            if (flg_reg) {
                res.redirect('/');
            } else {
                res.redirect('reg.ejs?msg=miss!');
                console.log('miss')
            }
        }, 1000);
    })
});

let flg_auth = false;
app.post('/auth', (req, res) => {
    let data = '';
    req.on('data', function(chunk) {
        data += chunk;
    }).on('end', function() {
        auth(data.split('&'));
        setTimeout(function () {
            if (flg_auth) {
                res.redirect('main.ejs');
            } else {
                res.redirect('auth.ejs?msg=IDまたはパスワードが正しくありません');
            }
        }, 1000);
    })
});

// ユーザー登録
function reg (param) {
    const name = param[0].split('=')[1];
    const pass = param[1].split('=')[1];

    // const mysql = require('mysql');
    const connection = mysql.createConnection({
        user: 'root',
        password: '',
    });
    connection.query('USE shift')
    connection.query(
        'INSERT INTO user (name, pass) VALUES ("' +
        name +
        '", "' +
        pass +
        '");'
        , function (err, result, fields) {
            if (err) {
                flg_reg = false;
                return;
            }
    });
    connection.end();
    flg_reg = true;
    return;

}

// ユーザー認証
function auth (param) {
    const name = param[0].split('=')[1];
    const pass = param[1].split('=')[1];

    const connection = mysql.createConnection({
        user: 'root',
        password: '',
    });
    connection.query('USE shift');
    connection.query(
        'SELECT name FROM user WHERE name = "' +
        name +
        '" AND pass = "' +
        pass +
        '";'
    , function (err, result, fields) {
        if (err || !result || result.length == 0 || result.affectedRows == 0 || !result[0] || !result[0].name || result[0].name != name) {
            flg_auth = false;
            return;
        }
    });
    connection.end();
    flg_auth = true;
    return;
}

// データ取得
function getShift (param) {
    const connection = mysql.createConnection({
        user: 'root',
        password: '',
    });
    connection.query('USE shift');
    connection.query(
        'SELECT * FROM ' +
        param +
        ';',
        (err, result) => {
            console.log(err)
            // console.log(result)
    });
    connection.end();
    return;
}