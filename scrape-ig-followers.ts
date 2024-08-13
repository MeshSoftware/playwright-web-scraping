import fs from 'fs';
import clc from 'cli-color';
import playwright from 'playwright';
import ProgressBar from 'progress';

const scrapeFollowers = async () => {

	const username = process.env.INSTAGRAM_USERNAME!;
	const password = process.env.INSTAGRAM_PASSWORD!;

	const browser = await playwright.chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	console.log(clc.blue('Opening Instagram...'));
	await page.goto('https://www.instagram.com/');

	console.log(clc.blue('Logging In...'));
	await page.fill("[name=username]", `${username}`);
	await page.fill('[type="password"]', `${password}`);
	await page.click("[type=submit]");

	await page.getByText('Not now').click();

	console.log(clc.blue('Loading Profile...'));
	await page.getByText('Profile').click();

	const followersLink = page.getByText(/[0-9,.KM]+ followers/i);

	const followersCount = await followersLink
		.evaluate(node => Number(node.textContent?.replace(' followers', '')));

	console.log(clc.blue(`Followers Count: ${followersCount}`));

	const users: any[] = [];

	const bar = new ProgressBar('saving followers [:bar] :percent', {
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
		await page.waitForTimeout(500);
		await followersDialog.locator('div:visible')
			.last()
			.hover();

		await page.mouse.wheel(0, 100);
	}

	await browser.close();

	fs.writeFileSync('./files/followers.json', JSON.stringify(users, null, 2));
};

scrapeFollowers();