<script lang="ts">
	import { beforeUpdate, onDestroy, onMount } from 'svelte';
	import { randomAnimation } from './animations';
	let container: HTMLDivElement;

	onMount(() => {
		random_animation();
	});

	let removeOldAnimation = () => {};

	const random_animation = async () => {
		removeOldAnimation();
		const anim = await randomAnimation();
		const controls = anim.default(container);
		removeOldAnimation = controls.stop;
	};

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
