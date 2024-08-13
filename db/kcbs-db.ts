import { Database } from 'sqlite3';
import fs from 'fs';
import dayjs from 'dayjs'

export type Event = {
	id: number;
	name: string;
	startDate: Date;
	endDate: Date;
	city: string;
	state: string;
	zip: string;
};

export type Result = {
	id: number;
	eventId: number;
	mediaId: string;
	category: string;
	rank: number;
	team: string;
	total: number;
};

export interface IDb {
	saveEvent(doc: Event): void;
}

export class Db implements IDb {

	private db: Database;

	constructor() {

		const filePath = './db/kcbs.db';

		if (fs.existsSync(filePath)) {
			this.db = new Database(filePath);
		}
		else {
			const db = new Database(filePath, (error) => {
				if (error) {
					return console.error(error.message);
				}

				db.exec(`
					CREATE TABLE events
					(
						id INTEGER PRIMARY KEY,
						name VARCHAR(100) NOT NULL,
						startDate INTEGER NOT NULL,
						endDate INTEGER NOT NULL,
						city VARCHAR(100) NOT NULL,
						state VARCHAR(2) NOT NULL,
						zip VARCHAR(10) NOT NULL
					);
				`);

				db.exec(`
					CREATE TABLE results
					(
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						eventId INTEGER NOT NULL,
						category VARCHAR(100) NOT NULL,
						rank INTEGER NOT NULL,
						team VARCHAR(100) NOT NULL,
						total REAL NOT NULL
					);
				`);
			});

			this.db = db;
		}
	}


	saveEvent(doc: Event): void {

		const { id, name, startDate, endDate, city, state, zip } = doc;
		const startDateUnix = dayjs(startDate).unix();
		const endDateUnix = dayjs(endDate).unix();

		this.db.run(
			`INSERT INTO events (id, name, startDate, endDate, city, state, zip)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT (id) DO UPDATE SET
				name = excluded.name,
				startDate = excluded.startDate,
				endDate = excluded.endDate,
				city = excluded.city,
				state = excluded.state,
				zip = excluded.zip;
			`,
			[id, name, startDateUnix, endDateUnix, city, state, zip],
			(error) => {
				if (error) {
					console.error(error.message);
				}
			}
		);
	}
}
