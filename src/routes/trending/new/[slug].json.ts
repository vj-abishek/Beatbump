/* eslint-disable prefer-const */
export async function get({ params, query }) {
	const { slug } = params
	// const ctx = query.get('params') || ''

	const response = await fetch(
		`https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`,
		{
			method: 'POST',
			body: JSON.stringify({
				context: {
					// clickTracking: { clickTrackingParams: `${itct}` },
					client: {
						clientName: 'WEB_REMIX',
						clientVersion: '0.1'
					},

					user: {
						enableSafetyMode: false
					}
				},
				// params: `${ctx}`,
				browseId: `${slug}`
			}),
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				Origin: 'https://music.youtube.com'
			}
		}
	)

	const data = await response.json()
	// console.log(data)
	let {
		header: {
			musicHeaderRenderer: {
				title: { runs: [{ text = '' } = {}] = [] } = {}
			} = {}
		} = {},
		contents: {
			singleColumnBrowseResultsRenderer: {
				tabs: [
					{
						tabRenderer: {
							content: { sectionListRenderer: { contents = [] } = {} } = {}
						} = {}
					} = {}
				] = []
			} = {}
		} = {}
	} = await data
	let type: string

	slug.includes('videos') ? (type = 'videos') : (type = 'albums')
	const sections = contents.map(({ gridRenderer = {} }) => {
		const { items = [] } = gridRenderer
		console.log(items)
		const section = items.map(({ musicTwoRowItemRenderer = {} }) => ({
			thumbnail:
				musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer
					.thumbnail.thumbnails[0].url,
			title: musicTwoRowItemRenderer.title.runs[0].text,
			subtitles: musicTwoRowItemRenderer.subtitle.runs,
			type: type,
			autoMixList:
				type == 'videos'
					? musicTwoRowItemRenderer.menu.menuRenderer.items[0]
							.menuNavigationItemRenderer.navigationEndpoint.watchEndpoint
							.playlistId
					: musicTwoRowItemRenderer.menu.menuRenderer.items[0]
							.menuNavigationItemRenderer.navigationEndpoint
							.watchPlaylistEndpoint.playlistId,
			videoId:
				musicTwoRowItemRenderer.menu.menuRenderer.items[0]
					.menuNavigationItemRenderer.navigationEndpoint?.watchEndpoint
					?.videoId,
			browseId:
				musicTwoRowItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId ||
				null
		}))
		return { section }
	})

	const getTitle = () => {
		const wordParts: Array<any> = slug.split('_')
		for (let i = 0; i < wordParts.length; i++) {
			wordParts[i] = wordParts[i][0].toUpperCase() + wordParts[i].substr(1)
		}
		wordParts.join(' ')
		const final = wordParts.shift()
		return wordParts.join(' ')
	}
	// console.log(sections)
	return {
		body: { title: getTitle(), sections, header: text },
		status: 200
	}
}
