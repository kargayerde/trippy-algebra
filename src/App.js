import "./App.css";
import { useState, useRef, useEffect } from "react";
import { Matrix } from "ml-matrix";
import { useWindowResize } from "./hooks/useWindowResize";
import { useUtils } from "./utils";

function App() {
	const [screenWidth, screenHeight] = useWindowResize();
	const [canvasWidth, canvasHeight] = [screenWidth, screenHeight];
	const { testScenes, generateRandomScene, generateRandomSceneSet, drawAxes, drawGrid } =
		useUtils({
			canvasWidth,
			canvasHeight,
		});
	// const [sceneSet, setSceneSet] = useState(testScenes);
	const [FPS, setFPS] = useState("N/A");
	// const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
	const canvasStyle = {
		width: canvasWidth,
		height: canvasHeight,
		position: "fixed",
		top: 0,
		left: 0,
	};
	const frameRate = 1;
	let asyncRendering = false;
	let sceneSet = [];
	let selectedSceneIndex = 0;
	let lastFrameShown = 0;

	const canvasRef = useRef();
	const intervalRef = useRef();

	const handleKeyDown = (event) => {
		const key = event.key;

		// switch (key) {
		// 	case "ArrowLeft":
		// 		setSelectedSceneIndex((prev) => Math.max(prev - 1, 0));
		// 		break;
		// 	case "ArrowRight":
		// 		setSelectedSceneIndex((prev) =>
		// 			Math.min(prev + 1, Object.values(sceneSet).length - 1)
		// 		);
		// 		break;
		// }
	};

	const renderFrame = (scene, context) => {
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		context.fillStyle = "black";
		context.fillRect(0, 0, canvasWidth, canvasHeight);

		// drawAxes(context);
		// drawGrid(50, context);

		scene.forEach(([func, props]) => {
			func({ ...props, context });
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
					func({ ...props, context });
				});
				// console.log("resolved");
				createImageBitmap(canvas).then((bitmap) => {
					sceneSet.push(bitmap);

					asyncRendering = false;
					resolve();
				});
				// const bitmap = context.transferToImageBitmap();
			}, 0);
		});
	};

	// const renderWithInterval = () => {
	// 	clearInterval(intervalRef.current);
	// 	renderFrame(Object.values(sceneSet)[selectedSceneIndex]);
	// 	if (selectedSceneIndex === Object.values(sceneSet).length - 1)
	// 		setSceneSet(generateRandomSceneSet(100, 2));

	// 	intervalRef.current = setInterval(
	// 		() => setSelectedSceneIndex((prev) => (prev + 1) % Object.values(sceneSet).length),
	// 		1000 / frameRate
	// 	);
	// };

	const renderWithRAF = (timestamp, canvas, bufferCanvas) => {
		const now = performance.now();
		const bufferContext = bufferCanvas.getContext("2d");
		const bitmapContext = canvas.getContext("bitmaprenderer");
		// console.log({ timestamp, bitmapContext, bufferContext, canvas, bufferCanvas });
		// console.log({ asyncRendering });
		if (asyncRendering === false && sceneSet.length < 200) {
			const { randomScene } = generateRandomScene(2);
			renderFrameAsync(randomScene, bufferCanvas);
		}

		if (selectedSceneIndex >= 1) {
			let spliceCount = selectedSceneIndex;
			sceneSet.splice(0, spliceCount);
			selectedSceneIndex -= spliceCount;
		}

		// context.drawImage(bufferCanvas, 0, 0);
		// console.log({ sceneSet });

		// console.log(now - lastFrameShown);
		if (now - lastFrameShown >= 300) {
			lastFrameShown = now;
			bitmapContext.transferFromImageBitmap(sceneSet[selectedSceneIndex++]);
			console.log(sceneSet.length);
		}
		window.requestAnimationFrame((t) => renderWithRAF(t, canvas, bufferCanvas));
	};

	// useEffect(() => {
	// 	setSceneSet(generateRandomSceneSet(100, 2));
	// }, []);

	useEffect(() => {
		// renderWithInterval();
		const canvas = canvasRef.current;
		const bufferCanvas = document.createElement("canvas");
		// const bufferCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
		canvasRef.current.width = canvasWidth;
		canvasRef.current.height = canvasHeight;
		bufferCanvas.width = canvasWidth;
		bufferCanvas.height = canvasHeight;

		// renderFrame(randomScene, bufferContext);

		const { randomScene } = generateRandomScene(2);
		renderFrameAsync(randomScene, bufferCanvas).then(() => {
			// console.log("call");
			const requestID = window.requestAnimationFrame((timestamp) =>
				renderWithRAF(timestamp, canvas, bufferCanvas)
			);
		});
	}, [screenHeight, screenWidth]);

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
				<div>Width: {screenWidth}</div>
				<div>Height: {screenHeight}</div>
				<div>Scene Index: {selectedSceneIndex}</div>
				<div>Scene Count: {sceneSet.length}</div>
			</div> */}
			<canvas
				className="canvas"
				ref={canvasRef}
				style={canvasStyle}
				tabIndex={-1}
				onKeyDown={handleKeyDown}
			></canvas>
		</div>
	);
}

export default App;
