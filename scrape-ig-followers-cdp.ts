import fs from 'fs';
import clc from 'cli-color';
import playwright from 'playwright';
import ProgressBar from 'progress';
import { Db } from './db/ig-db';
import dayjs from 'dayjs';

// Start Chrome with remote debugging port on Mac:
// "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" www.instagram.com --remote-debugging-port=9222

const scrapeFollowers = async () => {

	const browser = await playwright.chromium.connectOverCDP('http://localhost:9222');
	const context = browser.contexts()[0]
	const page = context.pages()[0]

	console.log(clc.blue('Loading Profile...'));
	await page.getByText('Profile').click();

	const followersLink = page.getByText(/[0-9,.KM]+ followers/i);

	const followersCount = await followersLink
		.evaluate(node => Number(node.textContent?.replace(/[^0-9]/g, '')));

	console.log(clc.blue(`Followers Count: ${followersCount}`));

	const users: any[] = [];

	const bar = new ProgressBar('reading followers [:bar] :percent', {
		complete: '=',
		incomplete: ' ',
		total: followersCount,
		width: 80
	});

	page.on('requestfinished', async (request) => {
		if (request.url().startsWith('https://www.instagram.com/api/v1/friendships/55945995077/followers')) {

			const response = await request.response();
			const json = await response?.json();

			users.push(...json.users);
			bar.tick(json.users.length);
		}
	});

	console.log(clc.blue('Opening Followers Modal...'));
	await followersLink.click();

	const followersDialog = page.getByRole('dialog').nth(1);

	while (users.length < followersCount) {

		const waitTime = Math.floor(Math.random() * 1000) + 500;

		await page.waitForTimeout(waitTime);
		await followersDialog.locator('div:visible')
			.last()
			.hover();

		await page.mouse.wheel(0, 100);
	}

	await browser.close();

	fs.writeFileSync('./files/followers.json', JSON.stringify(users, null, 2));
};

const saveFollowers = async () => {

	const json = fs.readFileSync('./files/followers.json', 'utf8');
	const users = JSON.parse(json);

	const bar = new ProgressBar('saving followers [:bar] :percent', {
		complete: '=',
		incomplete: ' ',
		total: users.length,
		width: 80
	});

	const db = new Db();

	for (const user of users) {

		const doc = {
			id: user.pk,
			username: user.username,
			name: user.full_name,
			isPrivate: user.is_private,
			createdDate: new Date()
		};

		db.saveFollower(doc);
		bar.tick();
	}
};

const run = async () => {
	await scrapeFollowers();
	await saveFollowers();
};

run();
