# csTimer

Professional Speedcubing/Training Timer

## Personal F2L trainer

This fork adds opt-in GAN Gen2/Gen4 gyroscope following and visual categories
for **3x3x3 CFOP > F2L single pair** (`lsll2`). It retains csTimer's Bluetooth
pairing, move processing, virtual-state remapping and continuous-training solver.

In Chrome or Edge, open the HTTPS site (not the embedded Teams browser), select
Bluetooth cube input, **Virtual** display, **Continuous training**, and enable
**Follow GAN gyroscope** under virtual/Bluetooth cube settings. Before the first
gyro sample, align the physical cube with the displayed orientation. Use
**Calibrate orientation** to re-align later; it does not reset the cube's state.
Pose is retained between exercises. Whole-cube rotations do not start the timer
or count as moves. Other displays and devices retain their existing behavior.
The status shows the protocol only after receiving valid gyro data; it does not
infer gyro support from a model name. Gen1/Gen3 gyro decoding is not implemented.
Hardware acceptance with the user's specific GAN cube is still required.

Use scramble options to select groups or individual case thumbnails. "Same top
color" compares the target corner's and edge's **U-face stickers**, not the U
center. "Different top colors adjacent" means their U-face stickers share a side;
"separated" means they do not. "Cross color on top" means the target corner's
cross-color sticker points up. Cases with pieces in the slot have separate
groups. Existing case numbers, probabilities, selections and ZBLS labels remain
unchanged. Deselect **Solved-42** for drills. Any solution restoring F2L is
accepted, regardless of the resulting last layer.

Build a static site on Windows or Linux with Node.js and Java 11+:

```
node npm_export/testbench/training-test.js
node experiment/build-static.js
node npm_export/testbench/static-test.js
```

The build reuses the Makefile source lists and bundled Closure compiler, and
writes `dist/local`. Serve that folder over localhost for development or HTTPS
for Bluetooth use. All assets use relative paths for GitHub project Pages.
Language selection, including `?lang=zh-cn`, works without PHP. The existing
Pages workflow builds this output; select **GitHub Actions** in repository
Settings > Pages when publishing. No server-side API or offline cache is
included. csTimer's hosted account/import/export services may not work on this
origin; use local file export for backups. Settings from cstimer.net do not
automatically transfer.

GAN packet layout reference:
[gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth/blob/65173e2cdd0fa38ef384f237f6da8d76c177ed1e/src/gan-cube-protocol.ts).
This fork remains GPL-3.0; its static About page links the source and license.

# Versions and Update Policy

Main version: https://cstimer.net/

Latest version: https://cstimer.net/new/

Source version: https://cstimer.net/src/

[Latest version](https://cstimer.net/new/) and [Source version](https://cstimer.net/src/) will always be the same as the [master](https://github.com/cs0x7f/csTimer/tree/master) branch of this project. While [Main version](https://cstimer.net/) will always be the same as [released](https://github.com/cs0x7f/csTimer/tree/released) branch of this project.

New features will firstly be implemented in [Latest version](https://cstimer.net/new/). After testing for several days, [Main version](https://cstimer.net/) will be updated if appropriate, depends on user feedback for the new function or update.

It is preferred to use HTTPS protocol to visit csTimer. Although HTTP is available, some functions might not work correctly, e.g. stackmatTimer, WCA login, etc.


# Using as Native APP

Currently, csTimer is able to work as a native app on mobile devices owing to [Progressive Web Apps](https://developers.google.com/web/progressive-web-apps/). Thus, when you open csTimer by chrome or some other modern browser on mobile devices, it will ask you whether to add csTimer to home screen. Then, you can use csTimer as a native app that also works without network access.


# Translation

[![Crowdin](https://badges.crowdin.net/cstimer/localized.svg)](https://crowdin.com/project/cstimer)

If you are willing to help translating cstimer into your native language, please go to [this](https://crowdin.com/project/cstimer) page and select your language. If your native language is not on the list, just contact me and I'll add it.


# Data Storage

Currently, all data (including settings, session data, etc) are stored in user browser's storage. More specificently, all settings are stored in localStorage, while session data (except session meta data) are stored in indexedDB or localStorage if indexedDB is not available.

Therefore, all data will be lost if you clear browser cache. For avoiding data loss, you might use the "export" function to export/import all your data to/from a file, csTimer's server or google storage.

# Data Imported to csTimer's Server / Google Storage

After [8280fda](https://github.com/cs0x7f/cstimer/commit/8280fdab9628c605c9abc1bc4a127e3e84016542), you are able to download data that is uploaded before the latest one from csTimer's Server / Google Storage, which might be useful for a mis-uploading. For Google Storage, csTimer will keep 10 latest uploaded data. For csTimer's server, 10 or more latest uploaded data will be kept. More specificently, I'll keep 10 latest uploaded data while others might be deleted due to our limited disk resource.


# Third-party Deployment

Some functions of csTimer might not work properly for domains except "cstimer.net", especially online-based export/import functions due to callback address verification. If you want to make csTimer work as a part of your own website, it is recommended to use <iframe>.


# csTimer module

After [cb6c4266](https://github.com/cs0x7f/cstimer/commit/cb6c42667dc5e68717b2d5ac8fb0623f87a5f1cd), you may use some functions of csTimer by the npm package [cstimer_module](https://www.npmjs.com/package/cstimer_module), e.g. amounts of scrambles. For specific usage, please refer to npm. If you have any problems, you can directly create issues in this project.
