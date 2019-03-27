const fs = require('fs');
const libPath = require('path');
const { promisify } = require('util');

const CRONTAB_LOCATION = libPath.resolve(__dirname, './crontab');

let lastRunAtSecond = 0;
setInterval(() => {
	const date = new Date();
	date.setMilliseconds(0);
	const second = date.valueOf();
	if (second > lastRunAtSecond) {
		const runDate = date;
		run(runDate).catch(err => {
			console.error(`Error at ${runDate.toISOString()}`, err);
		});
		lastRunAtSecond = second;
	}
}, 1);

// ******************************************************

function run(date) {
	return loadCrons().then(crons => {
		for (const cron of crons) {
			tryExecute(cron, date);
		}
	});
}

function specifierMatches(specifier, value) {
	if (specifier.type === 'absolute') {
		return specifier.value === value;
	}

	// repeat: 2
	// 0 2 4 6 8 10
	return value % specifier.value === 0;
}

/**
 * @param {Cron} cron
 * @param {Date} date
 */
function tryExecute(cron, date) {
	const secondMatches = specifierMatches(cron.sec, date.getSeconds());
	const minuteMatches = specifierMatches(cron.min, date.getMinutes());
	const hourMatches = specifierMatches(cron.hr, date.getHours());
	if (secondMatches && minuteMatches && hourMatches) {
		console.log(`[${date.toISOString()}] Execute: ${cron.command}`);
	}
}

function parseCronSpecifier(str) {
	if (/^[0-9]+$/.test(str)) {
		// This is just the absolute minute/hour/day of the larger unit
		return {
			value: Number(str),
			type: 'absolute',
		};
	}

	if (str === '*') {
		// Repeat every unit
		return {
			value: 1,
			type: 'repeat',
		};
	}

	const match = /^\*\/([0-9]+)$/.exec(str);
	if (match) {
		// This is an "every x units" specifier
		return {
			value: Number(match[1]),
			type: 'repeat',
		};
	}

	throw `Invalid specifier: ${str}`;
}

function parseCron(line) {
	const match = /^(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/.exec(line);
	if (!match) {
		throw `Invalid syntax: ${line}`;
	}

	const cron = {
		sec: parseCronSpecifier(match[1]),
		min: parseCronSpecifier(match[2]),
		hr: parseCronSpecifier(match[3]),
		command: match[4],
	};

	return cron;
}

function loadCrons() {
	return promisify(fs.readFile)(CRONTAB_LOCATION, 'utf8').then(txt => {
		const crons = [];
		const lines = txt.split(/\r\n|\n\r|\n|\r/g);
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line || line[0] === '#') {
				continue;
			}

			try {
				const cron = parseCron(line);
				crons.push(cron);
			} catch (err) {
				throw new Error(
					`Error parsing crontab line ${i + 1}: ${err.message || err}`
				);
			}
		}

		return crons;
	});
}
