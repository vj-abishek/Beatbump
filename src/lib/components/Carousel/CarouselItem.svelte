<script lang="ts">
	import { goto } from '$app/navigation'
	import Dropdown from '$components/Dropdown/Dropdown.svelte'
	import Loading from '$components/Loading/Loading.svelte'
	import db from '$lib/db'
	import lazy from '$lib/lazy'
	import list from '$lib/stores/list'
	import type { CarouselItem } from '$lib/types'
	import { alertHandler, currentTitle, key } from '$stores/stores'
	import { onMount, tick } from 'svelte'
	import { fade } from 'svelte/transition'
	import Popper from '../Popper/Popper.svelte'
	import { browseHandler } from './functions'
	import menu from './menu'
	export let section
	export let index
	export let item: CarouselItem
	export let type = ''
	export let kind = ''
	export let aspectRatio
	export let isBrowseEndpoint = false
	let loading
	let isHidden
	let RATIO_SQUARE = item.aspectRatio.includes('SQUARE') ? true : false
	let RATIO_RECT =
		item.aspectRatio.includes('TWO_LINE_STACK') ||
		item.aspectRatio.includes('16_9')
			? true
			: false

	const playAlbum = () => {
		list.startPlaylist(item.playlistId)
		key.set(0)
		currentTitle.set(item.title)
	}
	let DropdownItems: Array<Record<string, any>>
	DropdownItems = [
		{
			text: 'View Artist',
			icon: 'artist',
			action: async () => {
				window.scrollTo({
					behavior: 'smooth',
					top: 0,
					left: 0
				})
				await tick()

				goto(
					type == 'new'
						? `/artist/${item.subtitle[2].navigationEndpoint.browseEndpoint.browseId}`
						: `/artist/${item.subtitle[0].navigationEndpoint.browseEndpoint.browseId}`
				)
			}
		},
		{
			text: 'Add to Queue',
			icon: 'queue',
			action: () => {
				!kind && list.addNext(item, $key)
				kind == 'Videos' && list.addNext(item, $key)
				kind == 'Albums' && playAlbum()
				kind == 'Featured on' && list.startPlaylist(item.playlistId)
				alertHandler.set({
					msg: `${item.title} added to queue!`,
					type: 'success'
				})
			}
		},
		{
			text: 'Favorite',
			icon: 'heart',
			action: () => {
				console.log(item)
				db.setNewFavorite(item)
			}
		},
		{
			text: 'Share',
			icon: 'share',
			action: async () => {
				const shareData = {
					title: item.title,
					text: `Listen to ${item.title} on Beatbump`,
					url: `https://beatbump.ml/listen?id=${item.videoId}`
				}
				try {
					if (!navigator.canShare) {
						await navigator.clipboard.writeText(shareData.url)
						alertHandler.set({
							msg: 'Link copied Successfully!',
							type: 'success'
						})
					} else {
						const share = await navigator.share(shareData)
						alertHandler.set({ msg: 'Shared Successfully!', type: 'success' })
					}
				} catch (error) {
					alertHandler.set({ msg: 'Error!' + error, type: 'error' })
				}
			}
		}
	]

	type CustomEvent = Event & {
		currentTarget: EventTarget & HTMLImageElement
	}
	const errorHandler = (event: CustomEvent) => {
		event.currentTarget.onerror = null
		event.currentTarget.src =
			'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJpc29sYXRpb246aXNvbGF0ZSIgdmlld0JveD0iMCAwIDI1NiAyNTYiIHdpZHRoPSIyNTZwdCIgaGVpZ2h0PSIyNTZwdCI+PGRlZnM+PGNsaXBQYXRoIGlkPSJwcmVmaXhfX2EiPjxwYXRoIGQ9Ik0wIDBoMjU2djI1NkgweiIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNwcmVmaXhfX2EpIj48cGF0aCBmaWxsPSIjYWNhY2FjIiBkPSJNMCAwaDI1NnYyNTZIMHoiLz48ZyBjbGlwLXBhdGg9InVybCgjcHJlZml4X19iKSI+PHRleHQgdHJhbnNmb3JtPSJtYXRyaXgoMS4yOTkgMCAwIDEuMjcgOTUuNjg4IDE4Ni45NzEpIiBmb250LWZhbWlseT0iTGF0byIgZm9udC13ZWlnaHQ9IjQwMCIgZm9udC1zaXplPSIxMjAiIGZpbGw9IiMyODI4MjgiPj88L3RleHQ+PC9nPjxkZWZzPjxjbGlwUGF0aCBpZD0icHJlZml4X19iIj48cGF0aCB0cmFuc2Zvcm09Im1hdHJpeCgxLjI5OSAwIDAgMS4yNyA3OCA0Mi4yODYpIiBkPSJNMCAwaDc3djEzNUgweiIvPjwvY2xpcFBhdGg+PC9kZWZzPjwvZz48L3N2Zz4='
	}
	const clickHandler = async (event: Event, index) => {
		loading = true
		if (event) console.log(event)
		if (type == 'trending') {
			//
			isBrowseEndpoint
				? goto(
						'/release?type=' +
							encodeURIComponent(item.endpoint.pageType) +
							'&id=' +
							encodeURIComponent(item.endpoint?.browseId)
				  )
				: await list.initList(item.videoId, item.playlistId)

			key.set(0)
			loading = false
		}
		if (type == 'artist') {
			item?.endpoint?.pageType.includes('ARTIST') &&
				goto(`/artist/${item?.endpoint?.browseId}`)
			// if has videoId, and endpoint type is artist page, and is not Browse type
			!isBrowseEndpoint &&
			item.videoId !== undefined &&
			!item?.endpoint?.pageType.includes('ARTIST')
				? await list.initList(item.videoId, item.playlistId, index)
				: browseHandler(item.endpoint.pageType, item.endpoint.browseId)
			loading = false
		}
	}

	let srcImg =
		item.thumbnails[0].width <= 60
			? item.thumbnails[0].url.replace(/=(w(\d+))-(h(\d+))/g, '=w256-h256')
			: item.thumbnails[0].url
	if (kind === 'Singles') {
		DropdownItems.splice(1, 1)
		DropdownItems = [...DropdownItems]
		console.log(DropdownItems)
	}
</script>

<section
	class="item"
	class:item16x9={RATIO_RECT ? true : false}
	class:item1x1={RATIO_SQUARE ? true : false}
	transition:fade|local
	bind:this={section[index]}
>
	<div
		class="clickable"
		style="display:block;"
		use:menu
		on:menutouch={(e) => {}}
		on:click|stopPropagation={(e) => clickHandler(e, index)}
	>
		<div
			class="image"
			class:img16x9={RATIO_RECT ? true : false}
			class:img1x1={RATIO_SQUARE ? true : false}
			tabindex="0"
		>
			{#if loading}
				<Loading />
			{/if}
			<img
				alt="thumbnail"
				transition:fade|local
				on:error={errorHandler}
				class:img16x9={RATIO_RECT}
				type="image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
				src={RATIO_SQUARE
					? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mMMXgwAAU8A+CaOv30AAAAASUVORK5CYII='
					: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAQAAACRI2S5AAAAEklEQVR42mMMXsyAFzCOKgADAIveCLCeLfJzAAAAAElFTkSuQmCC'}
				use:lazy={{ src: srcImg }}
			/>
		</div>

		<div class="cont">
			<div class="text-wrapper">
				<span class="title">
					{item.title.length > 48
						? item.title.substring(0, 48) + '...'
						: item.title}
					<!-- {kind} -->
				</span>
				{#if item.subtitle}
					<div class="secondary subtitles">
						{#each item.subtitle as sub}
							<span class:hidden={sub?.navigationEndpoint}>{sub.text}</span>
							<a
								sveltekit:prefetch
								class:hidden={!sub?.navigationEndpoint}
								on:click|stopPropagation|preventDefault={() => {
									goto(
										'/artist/' +
											sub?.navigationEndpoint?.browseEndpoint?.browseId
									)
								}}
								href={'/artist/' +
									sub?.navigationEndpoint?.browseEndpoint?.browseId}
								><span>{sub.text}</span></a
							>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
	{#if !isBrowseEndpoint}
		<div class="menu">
			<!-- <Dropdown color="white" bind:isHidden items={DropdownItems} /> -->
			<Dropdown bind:isHidden items={DropdownItems} />
		</div>
	{/if}
</section>

<style lang="scss">
	@import '../../../global/stylesheet/components/_carousel-item.scss';

	.hidden {
		display: none !important;
		visibility: hidden !important;
	}
	.item {
		will-change: contents;
	}
	.image,
	img {
		will-change: contents;
		&:focus {
			outline: none;
		}
	}
	.item {
		> :is(*:hover) + * {
			opacity: 1 !important;
		}
	}
	.menu {
		opacity: 0;
		transition: 50ms opacity cubic-bezier(0.55, 0.055, 0.675, 0.19);
		&:hover {
			opacity: 1;
		}
		@media screen and (max-width: 550px) {
			opacity: 1;
		}
	}
</style>
