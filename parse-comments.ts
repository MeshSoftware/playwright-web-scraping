import fs from 'fs';
import { Base64 } from 'base64-string';
import ProgressBar from 'progress';
import { Db, IDb } from './data/db';
import { extractUsernames } from './data/utils';

import dayjs from 'dayjs'
import clc from 'cli-color';

const parseHarFile = async (db: IDb) => {

	console.log(clc.blue("Parsing ./files/comments.har..."));

	const harComments: any[] = [];
	let insertedCount = 0;
	let updatedCount = 0;

	const fileName = process.env.COMMENTS_HAR_FILE_NAME!;
	const mediaId = process.env.COMMENTS_MEDIA_ID!;
	const fileContents = fs.readFileSync(`./files/${fileName}.har`, { encoding: "utf-8" });
	const json = JSON.parse(fileContents);

	const entries: any[] = json.log.entries
		.filter((entry: any) => entry.request.url.startsWith(`https://www.instagram.com/api/v1/media/${mediaId}/comments`));

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
		const comments: any[] = JSON.parse(response).comments;
		harComments.push(...comments);
	});

	console.log(clc.blue(`Found ${harComments.length} comments`));

	const bar = new ProgressBar('saving comments [:bar] :percent', {
		complete: '=',
		incomplete: ' ',
		total: harComments.length,
		width: 80
	});

	const timestamp = dayjs().unix();

	for (let i = 0; i < harComments.length; i++) {

		const har = harComments[i];

		let comment = await db.findCommentById(har.pk);
		const follower = await db.findFollowerById(har.user_id);

		const tags = extractUsernames(har.text || '');

		if (comment) {

			comment.isFollower = follower ? true : false;
			comment.hasLikedMedia = har.has_liked_comment;
			comment.text = har.text;
			comment.tags = tags;

			const updatedComment = await db.saveComment(comment);

			if (updatedComment) {
				bar.tick();
				updatedCount++;
			}
		}
		else {

			comment = {
				_id: har.pk,
				userId: har.user_id,
				mediaId,
				isFollower: follower ? true : false,
				hasLikedMedia: har.has_liked_comment,
				text: har.text,
				tags,
				createdAt: timestamp
			};

			const newComment = await db.saveComment(comment);

			if (newComment) {
				bar.tick();
				insertedCount++;
			}
		}
	}

	console.log(clc.blue(`Inserted ${insertedCount} comments`));
	console.log(clc.blue(`Updated ${updatedCount} comments`));
};

const db = new Db(parseHarFile);