// Benchmark charts. Data: middleware-comparison vsomeip/results-snapshot.md (one-way, mean)
// and notes/benchmarks.md "Network (Docker)" (RTT/2, mean). Latencies in ms, sizes in MiB.
(() => {
	if (window.ChartZoom) Chart.register(window.ChartZoom);
	const css = getComputedStyle(document.documentElement);
	const color = (name) => css.getPropertyValue(name).trim();

	const sizeLabels = ['64 B', '1 KiB', '16 KiB', '64 KiB', '256 KiB', '1 MiB', '4 MiB', '10 MiB'];
	const sizesMiB = [64 / 1048576, 1 / 1024, 16 / 1024, 64 / 1024, 0.25, 1, 4, 10];
	// Runs snapshot-20261005T175359Z (TCP) and snapshot-20261005T173031Z (UDP), npdu-default-timings all 0.
	const vsomeip = {
		tcp361: [0.602, 0.395, 0.635, 1.526, 4.599, 18.043, 68.46, 148.23],
		tcpFork: [0.349, 0.341, 0.421, 0.737, 1.936, 6.504, 24.405, 59.892],
		udp361: [0.682, 0.661, 1.193, 2.973, 10.51, 44.34, 191.582, 436.968],
		udpFork: [0.312, 0.321, 0.844, 2.662, 10.462, 38.271, 158.302, 395.841],
	};
	const net = {
		subspace: [0.075, 0.067, 0.066, 0.098, 0.158, 0.441],
		zenoh: [0.054, 0.066, 0.09, 0.123, 0.26, 0.713],
		cyclone: [0.031, 0.031, 0.084, 0.222, 0.719, 3.184],
	};

	const points = (ys) => ys.map((y, i) => ({ x: sizesMiB[i], y, size: sizeLabels[i] }));
	const line = (label, ys, c, extra = {}) => ({
		label,
		data: points(ys),
		borderColor: c,
		backgroundColor: c,
		borderWidth: 3,
		pointRadius: 3,
		...extra,
	});
	const fmt = (v) => Number(v.toPrecision(3));
	const yLinear = {
		type: 'linear',
		min: 0,
		ticks: { font: { size: 14 }, callback: (v) => `${fmt(v)} ms` },
		title: { display: true, text: 'mean latency', font: { size: 14 } },
	};
	const yLog = {
		type: 'logarithmic',
		ticks: {
			font: { size: 14 },
			callback: (v) => (['1', '2', '5'].includes(fmt(v).toExponential(0)[0]) ? `${fmt(v)} ms` : ''),
		},
		title: { display: true, text: 'mean latency (log)', font: { size: 14 } },
	};

	const options = (maxMiB, y = yLinear) => ({
		responsive: true,
		maintainAspectRatio: false,
		animation: false,
		plugins: {
			legend: { position: 'right', labels: { font: { size: 15 }, usePointStyle: true, pointStyle: 'line', boxWidth: 28 } },
			tooltip: {
				callbacks: {
					title: (items) => items[0].raw.size ?? '',
					label: (c) => `${c.dataset.label}: ${c.parsed.y} ms`,
				},
			},
			zoom: {
				zoom: {
					wheel: { enabled: true },
					drag: { enabled: true, backgroundColor: 'rgba(0, 149, 166, 0.12)', borderColor: color('--accent'), borderWidth: 1 },
					mode: 'xy',
				},
				limits: { x: { min: 0, max: maxMiB }, y: { min: y.min } },
			},
		},
		scales: {
			x: {
				type: 'linear',
				min: 0,
				max: maxMiB,
				ticks: { font: { size: 14 }, callback: (v) => `${fmt(v)} MiB` },
				title: { display: true, text: 'frame size', font: { size: 14 } },
			},
			y,
		},
	});

	const charts = {
		'chart-vsomeip': () => ({
			type: 'line',
			data: {
				datasets: [
					line('UDP · 3.6.1', vsomeip.udp361, color('--ineff'), { borderDash: [4, 3] }),
					line('UDP · fork', vsomeip.udpFork, color('--ineff')),
					line('TCP · 3.6.1', vsomeip.tcp361, color('--accent'), { borderDash: [4, 3] }),
					line('TCP · fork', vsomeip.tcpFork, color('--accent')),
				],
			},
			options: options(10, yLog),
		}),
		'chart-gains': () => {
			const gain = (before, after) => before.map((b, i) => Math.round((1 - after[i] / b) * 1000) / 10);
			const o = options(10, {
				type: 'linear',
				min: 0,
				max: 70,
				ticks: { font: { size: 14 }, callback: (v) => `${v}%` },
				title: { display: true, text: 'fork latency reduction', font: { size: 14 } },
			});
			o.scales.x = {
				type: 'logarithmic',
				min: sizesMiB[0],
				max: 10,
				afterBuildTicks: (axis) => (axis.ticks = sizesMiB.map((value) => ({ value }))),
				ticks: { font: { size: 14 }, callback: (v) => sizeLabels[sizesMiB.indexOf(v)] ?? '' },
				title: { display: true, text: 'frame size (log)', font: { size: 14 } },
			};
			o.plugins.tooltip.callbacks.label = (c) => `${c.dataset.label}: ${c.parsed.y}% lower`;
			delete o.plugins.zoom;
			return {
				type: 'line',
				data: {
					datasets: [
						line('TCP: one message per frame', gain(vsomeip.tcp361, vsomeip.tcpFork), color('--accent')),
						line('UDP: one message per 1.4 KB', gain(vsomeip.udp361, vsomeip.udpFork), color('--ineff')),
					],
				},
				options: o,
			};
		},
		'chart-middleware': () => ({
			type: 'line',
			data: {
				datasets: [
					line('vsomeip fork · UDP', vsomeip.udpFork.slice(0, 6), color('--ineff')),
					line('vsomeip fork · TCP', vsomeip.tcpFork.slice(0, 6), color('--accent')),
					line('Cyclone DDS · RTPS/UDP', net.cyclone, color('--design')),
					line('Zenoh · TCP', net.zenoh, color('--purple')),
					line('Subspace · TCP', net.subspace, color('--zero')),
				],
			},
			options: options(1, yLog),
		}),
	};

	const made = new Set();
	const render = (slide) => {
		slide?.querySelectorAll('canvas[data-chart]').forEach((canvas) => {
			if (made.has(canvas)) return;
			made.add(canvas);
			const chart = new Chart(canvas, charts[canvas.dataset.chart]());
			canvas.addEventListener('dblclick', () => chart.resetZoom());
		});
	};
	const renderAll = () => document.querySelectorAll('.reveal .slides section').forEach(render);

	const start = () => (/print-pdf/.test(location.search) ? renderAll() : render(Reveal.getCurrentSlide()));
	if (Reveal.isReady()) start();
	else Reveal.on('ready', start);
	Reveal.on('slidechanged', (e) => render(e.currentSlide));
})();
