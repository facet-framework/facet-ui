import Counter from "./Counter";
import { withCounterLogic } from "./Counter.hoc";

export default withCounterLogic(Counter);

export * from "./Counter";
export * from "./Counter.hoc";
export { Counter };
