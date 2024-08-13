import clc from 'cli-color';
import playwright from 'playwright';

const scrapeKcbsEvents = async () => {

	const browser = await playwright.chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	console.log(clc.blue('Opening KCBS Page...'));
	await page.goto('https://mms.kcbs.us/members/evr_search.php?org_id=KCBA');

	console.log(clc.blue('Entering Search Criteria...'));
	await page.fill('[name=evr_begin]', '01/01/2024');
	await page.fill('[name=evr_end]', '12/31/2024');
	await page.selectOption('[name=evr_type]', { label: 'Master Series BBQ Contest' });
	await page.locator('[name=evr_map_type]').nth(2).check();
	await page.fill('[name=evr_region]', 'MT');
	await page.locator('[name=evr_region_type]').nth(1).check();

	console.log(clc.blue('Submitting...'));
	const responsePromise = page.waitForResponse(request => request.url().includes('evr_search_ol_json.php'));
	await page.getByRole('button', { name: 'Search' }).click();
	const response = await responsePromise;

	await page.waitForTimeout(1000); // wait for the container to be updated

	const rows = await page.locator('div#updated-events-container > div.row');
	const count = await rows.count();

	console.log(clc.blue(`Found ${count} events`));

	for (let i = 0; i < count; i++) {
		const row = await rows.nth(i);
		const col1 = await row.locator('div.col-md-4').nth(0);
		const name = await col1.locator('a > b').textContent() || '';
		const dates = await col1.locator('a > i').textContent() || '';
		let location = await col1.textContent() || '';

		location = location
			.replace(name, '')
			.replace(dates, '')
			.replace('UNITED STATES', '')
			.trim()

		console.log(clc.green(`Event: ${name}, ${dates}, ${location}`));
	}

	await browser.close();
};

scrapeKcbsEvents();
