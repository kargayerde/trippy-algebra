import "./App.css";
import { useState, useRef, useEffect } from "react";
import { Matrix } from "ml-matrix";
import { useWindowResize } from "./hooks/useWindowResize";
import { useUtils } from "./utils";

function App() {
	const [screenWidth, screenHeight] = useWindowResize();
	const [canvasWidth, canvasHeight] = [screenWidth, screenHeight];
	const { testScenes, generateRandomSceneSet, drawAxes, drawGrid } = useUtils({
		canvasWidth,
		canvasHeight,
	});
	const [sceneSet, setSceneSet] = useState(testScenes);
	const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
	const canvasStyle = {
		width: canvasWidth,
		height: canvasHeight,
		position: "fixed",
		top: 0,
		left: 0,
	};
	const frameRate = 3;

	const canvasRef = useRef();
	const intervalRef = useRef();

	const renderFrame = (scene) => {
		const context = canvasRef.current.getContext("2d");
		context.clearRect(0, 0, canvasWidth, canvasHeight);

		canvasRef.current.width = canvasWidth;
		canvasRef.current.height = canvasHeight;

		context.fillStyle = "black";
		context.fillRect(0, 0, canvasWidth, canvasWidth);

		// drawAxes(context);
		// drawGrid(50, context);

		scene.forEach(([func, props]) => {
			func({ ...props, context });
		});
	};

	const handleKeyDown = (event) => {
		const key = event.key;

		switch (key) {
			case "ArrowLeft":
				setSelectedSceneIndex((prev) => Math.max(prev - 1, 0));
				break;
			case "ArrowRight":
				setSelectedSceneIndex((prev) =>
					Math.min(prev + 1, Object.values(sceneSet).length - 1)
				);
				break;
		}
	};

	useEffect(() => {
		const randomScenes = generateRandomSceneSet(300, 2);
		setSceneSet(randomScenes);
	}, []);

	useEffect(() => {
		clearInterval(intervalRef.current);
		renderFrame(Object.values(sceneSet)[selectedSceneIndex]);

		intervalRef.current = setInterval(
			() => setSelectedSceneIndex((prev) => (prev + 1) % Object.values(sceneSet).length),
			1000 / frameRate
		);
	}, [screenHeight, screenWidth, selectedSceneIndex]);

	return (
		<div className="App">
			{/* <div style={{ position: "fixed", top: 0, left: 0, backgroundColor: "lightgrey", padding: 4, zIndex: 100 }}>
				<div>Width: {screenWidth}</div>
				<div>Height: {screenHeight}</div>
				<div>Scene Index: {selectedSceneIndex}</div>
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
