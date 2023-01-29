// * nodejs modules
const { rename } = require('fs');
const path = require('path');

// * third-party modules
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const CSVToJSON = require('csvtojson');
const moment = require('moment');

// * my modules
const pool = require('./database');
async function getPrizeMoney() {
	let prizesql = 'SELECT amount FROM amounts';
	let prize = await pool.query(prizesql);
	return prize[0].amount;
}

// * variables
let winnerNumber;
let winnerName;

// * routes

// * load homepage
router.get('/', (req, res, next) => {
	res.status(200).render('index', {
		status: 'success',
	});
});

// * load the logs page
router.get('/showLog', async (req, res, next) => {
	let logssql = 'SELECT * FROM logs ORDER BY id DESC LIMIT 10';
	let logs = await pool.query(logssql, (err, result) => {
		if (err) throw err;
	});

	// console.log(logs);
	// select convert(varchar, getdate(), 6)

	res.status(200).render('logs', {
		status: 'success',
		logs,
		logDate: moment(logs.date).format('ddd MMMM Do YYYY'),
	});
});

// * load winner page
router.get('/showWinner', async (req, res) => {
	let prizeMoney;
	getPrizeMoney().then((prize) => {
		prizeMoney = prize;
	});
	// * rondomise members database
	let winnersql =
		'SELECT Member_No, FirstName, LastName FROM members ORDER BY RAND()';

	let winner = await pool.query(winnersql, (err, result) => {
		if (err) throw err;
	});
	// * select a random entry from the randomised database
	let index = Math.floor(Math.random() * winner.length);
	winnerNumber = `${winner[index].Member_No}`;
	winnerName = `${winner[index].FirstName} ${winner[index].LastName}`;
	res.status(200).render('show_winner', {
		status: 'success',
		winnerNumber,
		winnerName,
		prizeMoney,
	});
});

// * load winner page
router.get('/winner', (req, res, next) => {
	let message0;
	let message1;
	let message2;
	let prizeMoney;
	getPrizeMoney()
		.then((prize) => {
			prizeMoney = prize;
			// * update messages for screen display
			message0 = `${winnerName}`;
			message1 = `was present and claimed $${prizeMoney}`;
			message2 = `Prize will be reset to $200 for the next draw...`;
		})
		.then(async () => {
			// * reset prize money in database
			let updatesql = 'UPDATE amounts SET amount = 200 WHERE id = 1';
			await pool.query(updatesql, (err, result) => {
				if (err) throw err;
			});
			// * update the logs
			let date = moment(Date.now()).format('ddd MMMM Do YYYY');
			updatesql = `INSERT INTO logs (number, name, amount, claimed, date) VALUES ('${winnerNumber}','${winnerName}','${prizeMoney}','TRUE','${date}')`;
			await pool.query(updatesql, (err, result) => {
				if (err) throw err;
			});
		})
		.then(() => {
			res.status(200).render('result', {
				status: 'success',
				message0,
				message1,
				message2,
				winner: true,
			});
		});
});

// * load non-winner page
router.get('/nonwinner', async (req, res, next) => {
	let message0;
	let message1;
	let message2;
	let prizeMoney;
	getPrizeMoney()
		.then((prize) => {
			prizeMoney = prize;
			if (prize > 1000) {
				prizeValue = true;
			}
			// * update messages for screen display
			message0 = `${winnerName}`;
			message1 = `was NOT present...`;
			message2 = `Prize will remain at $${prizeMoney} for the next draw...`;
		})
		.then(async () => {
			// * reset prize money
			let newAmount = prizeMoney;
			if (new Date().getDay() === 5) {
				newAmount = prizeMoney + 50;
				message2 = `Prize will go up to $${newAmount} for the next draw...`;
			}
			// * update prize money in database
			let updatesql = `UPDATE amounts SET amount = '${newAmount}' WHERE id = 1`;
			await pool.query(updatesql, (err, result) => {
				if (err) throw err;
			});
			// * update the logs
			let date = moment(Date.now()).format('ddd MMMM Do YYYY');
			updatesql = `INSERT INTO logs (number, name, amount, claimed, date) VALUES ('${winnerNumber}','${winnerName}','${prizeMoney}', 'FALSE', '${date}')`;
			await pool.query(updatesql, (err, result) => {
				if (err) throw err;
			});
		})
		.then(() => {
			res.status(200).render('result', {
				status: 'success',
				message0,
				message1,
				message2,
				prizeMoney,
			});
		});
});

// * load members upload page
router.get('/upload', (req, res, next) => {
	res.status(200).render('upload', {
		status: 'success',
	});
});

// * upload members route
router.post('/upload-csv', upload.single('upload-csv'), (req, res) => {
	let message0;
	let message1;
	let message2;
	let message3;
	let message4;
	let message5;
	let message6;

	rename(
		req.file.path,
		path.resolve('./uploads/' + req.file.originalname),
		(err) => {
			if (err) throw err;
		}
	);
	message0 = '"Financial Members.csv" uploaded...';
	// * convert CSV to JSON
	let financialMembers = [];
	let nonFinancialMembers = [];
	CSVToJSON()
		// * load members data
		.fromFile(
			path.join(__dirname, '..', 'uploads', 'Financial Members.csv')
		)
		// * map financial members
		.then((jsonObj) => {
			jsonObj.map((member) => {
				let date = member['Valid To'].split('/');
				date = `${date[2]}/${date[1]}/${date[0]}`;
				if (Date.parse(date) > Date.now()) {
					financialMembers.push(member);
				}
				if (Date.parse(date) < Date.now()) {
					nonFinancialMembers.push(member['Member_No']);
				}
			});
			message1 = 'File converted to JSON...';
		})
		.then(async () => {
			// * delete previous members table
			let dropsql = 'DROP TABLE members';
			await pool.query(dropsql, (err, result) => {
				if (err) throw err;
			});
			message2 = 'Members database deleted...';
			// * create new members table
			let createsql =
				'CREATE TABLE members (id INT AUTO_INCREMENT PRIMARY KEY, Member_No VARCHAR(255), LastName VARCHAR(255), FirstName VARCHAR(255))';
			await pool.query(createsql, (err, result) => {
				if (err) throw err;
			});
			message3 = 'Members database created...';
		})
		.then(() => {
			// * upload members to database
			financialMembers.forEach(async (member) => {
				let number = member.Member_No;
				let lastName = member.LastName.toUpperCase();
				let firstName =
					member.FirstName.charAt(0).toUpperCase() +
					member.FirstName.slice(1).toLowerCase();

				let members = [number, lastName, firstName];

				let uploadsql = `INSERT INTO members (Member_No, LastName, FirstName) VALUES (?,?,?)`;
				await pool.query(uploadsql, members, (err, result) => {
					if (err) throw err;
				});
			});

			message4 = 'Financial Members imported into database...';
		})
		.then(() => {
			let membersCount = financialMembers.length;
			message5 = `Successfully uploaded ${membersCount} financial members...`;
			if (nonFinancialMembers.length > 0) {
				message6 = `Members (${nonFinancialMembers}) are unfinancial...`;
			}
			res.status(200).render('upload_success', {
				status: 'success',
				message0,
				message1,
				message2,
				message3,
				message4,
				message5,
				message6,
			});
		});
});

// * export the routes
module.exports = router;
