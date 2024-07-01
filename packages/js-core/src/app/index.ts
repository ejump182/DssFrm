import { setAttributeInApp } from "@formbricks/lib/js/attributes";
import { ErrorHandler } from "@formbricks/lib/js/errors";
import { Logger } from "@formbricks/lib/js/logger";
import { TJsAppConfigInput, TJsTrackProperties } from "@formbricks/types/js";
import { CommandQueue } from "../shared/commandQueue";
import { trackCodeAction } from "./lib/actions";
import { initialize } from "./lib/initialize";
import { checkPageUrl } from "./lib/noCodeActions";
import { logoutPerson, resetPerson } from "./lib/person";

const logger = Logger.getInstance();

logger.debug("Create command queue");
const queue = new CommandQueue();

const init = async (initConfig: TJsAppConfigInput) => {
  ErrorHandler.init(initConfig.errorHandler);
  queue.add(false, "app", initialize, initConfig);
  await queue.wait();
};

const setEmail = async (email: string): Promise<void> => {
  setAttribute("email", email);
  await queue.wait();
};

const setAttribute = async (key: string, value: any): Promise<void> => {
  queue.add(true, "app", setAttributeInApp, key, value);
  await queue.wait();
};

const logout = async (): Promise<void> => {
  queue.add(true, "app", logoutPerson);
  await queue.wait();
};

const reset = async (): Promise<void> => {
  queue.add(true, "app", resetPerson);
  await queue.wait();
};

const track = async (name: string, properties?: TJsTrackProperties): Promise<void> => {
  queue.add<any>(true, "app", trackCodeAction, name, properties);
  await queue.wait();
};

const registerRouteChange = async (): Promise<void> => {
  queue.add(true, "app", checkPageUrl);
  await queue.wait();
};

const formbricks = {
  init,
  setEmail,
  setAttribute,
  track,
  logout,
  reset,
  registerRouteChange,
};

export type TFormbricksApp = typeof formbricks;
export default formbricks as TFormbricksApp;
