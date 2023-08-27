<script lang="ts">
	import { beforeUpdate, onDestroy, onMount } from 'svelte';
	import { randomAnimation } from './animations';
	import { fly } from 'svelte/transition';
	let container: HTMLDivElement;
	let i = 0;

	onMount(() => {
		random_animation();
	});

	let removeOldAnimation = () => {};

	const random_animation = async () => {
		removeOldAnimation();
		const anim = await randomAnimation();
		const controls = anim.default(container);
		removeOldAnimation = controls.stop;
		i++;
	};

	onDestroy(() => {
		container && container.dispatchEvent(new Event('destroy'));
	});
</script>

<div class="page-container">
	<div class="pixi-container" bind:this={container} />

	{#key i}
		<button
			class="next"
			in:fly={{ x: '200%', duration: 200, delay: 1000 }}
			out:fly={{ x: '200%', duration: 200 }}
			on:click={random_animation}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<path d="M0 0h24v24H0z" fill="none" />
				<path fill="currentColor" d="M8 5v14l11-7z" />
			</svg>
		</button>
	{/key}
</div>

<style lang="scss">
	.pixi-container {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}

	.next {
		position: absolute;
		right: 10px;
		bottom: 50%;
		width: 50px;
		height: 50px;
		background: #fff;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease-in-out;
		z-index: 999;

		&:hover {
			transform: scale(1.1);
		}
	}

	.page-container {
		width: 100vw;
		height: 100vh;
		position: relative;
		overflow: hidden;
	}
</style>
