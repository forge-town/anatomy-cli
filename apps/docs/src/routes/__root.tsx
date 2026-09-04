import { createRootRoute } from "@tanstack/react-router";
import { withPayloadRoot } from "@payloadcms/tanstack-start/client";
import appCss from "../styles.css?url";
import { RootDocument } from "./-RootDocument";

export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "Anatomy — Repository structure as code" }, { name: "description", content: "Anatomy 文档：安装、使用与结构定义。" }], links: [{ rel: "stylesheet", href: appCss }] }),
  shellComponent: withPayloadRoot(RootDocument),
});
