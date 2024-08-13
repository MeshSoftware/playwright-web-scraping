import clc from 'cli-color';
import playwright from 'playwright';


const scrapeKcbsToy = async (year: number) => {

	const browser = await playwright.chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	console.log(clc.blue(`Opening ${year} TOY Page...`));
	await page.goto(`https://mms.kcbs.us/members/toy_scores.php?org_id=KCBA&region=ALL&contest_type=M&contest=5&year=${year}`);

	const categoryLists = await page.locator('div#accordion2');
	const chickenList = await categoryLists.locator('div[role=tablist]').nth(0);
	const ribList = await categoryLists.locator('div[role=tablist]').nth(1);
	const porkList = await categoryLists.locator('div[role=tablist]').nth(2);
	const brisketList = await categoryLists.locator('div[role=tablist]').nth(3);

	console.log(clc.blue('----------------------------------------'));
	console.log(clc.blue(`${year} TOY Standings:`));
	console.log(clc.blue('----------------------------------------'));

	const chickenCount = await chickenList.locator('tr').count();
	const ribCount = await ribList.locator('tr').count();
	const porkCount = await porkList.locator('tr').count();
	const brisketCount = await brisketList.locator('tr').count();

	const placeCss = 'tr:has-text("Bearded Boar BBQ") td';

	const chickenPlace = await chickenList.locator(placeCss)
		.nth(0)
		.innerText();

	const ribPlace = await ribList.locator(placeCss)
		.nth(0)
		.innerText();

	const porkPlace = await porkList.locator(placeCss)
		.nth(0)
		.innerText();

	const brisketPlace = await brisketList.locator(placeCss)
		.nth(0)
		.innerText();

	console.log(clc.green(`Chicken: ${chickenPlace}/${chickenCount}`));
	console.log(clc.green(`Rib: ${ribPlace}/${ribCount}`));
	console.log(clc.green(`Pork: ${porkPlace}/${porkCount}`));
	console.log(clc.green(`Brisket: ${brisketPlace}/${brisketCount}`));
	console.log('');

	await browser.close();
};

const run = async () => {
	await scrapeKcbsToy(2022);
	await scrapeKcbsToy(2023);
	await scrapeKcbsToy(2024);
};

run();
