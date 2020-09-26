import {MapFunction} from "../../slices/processing/project";

export function perInternalEdge(): MapFunction {
	return (edge) => {
		if(edge.external === false) {
			return { sourceLabel: edge.source, targetLabel: edge.target };
		}
	}
}
