import { test, expect, BrowserContext } from '@playwright/test';

test.describe.configure({ mode: 'serial', timeout: 300000 });

test.describe('Scrape Events', () => {

	let browserContext: BrowserContext;

	test.beforeAll(async ({ browser }) => {
		browserContext = await browser.newContext();
	});

	test.afterAll(async () => {
		await browserContext.close();
	});

	test('find Montana events', async ({ browser }) => {

		const page = await browserContext.newPage();

		await page.goto('https://mms.kcbs.us/members/evr_search.php?org_id=KCBA');

		await page.fill('[name=evr_begin]', '01/01/2024');
		await page.fill('[name=evr_end]', '12/31/2024');
		await page.selectOption('[name=evr_type]', { label: 'Master Series BBQ Contest' });
		await page.locator('[name=evr_map_type]').nth(2).check();
		await page.waitForTimeout(1000);
		await page.fill('[name=evr_region]', 'MT');
		await page.locator('[name=evr_region_type]').nth(1).check();

		const responsePromise = page.waitForResponse(request => request.url().includes('evr_search_ol_json.php'));
		await page.getByRole('button', { name: 'Search' }).click();
		const response = await responsePromise;

		await page.waitForTimeout(1000); // wait for the container to be updated
		const results = await page.locator('div#updated-events-container > div.row').count();

		await expect(results).toBe(5);
	});
});