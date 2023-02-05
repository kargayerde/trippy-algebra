import { useState, useLayoutEffect } from "react";

export const useWindowResize = () => {
	const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
	const updateSize = () => {
		setSize([window.innerWidth, window.innerHeight]);
	};
	
	useLayoutEffect(() => {
		window.addEventListener("resize", updateSize);
		return () => {
			window.removeEventListener("resize", updateSize);
		};
	}, []);
	
	return size;
};
