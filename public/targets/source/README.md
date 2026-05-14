# Target Source Images

Put original target images here before compiling them into `.mind` files.

Recommended source formats:

- `.jpg`
- `.png`
- `.webp`

Workflow:

1. Put the original target image in this folder.
2. Compile it with the MindAR Image Targets Compiler.
3. Download the generated `targets.mind`.
4. Rename it to match the exhibit, for example `demo-image.mind`.
5. Move the `.mind` file to `public/targets/`.
6. Update `src/config/exhibits.ts` if the file name changed.

Do not rename or edit the printed target image after compiling. If the image changes, compile a new `.mind` file.
