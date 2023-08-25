<script lang="ts">
	import { beforeUpdate, onDestroy, onMount } from 'svelte';
	let container: HTMLDivElement;

	onMount(() => {
		import('./animations').then((module) => {
			module.default(container);
		});
	});

	onDestroy(() => {
		container && container.dispatchEvent(new Event('destroy'));
	});
</script>

<div class="pixi-container" bind:this={container} />

<style lang="scss">
	.pixi-container {
		width: 100%;
		height: 100%;
	}
</style>
