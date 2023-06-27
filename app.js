const { render } = require('ejs');
const express = require('express');
const mysql = require('mysql');
const path = require('path');
const login = express();

login.use(express.static('public'))
login.set('views',  'views')
login.set('view engine', 'ejs')

login.get('/', (req, res) => {
    res.render('menu.ejs');
});
login.get('/reg.ejs', (req, res) => {
    res.render('reg.ejs');
});
login.get('/auth.ejs', (req, res) => {
    res.render('auth.ejs');
});
login.get('/main.ejs', (req, res) => {
    res.render('main.ejs');
});
login.listen(3000);

let flg_reg = false;
login.post('/reg', (req, res) => {
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
login.post('/auth', (req, res) => {
    let data = '';
    req.on('data', function(chunk) {
        data += chunk;
    }).on('end', function() {
        auth(data.split('&'));
        setTimeout(function () {
            if (flg_auth) {
                res.render('main.ejs');
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
        host: 'localhost',
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