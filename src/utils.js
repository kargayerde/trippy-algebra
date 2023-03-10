import { Matrix } from "ml-matrix";

export const useUtils = ({ canvasWidth, canvasHeight }) => {
	const getRotationMatrix = (radianAngle) => {
		const [sinx, cosx] = [
			Number(Math.sin(radianAngle).toFixed(3)),
			Number(Math.cos(radianAngle).toFixed(3)),
		];
		const rotationMatrix = new Matrix([
			[cosx, sinx],
			[sinx * -1, cosx],
		]);

		return rotationMatrix;
	};

	const rotate = (curveMatrix, radianAngle) => curveMatrix.mmul(getRotationMatrix(radianAngle));

	const translate = (curveMatrix, x, y) => {
		let ret = new Matrix(curveMatrix);
		const columnCount = curveMatrix.rows; // yes

		for (let i = 0; i < columnCount; i++) {
			const [vecX, vecY] = [curveMatrix.get(i, 0), curveMatrix.get(i, 1)];
			ret.set(i, 0, vecX + x);
			ret.set(i, 1, vecY + y);
		}
		return ret;
	};

	const exampleMatrices = {
		triangle: ({ size, origin }) =>
			new Matrix([
				[origin[0], origin[1]],
				[origin[0] + size, origin[1]],
				[origin[0] + size, origin[1] + size],
			]),
		square: ({ size, origin }) =>
			new Matrix([
				[origin[0], origin[1]],
				[origin[0] + size, origin[1]],
				[origin[0] + size, origin[1] + size],
				[origin[0], origin[1] + size],
			]),
		nGon: ({ n, size, origin }) => {
			const turnAngle = (2 * Math.PI) / n;
			const baseVector = new Matrix([[size, 0]]);
			let ret = Matrix.zeros(n, 2);
			ret.setRow(1, baseVector);

			let prevVector = baseVector;

			for (let i = 2; i < n; i++) {
				const rotatedBase = rotate(baseVector, turnAngle * (i - 1));
				let nextVector = Matrix.add(prevVector, rotatedBase);
				ret.setRow(i, nextVector);
				prevVector = nextVector;
			}

			return translate(ret, origin[0], origin[1]);
		},
		// randocurve: new Matrix([
		// 	[0, 0],
		// 	[-50, -200],
		// 	[220, 50],
		// 	[220, 150],
		// 	[69, 420],
		// 	[-20, 50],
		// 	[-200, -50],
		// 	[-158, -100],
		// ]),
	};

	const drawRotations = ({
		canvas,
		curveConstructor,
		n,
		rotationStep,
		turnCount,
		baseSize,
		origin = [0, 0],
		growthFactor = 0,
		alpha = 0.1,
		fullRandom = false,
	}) => {
		const context = canvas.getContext("2d");
		context.globalAlpha = fullRandom ? Math.random() : alpha;
		for (let i = 0; i < 2 * turnCount; i += rotationStep) {
			const [angle, saturation, lightness] = fullRandom
				? [Math.PI * 2 * Math.random(), 100 * Math.random(), 100 * Math.random()]
				: [Math.PI * i, 100, 50];

			context.strokeStyle = `hsl(${toDegrees(angle)}, ${saturation}%, ${lightness}%)`;

			const outputCurve = rotate(
				curveConstructor({ size: baseSize + i * growthFactor, origin, n }),
				angle
			);

			drawCurve(outputCurve, canvas);
		}

		context.globalAlpha = 1;
	};
	const translateCoords = (x, y) => {
		const [midX, midY] = [canvasWidth / 2, canvasHeight / 2];

		return [midX + x, midY - y];
	};

	const toDegrees = (radian) => radian * (180 / Math.PI);
	const toRadians = (degree) => degree * (Math.PI / 180);

	const drawAxes = (context) => {
		const [midX, midY] = translateCoords(0, 0);

		context.strokeStyle = "white";
		context.beginPath();
		context.moveTo(midX, 0);
		context.lineTo(midX, canvasHeight);
		context.moveTo(0, midY);
		context.lineTo(canvasWidth, midY);
		context.stroke();
	};

	const drawGrid = (dimension, context) => {
		const stepSize = canvasHeight / dimension;
		const hDimension = Math.floor(canvasWidth / stepSize);
		const verticalLineOffset = (canvasWidth / 2) % stepSize;

		context.globalAlpha = 0.2;
		context.beginPath();

		for (let i = 0; i <= dimension; i++) {
			context.moveTo(0, i * stepSize);
			context.lineTo(canvasWidth, i * stepSize);
		}

		for (let i = 0; i <= hDimension; i++) {
			context.moveTo(i * stepSize + verticalLineOffset, 0);
			context.lineTo(i * stepSize + verticalLineOffset, canvasHeight);
		}

		context.stroke();
		context.globalAlpha = 1;
	};

	const drawCurve = (matrix, canvas) => {
		const context = canvas.getContext("2d");
		let startPoint = [];
		context.lineWidth = 1;
		const columnCount = matrix.rows; // yes

		context.beginPath();

		for (let i = 0; i < columnCount; i++) {
			const [vecX, vecY] = [matrix.get(i, 0), matrix.get(i, 1)];
			const [x, y] = translateCoords(vecX, vecY);

			if (i === 0) {
				startPoint = [x, y];
				context.moveTo(x, y);
			} else context.lineTo(x, y);
			if (i === columnCount - 1) {
				context.lineTo(startPoint[0], startPoint[1]);
			}
		}
		context.stroke();
	};

	const testScenes = {
		testSpiral: [
			[
				drawRotations,
				{
					curveConstructor: exampleMatrices.triangle,
					rotationStep: 0.01,
					turnCount: 16,
					baseSize: 10,
					growthFactor: 30,
					origin: [200, 200],
				},
			],
			[
				drawRotations,
				{
					curveConstructor: exampleMatrices.square,
					rotationStep: 0.01,
					turnCount: 16,
					baseSize: 10,
					growthFactor: 30,
					origin: [-200, -200],
				},
			],
		],
		testSpiral2: [
			[
				drawRotations,
				{
					curveConstructor: exampleMatrices.triangle,
					rotationStep: 0.01,
					turnCount: 16,
					baseSize: 10,
					growthFactor: 30,
					origin: [-200, 200],
				},
			],
			[
				drawRotations,
				{
					curveConstructor: exampleMatrices.square,
					rotationStep: 0.01,
					turnCount: 16,
					baseSize: 10,
					growthFactor: 30,
					origin: [200, -200],
				},
			],
		],
	};

	const generateRandomScene = (elementCount, maxEdges = 8) => {
		let randomScene = [];
		for (let j = 0; j < elementCount; j++) {
			const n = Math.floor(Math.random() * (maxEdges - 2) + 3);
			const curveConstructor = exampleMatrices.nGon;
			const rotationStep = Math.max(0.005 ,Math.random() / 20);
			const turnCount = Math.max(2, Math.random() * 20);
			const baseSize = Math.max(100, Math.random() * 200);
			const growthFactor = Math.random() * 60;
			const origin = [(Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000];
			const alpha = Math.max(0.05, Math.random() / 10);

			randomScene.push([
				drawRotations,
				{
					curveConstructor,
					n,
					rotationStep,
					turnCount,
					baseSize,
					growthFactor,
					origin,
					alpha,
				},
			]);
		}

		const identifier = `rand-${elementCount}el`;

		return { identifier, randomScene };
	};

	const generateRandomSceneSet = (size, elementCount) => {
		let randomSceneSet = {};
		for (let i = 0; i < size; i++) {
			const { identifier, randomScene } = generateRandomScene(elementCount);

			randomSceneSet[i + "-" + identifier] = randomScene;
		}
		return randomSceneSet;
	};

	return {
		testScenes,
		exampleMatrices,
		generateRandomSceneSet,
		generateRandomScene,
		drawCurve,
		drawAxes,
		drawGrid,
	};
};
