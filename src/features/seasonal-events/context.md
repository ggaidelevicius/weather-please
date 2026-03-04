# Black Hole Seasonal Event — Continuation Context

## Project

`weather-please` at `/Users/gusgaidelevicius/Developer/weather-please`

## Task

Implement a black hole / accretion disk WebGL scene as a seasonal event for
April 10 (Event Horizon Day). The visual should match the reference demo at
https://github.com/vlwkaos/threejs-blackhole (MIT licensed port). The desired
composition is Interstellar-movie-like: shadow in upper-right, accretion disk
sweeping dramatically across the lower frame.

---

## Reference values (extracted from the demo's browser console at the desired composition)

```
cam_pos = (5.317, 0.270, 3.090)
cam_dir = (-0.9955, 0.0114, 0.0945)
cam_up  = (0.0872, 0.9962, 0.0)
fov     = 60.04
```

---

## Current implementation

File: `src/features/seasonal-events/events/black-hole.tsx`

The scene uses vanilla Three.js (no React Three Fiber) with a fullscreen
`PlaneGeometry` driven by a GLSL fragment shader that ray-traces Schwarzschild
geodesics with a flat accretion disk. Post-processing:
`UnrealBloomPass(128×128, strength=1.0, radius=0.5, threshold=0.6)` +
`OutputPass`.

### Current camera approach (as of latest change)

```typescript
const REF_CAM_POS = new Vector3(5.317, 0.27, 3.09)
const REF_CAM_DIR = new Vector3(-0.9955, 0.0114, 0.0945)
const REF_CAM_UP = new Vector3(0.0872, 0.9962, 0.0)
const THETA_INITIAL = Math.atan2(REF_CAM_POS.x, REF_CAM_POS.z) // ~60°

const updateCamera = (theta: number) => {
	const dTheta = theta - THETA_INITIAL
	const cosD = Math.cos(dTheta)
	const sinD = Math.sin(dTheta)
	uniforms.cam_pos.value.set(
		REF_CAM_POS.x * cosD + REF_CAM_POS.z * sinD,
		REF_CAM_POS.y,
		-REF_CAM_POS.x * sinD + REF_CAM_POS.z * cosD,
	)
	uniforms.cam_dir.value.set(
		REF_CAM_DIR.x * cosD + REF_CAM_DIR.z * sinD,
		REF_CAM_DIR.y,
		-REF_CAM_DIR.x * sinD + REF_CAM_DIR.z * cosD,
	)
	uniforms.cam_up.value.set(
		REF_CAM_UP.x * cosD + REF_CAM_UP.z * sinD,
		REF_CAM_UP.y,
		-REF_CAM_UP.x * sinD + REF_CAM_UP.z * cosD,
	)
}
```

Slow orbit: `CAM_ANGULAR_VELOCITY = 0.002` rad/s (imperceptibly slow).

### Key shader constants

```glsl
#define STEP 0.05
#define NSTEPS 600
const float DISK_IN = 2.0;
const float DISK_WIDTH = 4.0;
// fov uniform = 60.0
```

### Assets

```
src/features/seasonal-events/assets/milkyway.jpg
src/features/seasonal-events/assets/accretion_disk.png
src/features/seasonal-events/assets/star_noise.png
```

---

## What has been tried and failed

| Approach                                                                | Result                                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| FOV=100, BH_TARGET formula                                              | Shadow oblong/stretched                                                                                |
| FOV=60 + BH_TARGET_X=1.24, BH_TARGET_Y=−0.10 (back-solved from cam_dir) | cam_dir matched reference but cam_up was wrong (0.012 vs 0.087 x-component), causing wrong camera roll |
| Changing THETA_INITIAL 0→π/3                                            | No visible effect (disk is radially symmetric — azimuthal theta doesn't change composition)            |
| Rotating exact reference cam values around y-axis (latest attempt)      | User reports it "didn't work" — unknown what specifically is wrong                                     |

---

## What to investigate next

The user confirmed the latest rotation-based approach "didn't work." Possible
remaining issues:

1. **The BH may be partially or fully off-screen** depending on the user's
   window aspect ratio. With `cam_dir = (-0.9955, 0.0114, 0.0945)`, the shadow
   appears far to the upper-right. On a narrow window it could be clipped. Try
   reducing the tilt — use a cam_dir closer to pointing at origin to bring the
   BH toward screen centre.

2. **The reference demo may use OrbitControls pointing at origin**, meaning the
   BH is always screen-centre in the reference. The "upper-right" look the user
   wants might require pointing cam_dir toward origin but rolling the camera via
   a tilted cam_up so the disk sweeps diagonally.

3. **Try a completely static camera (no orbit), exact reference values**, and
   check whether the visual matches the reference screenshot. If it does, the
   orbit logic has a bug. If it doesn't, the shader itself differs from
   reference.

4. **Try cam_dir pointing directly at origin** (i.e. `normalize(-cam_pos)`) with
   `cam_up = (0.0872, 0.9962, 0)`. This centres the BH on screen but preserves
   the correct disk-sweep pattern from the incline angle.
