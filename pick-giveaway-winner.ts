import clc from 'cli-color';
import { Db } from './db/ig-db';
import dayjs from 'dayjs';

const pickWinner = async () => {

	const db = new Db();
	const followers = await db.getFollowersForDate(dayjs().toDate());

	if (followers.length) {
		const winner = followers[Math.floor(Math.random() * followers.length)];
		console.log(clc.green(`Winner: ${winner.username}`));
	}
	else {
		console.log(clc.yellow('No followers found.'));
	}
};

const run = async () => {
	pickWinner();
};

run();