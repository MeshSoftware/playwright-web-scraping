import { Database } from 'sqlite3';
import fs from 'fs';
import dayjs from 'dayjs'

export type Follower = {
	id: number;
	username: string;
	name: string;
	isPrivate: boolean;
	createdDate: Date;
};

export interface IDb {
	getFollowersForDate(date: Date): Promise<Follower[]>;
	saveFollower(doc: Follower): void;
}

export class Db implements IDb {

	private db: Database;

	constructor() {

		const filePath = './db/ig.db';

		if (fs.existsSync(filePath)) {
			this.db = new Database(filePath);
		}
		else {
			const db = new Database(filePath, (error) => {
				if (error) {
					return console.error(error.message);
				}

				db.exec(`
					CREATE TABLE followers
					(
						id INTEGER PRIMARY KEY,
						username VARCHAR(100) NOT NULL,
						name VARCHAR(100) NOT NULL,
						isPrivate INTEGER NOT NULL,
						createdDate INTEGER NOT NULL
					);
				`);
			});

			this.db = db;
		}
	}

	async getFollowersForDate(date: Date): Promise<Follower[]> {

		const followers: Follower[] = [];
		const today = dayjs(date).startOf('day');
		const createdDateUnixStart = today.unix();
		const createdDateUnixEnd = today.add(1, 'day').unix();

		return new Promise((resolve, reject) => {

			const sql = this.db
				.prepare(
					`SELECT id, username, name, isPrivate, createdDate
					FROM followers
					WHERE createdDate >= ?
					AND createdDate < ?`
				)
				.all([createdDateUnixStart, createdDateUnixEnd], (error, rows) => {
					rows.forEach((row: any) => {
						followers.push({
							id: row.id,
							username: row.username,
							name: row.name,
							isPrivate: row.isPrivate === 1,
							createdDate: dayjs.unix(row.createdDate).toDate()
						});
					});

					resolve(followers);
				});
		});
	}

	saveFollower(doc: Follower): void {

		const { id, username, name, isPrivate, createdDate } = doc;
		const createdDateUnix = dayjs(createdDate).unix();

		this.db.run(
			`INSERT INTO followers (id, username, name, isPrivate, createdDate)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT (id) DO UPDATE SET
				username = excluded.username,
				name = excluded.name,
				isPrivate = excluded.isPrivate;
			`,
			[id, username, name, isPrivate ? 1 : 0, createdDateUnix],
			(error) => {
				if (error) {
					console.error(error.message);
				}
			}
		);
	}
}
