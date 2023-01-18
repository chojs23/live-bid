import { client } from '$services/redis';
import { itemsKey, itemsByViewsKey } from '$services/keys';
import { deserialize } from './deserialize';

export const itemsByViews = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
	// ? redis sorted set sort will sort by member by default

	let results: any = await client.sort(itemsByViewsKey(), {
		// ? Join operation
		// ? Search the itemsKey('*') (* is member in sorted set) from redis collection and return the -> fields
		GET: [
			'#', // ? insert whaterver the original member was
			`${itemsKey('*')}->name`,
			`${itemsKey('*')}->views`,
			`${itemsKey('*')}->endingAt`,
			`${itemsKey('*')}->imageUrl`,
			`${itemsKey('*')}->price`
		],
		BY: 'nosort', // ?  If you want to sort by likes SORT books:likes BY books:*->year
		// ? nosort means don't do any sorting operation just do the data joining operation
		// ? items:views is already sorted by views
		DIRECTION: order,
		LIMIT: {
			offset,
			count
		}
	});

	const items = [];
	while (results.length) {
		const [id, name, views, endingAt, imageUrl, price, ...rest] = results;
		const item = deserialize(id, { name, views, endingAt, imageUrl, price });
		items.push(item);
		results = rest;
	}

	return items;
};
