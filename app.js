const { render } = require("ejs");
const express = require("express");
const mysql = require("mysql");
const app = express();
const bodyParser = require("body-parser");
const today = new Date();

// body-parserミドルウェアを使用
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.set("views", "views");
app.set("view engine", "ejs");

app.get("/", (req, res) => {
	res.render("menu.ejs");
});
app.get("/reg.ejs", (req, res) => {
	res.render("reg.ejs");
});
app.get("/auth.ejs", (req, res) => {
	res.render("auth.ejs");
});
app.get("/main.ejs", (req, res) => {
	res.render("main.ejs");
});
app.get("/api/getCalendar", async (req, res) => {
	try {
		const getCalendars = await getShift(req.query.month);
		// console.log(getCalendars)
		res.send(getCalendars);
	} catch (err) {
		console.log(err);
	}
});
app.post("/api/addCalendar", async (req, res) => {
	try {
		const params = req.body["params"];
		await sendShift(
			params["month"],
			params["user_name"],
			params["date"],
			params["time"]
		);
	} catch (err) {
		console.log(err);
	}
});
app.listen(3000);

// 2ヶ月後の月のtableを作成
createFutureTable(2);

// ユーザー登録api
let flg_reg = false;
app.post("/reg", (req, res) => {
	const data = req.body;
	// console.log(data);
	reg(data);
	setTimeout(function () {
		if (flg_reg) {
			res.redirect("/");
		} else {
			res.redirect("reg.ejs?msg=miss!");
			console.log("miss");
		}
	}, 1000);
});

// ユーザー認証api
let flg_auth = false;
app.post("/auth", (req, res) => {
	const data = req.body;
	const user_name = auth(data);
	setTimeout(function () {
		if (flg_auth) {
			res.redirect(`main.ejs?user_name=${user_name}`);
		} else {
			res.redirect("auth.ejs?msg=IDまたはパスワードが正しくありません");
		}
	}, 1000);
});

// 一覧ページapi
app.get("/summary.ejs", (req, res) => {
	const date = req.query["date"];
	const connection = mysql.createConnection({
		user: "root",
		password: "",
	});

	connection.query("USE shift");

	// 安全な方法でクエリを構築
	const sql = "SELECT * FROM ??";
	const values = [date];

	connection.query(sql, values, function (err, result, fields) {
		if (err) {
			console.error(err);
			// エラーハンドリングを行うか、エラーページにリダイレクトします。
			return res.status(500).send("Internal Server Error");
		}

		// データを取得できた場合の処理
		// console.log(result);

		// データをテンプレートに渡して表示
		res.render("summary.ejs", { data: result, date: date });
	});

	connection.end();
});

// ユーザー登録
function reg(param) {
	const name = param["name"];
	const pass = param["pass"];

	// const mysql = require('mysql');
	const connection = mysql.createConnection({
		user: "root",
		password: "",
	});
	connection.query("USE shift");
	connection.query(
		'INSERT INTO user (name, pass) VALUES ("' + name + '", "' + pass + '");',
		function (err, result, fields) {
			if (err) {
				flg_reg = false;
				return;
			}
		}
	);
	connection.end();
	flg_reg = true;
	return;
}

// ユーザー認証
function auth(param) {
	const name = param["name"];
	const pass = param["pass"];

	const connection = mysql.createConnection({
		user: "root",
		password: "",
	});
	connection.query("USE shift");
	connection.query(
		'SELECT name FROM user WHERE name = "' +
			name +
			'" AND pass = "' +
			pass +
			'";',
		function (err, result, fields) {
			if (
				err ||
				!result ||
				result.length == 0 ||
				result.affectedRows == 0 ||
				!result[0] ||
				!result[0].name ||
				result[0].name != name
			) {
				flg_auth = false;
				return;
			}
		}
	);
	connection.end();
	flg_auth = true;
	return name;
}

// データ取得
async function getShift(month) {
	const connection = mysql.createConnection({
		user: "root",
		password: "",
	});
	connection.query("USE shift");
	const shift = await new Promise((resolve, reject) => {
		connection.query("SELECT * FROM " + month + ";", (error, results) => {
			return resolve(results);
		});
	});
	connection.end();
	return shift;
}

// データ送信
async function sendShift(month, name, date, time) {
	const connection = mysql.createConnection({
		user: "root",
		password: "",
	});
	connection.query("USE shift");
	const shift = await new Promise((resolve, reject) => {
		connection.query(
			"UPDATE `" +
				month +
				`\` SET \`${date}\`='${time}' where \`name\`='${name}'` +
				";",
			(error, results) => {
				return resolve(results);
			}
		);
	});
	connection.end();
	return shift;
}

// nヶ月後のtableを作成
function createFutureTable(monthsAhead) {
	const today = new Date();
	let nextMonth = today.getMonth() + monthsAhead;
	let nextYear = today.getFullYear();

	if (nextMonth > 11) {
		nextMonth -= 12;
		nextYear++;
	}

	const endDate = new Date(nextYear, nextMonth + 1, 0).getDate();

	const pool = mysql.createPool({
		user: "root",
		password: "",
		database: "shift",
	});

	pool.query(
		`CREATE TABLE IF NOT EXISTS ${nextYear}_${
			nextMonth + 1
		} SELECT name FROM user;`
	);

	for (let i = 1; i <= endDate; i += 1) {
		pool.query(
			`DESCRIBE ${nextYear}_${nextMonth + 1} ${i}日;`,
			(error, results) => {
				if (results.length === 0) {
					pool.query(
						`ALTER TABLE ${nextYear}_${nextMonth + 1} ADD ${i}日 varchar(5);`
					);
				}
			}
		);
	}
}
