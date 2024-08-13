import fs from 'fs';
import { Base64 } from 'base64-string';

import clc from 'cli-color';

const parseHarFile = async () => {

	console.log(clc.blue("Parsing ./files/followers.har..."));

	let insertedCount = 0;
	let updatedCount = 0;

	const fileContents = fs.readFileSync("./files/followers.har", { encoding: "utf-8" });
	const json = JSON.parse(fileContents);
	const users: any[] = [];

	const entries: any[] = json.log.entries
		.filter((entry: any) => entry.request.url.startsWith(`https://www.instagram.com/api/v1/friendships/55945995077/followers`));

	const responses: any[] = entries
		.map((entry: any) => {
			if (entry.response.content.encoding && entry.response.content.encoding === "base64") {
				const base64 = new Base64();
				return base64.decode(entry.response.content.text);
			}
			else {
				return entry.response.content.text;
			}
		});

	responses.forEach((response: any) => {
		users.push(...JSON.parse(response).users);
	});

	fs.writeFileSync('./files/har-followers.json', JSON.stringify(users, null, 2));
}

parseHarFile();


