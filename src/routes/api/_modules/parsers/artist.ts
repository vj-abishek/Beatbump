import { parseArtistPage } from '$lib/js/artistUtils'

import type { ICarousel } from '$lib/types'

export const parseArtist = (data) => {
	const {
		header,

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
	} = data

	const parsed = parse(header, contents)

	return {
		...parsed[0]
	}
}

function parse(header: { musicImmersiveHeaderRenderer: any }, contents: any) {
	const carouselItems: ICarousel[] | null = []
	const thumbnail = []
	let description = ''
	let items = []
	const headerContent = []
	const newData = [
		parseArtistPage(header?.musicImmersiveHeaderRenderer, contents)
	]
	return newData.map((d) => {
		carouselItems.push(...d.carouselItems)
		headerContent.push(d[0])
		if (d[0]) {
			d[0].thumbnails?.forEach((h: any) => {
				thumbnail.push(h)
			})
		}
		if (d?.songs) {
			items = [...d.songs]
		} else {
			items = undefined
		}
		description = d[0].description

		return {
			header: headerContent[0],
			songs: items,
			thumbnail,
			carousels: carouselItems,
			description
		}
	})
}
