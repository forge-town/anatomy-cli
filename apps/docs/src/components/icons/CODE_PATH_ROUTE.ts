import { CODE_PATH_MAP } from "./CODE_PATH_MAP";

export const CODE_PATH_ROUTE = `M ${CODE_PATH_MAP.start.x} ${CODE_PATH_MAP.start.y} Q ${CODE_PATH_MAP.control.x} ${CODE_PATH_MAP.control.y} ${CODE_PATH_MAP.end.x} ${CODE_PATH_MAP.end.y}`;
