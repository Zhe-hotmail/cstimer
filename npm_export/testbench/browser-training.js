// Run in a loaded csTimer page: await runTrainingBrowserTests().
async function runTrainingBrowserTests() {
	function assert(value, message) {
		if (!value) throw new Error(message);
	}
	function near(a, b, label) {
		assert(a.length == b.length && a.every((n, i) => Math.abs(n - b[i]) < 0.0001), label + ': ' + a);
	}
	if (!window.twistyjs) {
		await new Promise((resolve, reject) => $.getScript('js/twisty.js', resolve).fail(reject));
	}
	const parent = $('<div>').css({ width: '350px', height: '350px' }).appendTo(document.body);
	const scene = new twistyjs.TwistyScene();
	parent.append(scene.getDomElement());
	let moves = 0;
	scene.addMoveListener(() => moves++);
	function init() {
		scene.initializeTwisty({ type: 'cube', dimension: 3, scale: 0.9 });
	}
	function matrices() {
		return scene.getTwisty().cubePieces.map(face => face.map(piece => piece[0].flatten().join(','))).flat();
	}
	init();
	const solved = matrices();
	const pose = new GiikerPose();
	const s = Math.SQRT1_2;
	pose.update([0, 0, 0, 1]);
	pose.update([s, 0, 0, s]);
	scene.setPose(pose.get(0));
	await new Promise(resolve => requestAnimationFrame(resolve));
	near(Object.values(scene.getTwisty()._3d.quaternion), [s, 0, 0, s], 'root orientation updated');
	assert(JSON.stringify(matrices()) == JSON.stringify(solved), 'gyro changed logical sticker state');
	assert(moves == 0, 'gyro emitted a move');
	const turn = scene.getTwisty().parseScramble("R U R'");
	scene.applyMoves(turn);
	const posedTurn = matrices();
	init();
	scene.applyMoves(scene.getTwisty().parseScramble("R U R'"));
	assert(JSON.stringify(matrices()) == JSON.stringify(posedTurn), 'pose changed move coordinates');
	scene.setPose(pose.get(0));
	near(Object.values(scene.getTwisty()._3d.quaternion), [s, 0, 0, s], 'pose survives a new case');

	// Compare all 24 orientation frames to actual center positions in the renderer.
	const normals = [[0, 1, 0], [1, 0, 0], [0, 0, 1], [0, -1, 0], [-1, 0, 0], [0, 0, -1]];
	for (let ori = 0; ori < 24; ori++) {
		init();
		if (ori) scene.applyMoves(scene.getTwisty().parseScramble(mathlib.CubieCube.rot2str[ori]));
		const rightCenter = scene.getTwisty().cubePieces[1][4][0];
		const q = pose.get(ori);
		const n = normals[mathlib.CubieCube.rotCube[ori].ct[1]];
		near([rightCenter.n14, rightCenter.n24, rightCenter.n34], n.map(v => v * 3), 'right center ' + ori);
		near(q, [s * n[0], s * n[1], s * n[2], s], 'pose conjugation ' + ori);
	}
	parent.remove();

	// Actual timer wiring: injected protocol gyro packets cannot start a solve.
	kernel.setProp('giiVRC', 'v');
	kernel.setProp('giiGyro', true);
	kernel.setProp('giiMode', 'at');
	kernel.setProp('scrType', 'lsll2');
	await new Promise(resolve => setTimeout(resolve, 600));
	$('#scrambleDiv input[type=button]').first().trigger('click');
	assert($('.sflt input[type=checkbox]').length == 42, 'F2L selection should expose all original cases');
	assert($('.sflt').text().includes(F2L_GROUPS.split('|')[1]), 'adjacent category missing from selection UI');
	kernel.hideDialog();
	timer.giiker.setEnable('g');
	kernel.hideDialog();
	const status = timer.status();
	GiikerCube.gyroCallback([0, 0, 0, 1], 'GAN Gen2');
	GiikerCube.gyroCallback([0, 0, s, s], 'GAN Gen2');
	assert(timer.status() == status, 'gyro started/stopped timer');
	assert($('.giiker-gyro button').is(':visible'), 'calibration control not visible');
	$('.giiker-gyro button').trigger('click');
	assert(timer.status() == status, 'calibration changed timer status');
	GiikerCube.gyroCallback(null);
	assert($('.giiker-gyro span').text() == GIIKER_GYRO_WAIT, 'disconnect did not clear pose status');
	timer.giiker.setEnable('s');
	return 'Renderer, pose/turn isolation, case reset, 24 orientations, timer and calibration passed';
}
