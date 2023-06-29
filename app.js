const { render } = require('ejs');
const express = require('express');
const mysql = require('mysql');
const app = express();

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
app.listen(3000);

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