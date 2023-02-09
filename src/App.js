import "./App.css";
import { useState, useRef, useEffect } from "react";
import { Matrix } from "ml-matrix";
import { useWindowResize } from "./hooks/useWindowResize";
import { useUtils } from "./utils";

function App() {
	const [screenWidth, screenHeight] = useWindowResize();
	const diagonal = screenWidth * Math.SQRT2;
	// const [canvasWidth, canvasHeight] = [screenWidth, screenHeight];
	const [canvasWidth, canvasHeight] = [diagonal, diagonal];
	const {
		testScenes,
		exampleMatrices,
		generateRandomScene,
		generateRandomSceneSet,
		drawCurve,
		drawAxes,
		drawGrid,
	} = useUtils({
		canvasWidth,
		canvasHeight,
	});
	// const [sceneSet, setSceneSet] = useState([]);
	// const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
	const [targetFPS, setTargetFPS] = useState(1 / 3);
	const [isPlaying, setIsPlaying] = useState(false);
	const [lastScene, setLastScene] = useState();
	const [sceneBuffer, setSceneBuffer] = useState([]);
	const canvasStyle = {
		width: canvasWidth,
		height: canvasHeight,
		position: "fixed",
		top: (-1 * (diagonal - screenHeight)) / 2,
		left: (-1 * (diagonal - screenWidth)) / 2,
	};
	const bufferSize = 2;
	let asyncRendering = false;
	let sceneSet = [...sceneBuffer];
	let selectedSceneIndex = 0;
	let lastFrameShownOn = 0;

	const canvasRef = useRef();
	const bufferCanvasRef = useRef();
	bufferCanvasRef.current = document.createElement("canvas");
	const animationRef = useRef();

	const handleKeyDown = (event) => {
		const key = event.code ?? event.type;

		// switch (key) {
		// 	case "Space":
		// 		setIsPlaying(true);
		// 		break;
		// 	case "mousedown":
		// 		setIsPlaying(true);
		// 		break;
		// }
	};

	const renderFrame = (scene, canvas) => {
		const context = canvas.getContext("2d");
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		context.fillStyle = "black";
		context.fillRect(0, 0, canvasWidth, canvasHeight);

		// drawAxes(context);
		// drawGrid(50, context);

		scene.forEach(([func, props]) => {
			func({ ...props, canvas });
		});
	};
	const renderFrameAsync = async (scene, canvas) => {
		asyncRendering = true;
		const context = canvas.getContext("2d");

		return new Promise((resolve) => {
			setTimeout(() => {
				context.clearRect(0, 0, canvasWidth, canvasHeight);
				context.fillStyle = "black";
				context.fillRect(0, 0, canvasWidth, canvasHeight);

				// drawAxes(context);
				// drawGrid(50, context);

				scene.forEach(([func, props]) => {
					func({ ...props, canvas });
				});
				createImageBitmap(canvas).then((bitmap) => {
					sceneSet.push(bitmap);
					// setSceneSet((prev) => [...prev, bitmap]);

					asyncRendering = false;
					resolve();
				});
			}, 0);
		});
	};

	const generateBuffer = async (bufferCanvas) => {
		if (asyncRendering === false && sceneSet.length < bufferSize) {
			const { randomScene } = generateRandomScene(3);
			await renderFrameAsync(randomScene, bufferCanvas);
		}
	};

	const init = async (bufferCanvas) => {
		for (let i = 0; i < bufferSize; i++) {
			await generateBuffer(bufferCanvas);
		}
	};

	const renderWithRAF = (timestamp, canvas, bufferCanvas) => {
		const now = performance.now();
		const bufferContext = bufferCanvas.getContext("2d");
		const canvasContext = canvas.getContext("2d");
		const bitmapContext = canvas.getContext("bitmaprenderer");

		generateBuffer(bufferCanvas);

		if (selectedSceneIndex >= 1) {
			// setSceneSet((prev) => prev.slice(0, selectedSceneIndex));
			sceneSet.splice(0, selectedSceneIndex);
			selectedSceneIndex = 0;
		}

		const [hCenter, vCenter] = [canvas.width / 2, canvas.height / 2];
		canvasContext.translate(hCenter, vCenter);
		canvasContext.rotate((-1 * (0.1 * Math.PI)) / 180);
		canvasContext.translate(-hCenter, -vCenter);

		const frame = sceneSet[selectedSceneIndex];
		if (frame) {
			if (now - lastFrameShownOn >= 1000 / targetFPS) {
				lastFrameShownOn = now;
				setLastScene(frame);
				canvasContext.drawImage(frame, 0, 0);
				selectedSceneIndex++;
			} else {
				canvasContext.drawImage(frame, 0, 0);
			}
		}
		animationRef.current = window.requestAnimationFrame((t) =>
			renderWithRAF(t, canvas, bufferCanvas)
		);
	};

	const renderSplashScreen = (canvas) => {
		const context = canvas.getContext("2d");
		context.strokeStyle = "white";

		for (let n = 3; n < 100; n++) {
			drawCurve(exampleMatrices.nGon({ n, size: 50, origin: [-25, -490] }), canvas);
		}
	};

	const play = () => {
		const canvas = canvasRef.current;
		const bufferCanvas = bufferCanvasRef.current;
		window.cancelAnimationFrame(animationRef.current);
		animationRef.current = window.requestAnimationFrame((timestamp) =>
			renderWithRAF(timestamp, canvas, bufferCanvas)
		);
	};

	const pause = () => {
		const canvas = canvasRef.current;
		const canvasContext = canvas.getContext("2d");
		window.cancelAnimationFrame(animationRef.current);
		lastScene ? canvasContext.drawImage(lastScene, 0, 0) : renderSplashScreen(canvas);
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const bufferCanvas = bufferCanvasRef.current;
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		bufferCanvas.width = canvasWidth;
		bufferCanvas.height = canvasHeight;

		isPlaying ? play() : pause();
	}, [screenHeight, screenWidth, isPlaying]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const bufferCanvas = bufferCanvasRef.current;
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		bufferCanvas.width = canvasWidth;
		bufferCanvas.height = canvasHeight;
		renderSplashScreen(canvas);
		init(bufferCanvas).then(() => {
			setSceneBuffer(sceneSet);
		});
		setTimeout(() => {
			setIsPlaying(true);
		}, 5000);
	}, []);

	return (
		<div className="App">
			{/* <div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					backgroundColor: "lightgrey",
					padding: 4,
					zIndex: 100,
				}}
			>
				<div>Viewport: {screenWidth}x{screenHeight}</div>
				<div>{isPlaying ? "playing" : "paused"}</div>
			</div> */}
			<canvas
				className="canvas"
				ref={canvasRef}
				style={canvasStyle}
				tabIndex={-1}
				onKeyDown={handleKeyDown}
				onMouseDown={handleKeyDown}
			></canvas>
		</div>
	);
}

export default App;
