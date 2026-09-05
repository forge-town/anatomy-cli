import { createFileRoute } from "@tanstack/react-router";
import { DocsPage } from "@/pages/docs-page";

export const Route = createFileRoute("/$")({ component: DocsPage });
