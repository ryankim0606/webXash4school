# webXash

WIP slightly Improved version of xash3d emscripten in the browser, written in Vue and Typescript

emscripten port by mittorn [https://github.com/FWGS/xash3d/blob/master/ports/README.emscripten.md](https://github.com/FWGS/xash3d/blob/master/ports/README.emscripten.md)

Assets from [https://github.com/iCrazyBlaze/Xash3D-Emscripten]()

### Improvements
- Better resolution support with resizable window (wip)
- Proper HUD scaling
- Nicer UI

### Todo:
- Rewrite to be compatible with newer BrowserFS versions. 
- Add filesystem access to load assets from a local game.
- Better mouse pointer translation for UI
- Finish Typescript stuff

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
