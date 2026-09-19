function GiikerPose() {
	var basis = null;
	var relative = null;

	this.reset = function() {
		basis = relative = null;
	};

	this.update = function(quaternion) {
		// GAN: red +X, blue +Y, white +Z. Renderer: right +X, up +Y, front +Z.
		var q = [quaternion[0], quaternion[2], -quaternion[1], quaternion[3]];
		if (!basis) {
			basis = [-q[0], -q[1], -q[2], q[3]];
		}
		var a = basis;
		relative = [
			a[3] * q[0] + a[0] * q[3] + a[1] * q[2] - a[2] * q[1],
			a[3] * q[1] - a[0] * q[2] + a[1] * q[3] + a[2] * q[0],
			a[3] * q[2] + a[0] * q[1] - a[1] * q[0] + a[2] * q[3],
			a[3] * q[3] - a[0] * q[0] - a[1] * q[1] - a[2] * q[2]
		];
	};

	this.get = function(orientation) {
		if (!relative) {
			return null;
		}
		// Conjugate by the existing discrete cube orientation; never rotate its cubie state.
		var centers = mathlib.CubieCube.rotCube[orientation].ct;
		var normals = [[0, 1, 0], [1, 0, 0], [0, 0, 1], [0, -1, 0], [-1, 0, 0], [0, 0, -1]];
		var axes = [1, 0, 2];
		var result = [0, 0, 0, relative[3]];
		for (var axis = 0; axis < 3; axis++) {
			var normal = normals[centers[axes[axis]]];
			for (var i = 0; i < 3; i++) {
				result[i] += relative[axis] * normal[i];
			}
		}
		return result;
	};
}
