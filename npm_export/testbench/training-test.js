'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..', '..');
const context = vm.createContext({
	console,
	setTimeout,
	clearTimeout,
	DEBUG: false,
	DEBUGBL: false,
	execMain: function(fn) { return fn(); },
	$: { now: Date.now, noop: function() {}, isArray: Array.isArray },
	giikerutil: { log: function() {}, updateBattery: function() {} }
});
function load(file) {
	vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
load('src/js/lib/isaac.js');
load('src/js/lib/mathlib.js');
load('src/js/hardware/bluetooth.js');
load('src/js/hardware/gancube.js');

function packet(header, values) {
	let bits = header;
	for (const value of values) {
		const word = Math.round(Math.abs(value) * 32767) | (value < 0 ? 32768 : 0);
		bits += word.toString(2).padStart(16, '0');
	}
	bits = bits.padEnd(160, '0');
	return new DataView(Uint8Array.from(bits.match(/.{8}/g), b => parseInt(b, 2)).buffer);
}
function near(actual, expected, label) {
	assert.equal(actual.length, expected.length, label);
	actual.forEach((n, i) => assert.ok(Math.abs(n - expected[i]) < 0.0001, label + ': ' + actual));
}

assert.equal(typeof context.GiikerCube.setGyroCallback, 'function', 'independent gyro channel exists');
let gyro = [];
let moves = 0;
context.GiikerCube.setGyroCallback(q => gyro.push(q));
context.GiikerCube.setCallback(() => moves++);
const expected = [0.5, -0.5, 0.5, 0.5]; // x, y, z, w
context.$.parseV2Data(packet('0001', [0.5, 0.5, -0.5, 0.5]));
context.$.parseV4Data(packet('1110110000001010', [0.5, 0.5, -0.5, 0.5]));
assert.equal(gyro.length, 2, 'Gen2 and Gen4 both deliver pose');
gyro.forEach(q => near(q, expected, 'signed-magnitude quaternion'));
assert.equal(moves, 0, 'pose is never a turn/state/timer event');
context.$.parseV2Data(packet('0001', [0, 0, 0, 0]));
context.$.parseV4Data(new DataView(Uint8Array.from([0xec, 0x0a, 0x7f]).buffer));
assert.equal(gyro.length, 2, 'zero and truncated gyro packets are rejected');
context.GiikerCube.stop();
assert.equal(gyro[gyro.length - 1], null, 'disconnect clears the gyro channel');

load('src/js/lib/giikerpose.js');
const pose = new context.GiikerPose();
const s = Math.SQRT1_2;
pose.update([0, 0, 0, 1]);
near(pose.get(0), [0, 0, 0, 1], 'initial calibration');
pose.update([s, 0, 0, s]);
near(pose.get(0), [s, 0, 0, s], 'rotation about red/right');
pose.update([0, 0, s, s]);
near(pose.get(0), [0, s, 0, s], 'white/up axis conversion');
pose.update([0, s, 0, s]);
near(pose.get(0), [0, 0, -s, s], 'blue/back axis conversion');
pose.reset();
pose.update([s, 0, 0, s]);
near(pose.get(0), [0, 0, 0, 1], 'recalibration at a non-identity pose');
pose.update([1, 0, 0, 0]);
near(pose.get(0), [s, 0, 0, s], 'relative motion after calibration');
const before = pose.get(0);
pose.get(4);
near(pose.get(0), before, 'rendering a new orientation does not reset calibration');
near(pose.get(4), [-s, 0, 0, s], 'z2 display orientation preserves the physical turn frame');
pose.reset();
assert.equal(pose.get(0), null, 'disconnect/reset discards the previous device pose');
console.log('GAN gyro decoding, calibration and coordinate-frame tests passed');

context.ISCSTIMER = false;
load('src/lang/en-us.js');
load('src/js/lib/min2phase.js');
load('src/js/scramble/scramble.js');
load('src/js/scramble/scramble_333_edit.js');
const labels = context.scrMgr.getExtra('lsll2', 0);
assert.equal(labels.length, 42, 'original case indices remain stable');
assert.equal(labels[0], 'Same top color-01');
assert.equal(labels[10], 'Different top colors adjacent-11');
assert.equal(labels[2], 'Different top colors separated-03');
assert.equal(labels[16], 'Cross color on top-17');
assert.equal(labels[24], 'Corner in slot-25');
assert.equal(labels[30], 'Edge in slot-31');
assert.equal(labels[36], 'Both in slot-37');
assert.equal(labels[41], 'Solved-42');
assert.equal(context.scrMgr.getExtra('zbls', 0)[0], 'Easy-01', 'ZBLS keeps original labels');
assert.deepEqual(context.scrMgr.getExtra('lsll2', 1), context.scrMgr.getExtra('zbls', 1), 'weights unchanged');
for (let mode = 0; mode < 3; mode++) {
	context.scrMgr.setEqPr(mode);
	const mask = labels.map(label => label.startsWith('Different top colors adjacent-') ? 1 : 0);
	for (let i = 0; i < 80; i++) {
		assert.ok(mask[context.scrMgr.rndState(mask, context.scrMgr.getExtra('lsll2', 1))], 'category filter respected in mode ' + mode);
	}
}
console.log('F2L categories, indices, probabilities and ZBLS preservation tests passed');

load('src/js/lib/cubeutil.js');
context.scrMgr.setEqPr(0);
const Cube = context.mathlib.CubieCube;
const counts = {};
for (let i = 0; i < 42; i++) {
	for (let sample = 0; sample < 3; sample++) {
		const scramble = context.scrMgr.scramblers.lsll2('lsll2', 0, i, 0);
		const cube = new Cube();
		scramble.trim().split(/\s+/).forEach(move => cube.selfMoveStr(move));
		assert.equal(cube.verify(), 0, 'legal generated case ' + i);
		const cp = cube.ca.findIndex(c => (c & 7) == 4);
		const ep = cube.ea.findIndex(e => (e >> 1) == 8);
		const facelets = cube.toFaceCube();
		let group;
		if (cp == 4 && ep == 8) {
			group = cube.ca[4] == 4 && cube.ea[8] == 16 ? 'Solved' : 'Both in slot';
		} else if (cp == 4) {
			group = 'Corner in slot';
		} else if (ep == 8) {
			group = 'Edge in slot';
		} else {
			const cornerSticker = Cube.cFacelet[cp].find(f => f < 9);
			const edgeSticker = Cube.eFacelet[ep].find(f => f < 9);
			assert.notEqual(cornerSticker, undefined);
			assert.notEqual(edgeSticker, undefined);
			if (facelets[cornerSticker] == 'D') group = 'Cross color on top';
			else if (facelets[cornerSticker] == facelets[edgeSticker]) group = 'Same top color';
			else {
				const distance = Math.abs((cornerSticker % 3) - (edgeSticker % 3)) +
					Math.abs(Math.floor(cornerSticker / 3) - Math.floor(edgeSticker / 3));
				group = distance == 1 ? 'Different top colors adjacent' : 'Different top colors separated';
			}
		}
		assert.equal(labels[i].split('-')[0], group, 'actual generated stickers match category ' + i);
		if (sample == 0) counts[group] = (counts[group] || 0) + 1;
	}
}
const llOnly = new Cube();
llOnly.selfMoveStr('U');
assert.equal(context.cubeutil.getStepProgress('f2l', llOnly.toFaceCube()), 0, 'last layer need not be solved');
llOnly.selfMoveStr('R');
assert.notEqual(context.cubeutil.getStepProgress('f2l', llOnly.toFaceCube()), 0, 'broken F2L is not complete');
console.log('126 generated F2L states and last-layer-independent completion passed:', counts);
